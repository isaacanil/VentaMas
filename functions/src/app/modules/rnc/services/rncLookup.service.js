import {
  createRncLookupRepository,
  isRncRepositoryUnavailableError,
} from '../repositories/rncRepository.js';
import {
  normalizeRncNumber,
  resolveRncLookupInput,
} from '../utils/rncValidation.util.js';

const toIsoString = (date) =>
  date instanceof Date ? date.toISOString() : new Date(date).toISOString();

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const sanitizePrimitiveRecord = (record) => {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return null;
  }

  return Object.entries(record).reduce((acc, [key, value]) => {
    if (
      value == null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

export const normalizeRncLookupRecord = (record, fallbackRncNumber) => {
  const sanitized = sanitizePrimitiveRecord(record);
  if (!sanitized) return null;

  const rncNumber =
    toCleanString(sanitized.rnc_number) ||
    toCleanString(sanitized.rncNumber) ||
    toCleanString(sanitized.rnc) ||
    fallbackRncNumber;
  const fullName =
    toCleanString(sanitized.full_name) ||
    toCleanString(sanitized.fullName) ||
    toCleanString(sanitized.name) ||
    toCleanString(sanitized.razonSocial) ||
    toCleanString(sanitized.razon_social);

  return {
    ...sanitized,
    rnc_number: normalizeRncNumber(rncNumber),
    full_name: fullName,
  };
};

export const lookupRncRecord = async ({
  now = () => new Date(),
  payload = null,
  repository = createRncLookupRepository(),
  rnc = null,
} = {}) => {
  const { rnc: rncNumber } =
    rnc == null ? resolveRncLookupInput(payload) : { rnc: normalizeRncNumber(rnc) };
  const checkedAt = toIsoString(now());

  try {
    const record = await repository.findByRnc(rncNumber);
    const normalizedRecord = normalizeRncLookupRecord(record, rncNumber);
    const metadata =
      typeof repository.getSnapshotMetadata === 'function'
        ? await repository.getSnapshotMetadata()
        : {};

    return {
      checkedAt,
      data: normalizedRecord,
      found: Boolean(normalizedRecord),
      full_name: normalizedRecord?.full_name ?? null,
      lastUpdated: metadata?.lastUpdated ?? null,
      ok: true,
      record: normalizedRecord,
      rnc_number: rncNumber,
      source: repository.source ?? 'unknown',
      status: normalizedRecord ? 'found' : 'not_found_in_contributors_snapshot',
    };
  } catch (error) {
    if (isRncRepositoryUnavailableError(error)) {
      return {
        checkedAt,
        data: null,
        found: false,
        full_name: null,
        ok: false,
        record: null,
        repository: {
          reason: error.details?.reason ?? 'unavailable',
          source: error.details?.source ?? repository.source ?? 'unavailable',
        },
        rnc_number: rncNumber,
        source: error.details?.source ?? repository.source ?? 'unavailable',
        status: 'unavailable',
      };
    }

    throw error;
  }
};
