import { createHash } from 'node:crypto';

import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, FieldValue } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import { buildLookupRncCallableOptions } from '../config/rncCallableOptions.js';
import { lookupRncRecord } from '../services/rncLookup.service.js';
import { RncValidationError } from '../utils/rncValidation.util.js';

const isValidationError = (error) =>
  error instanceof RncValidationError || error?.code === 'invalid-rnc';

const DEFAULT_RATE_LIMIT_MAX = 120;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_LOCAL_RATE_LIMIT_BUCKETS = 5000;
const rateLimitBuckets = new Map();

const readBooleanEnv = (value) =>
  ['1', 'true', 'yes', 'on'].includes(
    String(value ?? '')
      .trim()
      .toLowerCase(),
  );

const isDistributedRateLimitEnabled = () =>
  readBooleanEnv(process.env.RNC_LOOKUP_DISTRIBUTED_RATE_LIMIT);

const isDistributedRateLimitFailOpenEnabled = () =>
  readBooleanEnv(process.env.RNC_LOOKUP_DISTRIBUTED_RATE_LIMIT_FAIL_OPEN);

const resolveRateLimitKey = ({ authUid, request }) =>
  authUid ||
  request?.auth?.uid ||
  request?.app?.appId ||
  request?.rawRequest?.ip ||
  request?.rawRequest?.headers?.['x-forwarded-for'] ||
  null;

const pruneExpiredRateLimitBuckets = (now) => {
  if (rateLimitBuckets.size <= MAX_LOCAL_RATE_LIMIT_BUCKETS) return;

  for (const [key, bucket] of rateLimitBuckets) {
    if (now >= bucket.resetAt) {
      rateLimitBuckets.delete(key);
    }
  }
};

const assertRateLimit = ({ authUid, request }) => {
  const maxRequests =
    Number(process.env.RNC_LOOKUP_RATE_LIMIT_MAX) || DEFAULT_RATE_LIMIT_MAX;
  if (maxRequests <= 0) return;

  const windowMs =
    Number(process.env.RNC_LOOKUP_RATE_LIMIT_WINDOW_MS) ||
    DEFAULT_RATE_LIMIT_WINDOW_MS;
  const now = Date.now();
  pruneExpiredRateLimitBuckets(now);
  const key = resolveRateLimitKey({ authUid, request });
  if (!key) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    rateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  bucket.count += 1;
  if (bucket.count > maxRequests) {
    throw new HttpsError(
      'resource-exhausted',
      'Limite de consultas RNC excedido temporalmente.',
      {
        resetAt: new Date(bucket.resetAt).toISOString(),
      },
    );
  }
};

const hashRateLimitKey = (key) =>
  createHash('sha256').update(String(key)).digest('hex');

const assertDistributedRateLimit = async ({ key, maxRequests, windowMs }) => {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const resetAt = windowStart + windowMs;
  const keyHash = hashRateLimitKey(key);
  const bucketHash = hashRateLimitKey(`${keyHash}:${windowStart}:${windowMs}`);
  const bucketRef = db
    .collection('runtimeRateLimits')
    .doc('rncLookup')
    .collection('rncLookupBuckets')
    .doc(bucketHash);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(bucketRef);
    const count = Number(snapshot.exists ? snapshot.get('count') : 0) || 0;
    if (count >= maxRequests) {
      throw new HttpsError(
        'resource-exhausted',
        'Limite de consultas RNC excedido temporalmente.',
        {
          resetAt: new Date(resetAt).toISOString(),
        },
      );
    }

    transaction.set(
      bucketRef,
      {
        count: FieldValue.increment(1),
        keyHash,
        resetAt: new Date(resetAt),
        updatedAt: FieldValue.serverTimestamp(),
        windowMs,
        windowStart: new Date(windowStart),
      },
      { merge: true },
    );
  });
};

const assertLookupRateLimit = async ({ authUid, request }) => {
  const maxRequests =
    Number(process.env.RNC_LOOKUP_RATE_LIMIT_MAX) || DEFAULT_RATE_LIMIT_MAX;
  if (maxRequests <= 0) return;

  const windowMs =
    Number(process.env.RNC_LOOKUP_RATE_LIMIT_WINDOW_MS) ||
    DEFAULT_RATE_LIMIT_WINDOW_MS;
  const key = resolveRateLimitKey({ authUid, request });
  if (!key) {
    throw new HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  assertRateLimit({ authUid, request });

  if (isDistributedRateLimitEnabled()) {
    try {
      await assertDistributedRateLimit({ key, maxRequests, windowMs });
    } catch (error) {
      if (error instanceof HttpsError) throw error;

      logger.error('[lookupRnc] distributed rate limit failed', {
        error,
        failOpen: isDistributedRateLimitFailOpenEnabled(),
      });

      if (!isDistributedRateLimitFailOpenEnabled()) {
        throw new HttpsError(
          'unavailable',
          'No se pudo validar el limite distribuido de consultas RNC.',
        );
      }
    }
  }
};

const stripAuthFieldsFromLookupPayload = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  const lookupPayload = { ...payload };
  delete lookupPayload.sessionToken;
  return lookupPayload;
};

export const lookupRnc = onCall(
  buildLookupRncCallableOptions({
    cors: true,
    invoker: 'public',
  }),
  async (request) => {
    const startedAt = Date.now();
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) {
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');
    }
    await assertLookupRateLimit({ authUid, request });

    try {
      const result = await lookupRncRecord({
        payload: stripAuthFieldsFromLookupPayload(request?.data),
      });

      logger.info('[lookupRnc] lookup completed', {
        found: result.found,
        latencyMs: Date.now() - startedAt,
        source: result.source,
        status: result.status,
        authPresent: true,
        appCheckTokenPresent: Boolean(request?.app),
      });

      return result;
    } catch (error) {
      if (isValidationError(error)) {
        throw new HttpsError('invalid-argument', error.message, error.details);
      }

      logger.error('[lookupRnc] lookup failed', {
        error,
        latencyMs: Date.now() - startedAt,
      });
      throw new HttpsError('internal', 'No se pudo consultar el RNC.');
    }
  },
);
