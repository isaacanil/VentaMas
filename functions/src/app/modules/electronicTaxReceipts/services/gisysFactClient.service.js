import { HttpsError } from 'firebase-functions/v2/https';

import { resolveGisysFactToken } from '../config/gisysFact.config.js';

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');
const trimSlashes = (value) => String(value || '').replace(/^\/+|\/+$/g, '');

const buildIssueUrl = (config) => {
  const baseUrl = trimTrailingSlash(config.baseUrl);
  const configuredPath = config.issuePath;
  if (configuredPath) {
    return `${baseUrl}/${trimSlashes(configuredPath)}`;
  }

  const baseHasVersion = /\/v\d+$/i.test(baseUrl);
  return `${baseUrl}/${baseHasVersion ? '' : 'v1/'}ecf/issue`;
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
      throw new HttpsError(
        'failed-precondition',
        `GISYS FACT issue failed (${response.status}): ${JSON.stringify(body)}`,
        {
          reason: 'gisys-issue-failed',
          status: response.status,
          url: issueUrl,
          body,
        },
      );
    }

    return body;
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
