import { HttpsError } from 'firebase-functions/v2/https';

import { resolveGisysFactToken } from '../config/gisysFact.config.js';

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');
const trimSlashes = (value) => String(value || '').replace(/^\/+|\/+$/g, '');

const buildVersionedUrl = (config, path) => {
  const baseUrl = trimTrailingSlash(config.baseUrl);
  const cleanPath = trimSlashes(path);
  const baseHasVersion = /\/v\d+$/i.test(baseUrl);
  return `${baseUrl}/${baseHasVersion ? cleanPath : `v1/${cleanPath}`}`;
};

const buildIssueUrl = (config) => {
  const configuredPath = config.issuePath;
  if (configuredPath) {
    return `${trimTrailingSlash(config.baseUrl)}/${trimSlashes(configuredPath)}`;
  }

  return buildVersionedUrl(config, 'ecf/issue');
};

const buildStatusUrl = (config, submissionId) =>
  buildVersionedUrl(config, `ecf/${encodeURIComponent(submissionId)}/status`);

const buildRefreshUrl = (config, submissionId) =>
  buildVersionedUrl(
    config,
    `submissions/${encodeURIComponent(submissionId)}/refresh-status`,
  );

const buildHealthUrl = (config) => buildVersionedUrl(config, 'health');

export const buildGisysFactLinks = ({ config, submissionId }) => {
  if (!submissionId) return null;
  const encoded = encodeURIComponent(submissionId);
  return {
    status: buildVersionedUrl(config, `ecf/${encoded}/status`),
    xml: buildVersionedUrl(config, `ecf/${encoded}/xml`),
    signedXml: buildVersionedUrl(config, `ecf/${encoded}/xml?kind=signed-ecf`),
    pdf: buildVersionedUrl(config, `ecf/${encoded}/pdf`),
  };
};

const readJsonResponse = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { rawText: text };
  }
};

const SENSITIVE_RESPONSE_KEY_PATTERN =
  /authorization|body|certificate|password|payload|raw|request|secret|signature|token|xml/i;
const SUMMARY_TEXT_MAX_LENGTH = 240;

const redactSummaryText = (value) =>
  String(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b\d{3}-?\d{7}-?\d\b/g, '[id]')
    .slice(0, SUMMARY_TEXT_MAX_LENGTH);

const toSummaryText = (...values) => {
  for (const value of values) {
    if (typeof value !== 'string' && typeof value !== 'number') continue;
    const text = redactSummaryText(value).trim();
    if (text) return text;
  }
  return undefined;
};

const summarizeSafeValue = (value, depth = 0) => {
  if (value == null || typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') return toSummaryText(value);
  if (depth >= 3) return '[truncated]';
  if (Array.isArray(value)) {
    return value
      .slice(0, 8)
      .map((entry) => summarizeSafeValue(entry, depth + 1))
      .filter((entry) => entry !== undefined);
  }
  if (typeof value !== 'object') return undefined;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_RESPONSE_KEY_PATTERN.test(key))
      .slice(0, 12)
      .map(([key, entry]) => [key, summarizeSafeValue(entry, depth + 1)])
      .filter(([, entry]) => entry !== undefined),
  );
};

const summarizeGisysResponse = (body) => {
  if (!body || typeof body !== 'object') {
    return {
      type: typeof body,
      present: body !== undefined && body !== null,
    };
  }

  const keys = Object.keys(body).slice(0, 20);
  return {
    keys,
    truncatedKeys: Object.keys(body).length > keys.length,
    hasSubmissionId: Boolean(body.submissionId),
    hasStatus: Boolean(body.status),
    hasCode: Boolean(body.code || body.errorCode),
    hasMessage: Boolean(body.message || body.error || body.errorMessage),
    hasRawText: Boolean(body.rawText),
    hasLinks: Boolean(body.links),
    code: toSummaryText(body.code, body.errorCode),
    message: toSummaryText(body.message, body.error, body.errorMessage),
    details: summarizeSafeValue(body.details),
  };
};

export const issueGisysFactDocument = async ({
  config,
  payload,
  idempotencyKey,
}) => {
  const token = resolveGisysFactToken(config);
  if (!token) {
    throw new HttpsError(
      'failed-precondition',
      `GISYS FACT token no configurado (${config?.tokenEnvName || 'env'})`,
      { reason: 'missing-gisys-token' },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const issueUrl = buildIssueUrl(config);

  try {
    const response = await fetch(issueUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const body = await readJsonResponse(response);
    if (!response.ok) {
      const responseSummary = summarizeGisysResponse(body);
      throw new HttpsError(
        'failed-precondition',
        `GISYS FACT issue failed (${response.status})`,
        {
          reason: 'gisys-issue-failed',
          status: response.status,
          url: issueUrl,
          responseSummary,
        },
      );
    }

    return {
      ...body,
      links:
        buildGisysFactLinks({
          config,
          submissionId: body?.submissionId,
        }) ||
        body?.links ||
        null,
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new HttpsError(
        'deadline-exceeded',
        `GISYS FACT issue timeout (${config.timeoutMs}ms)`,
        { reason: 'gisys-timeout' },
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const requestGisysFactJson = async ({ config, url, method }) => {
  const token = resolveGisysFactToken(config);
  if (!token) {
    throw new HttpsError(
      'failed-precondition',
      `GISYS FACT token no configurado (${config?.tokenEnvName || 'env'})`,
      { reason: 'missing-gisys-token' },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    const body = await readJsonResponse(response);

    if (!response.ok) {
      const responseSummary = summarizeGisysResponse(body);
      throw new HttpsError(
        'failed-precondition',
        `GISYS FACT request failed (${response.status})`,
        {
          reason: 'gisys-request-failed',
          status: response.status,
          url,
          responseSummary,
        },
      );
    }

    return body;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new HttpsError(
        'deadline-exceeded',
        `GISYS FACT request timeout (${config.timeoutMs}ms)`,
        { reason: 'gisys-timeout' },
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

export const getGisysFactDocumentStatus = async ({ config, submissionId }) => {
  const body = await requestGisysFactJson({
    config,
    url: buildStatusUrl(config, submissionId),
    method: 'GET',
  });

  return {
    ...body,
    links: buildGisysFactLinks({ config, submissionId }) || body?.links || null,
  };
};

export const refreshGisysFactDocumentStatus = async ({
  config,
  submissionId,
}) => {
  await requestGisysFactJson({
    config,
    url: buildRefreshUrl(config, submissionId),
    method: 'POST',
  });

  return getGisysFactDocumentStatus({ config, submissionId });
};

export const checkGisysFactHealth = async ({ config }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const url = buildHealthUrl(config);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    const body = await readJsonResponse(response);

    return {
      ok: response.ok,
      status: response.status,
      url,
      body,
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return {
        ok: false,
        status: null,
        url,
        reason: 'gisys-timeout',
        message: `GISYS FACT health timeout (${config.timeoutMs}ms)`,
      };
    }

    return {
      ok: false,
      status: null,
      url,
      reason: 'gisys-health-unreachable',
      message: error?.message || 'No se pudo conectar con GISYS FACT.',
    };
  } finally {
    clearTimeout(timeout);
  }
};
