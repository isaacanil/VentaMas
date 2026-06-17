import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import {
  buildAiAgentCallableOptions,
  getAiAgentAppCheckMode,
} from '../config/aiCallableOptions.js';
import {
  businessCreatorModelName,
  businessCreatorThinkingLevel,
  businessCreatorThoughtSummariesEnabled,
  businessCreatorVertexLocation,
} from '../config/genkit.js';
import { aiBusinessSeedingAnalyzeFlow } from '../flows/aiBusinessSeedingAnalyze.flow.js';
import { AI_BUSINESS_SEEDING_CONSTRAINED_OUTPUT } from '../utils/aiBusinessSeedingStructuredOutput.js';
import {
  readAiCallableObject as readObject,
} from '../utils/aiCallablePayload.util.js';
import { assertAiBusinessSeedingDeveloperAccess } from './aiBusinessSeedingAccess.js';

const DEBUG_ERROR_PROJECTS = new Set(['ventamax-staging']);
const DEFAULT_ANALYZE_RESPONSE_DEADLINE_MS = 150_000;
const MIN_ANALYZE_RESPONSE_DEADLINE_MS = 10_000;
const AI_ANALYZE_DEADLINE_CATEGORY = 'AI_ANALYZE_DEADLINE_EXCEEDED';
const AI_STRUCTURED_OUTPUT_EMPTY_CATEGORY = 'AI_STRUCTURED_OUTPUT_EMPTY';

const readEnvString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : '';

const readPositiveIntegerEnv = (value, fallback) => {
  const numeric = Number(readEnvString(value));
  if (
    Number.isFinite(numeric) &&
    numeric >= MIN_ANALYZE_RESPONSE_DEADLINE_MS
  ) {
    return Math.trunc(numeric);
  }
  return fallback;
};

const analyzeResponseDeadlineMs = readPositiveIntegerEnv(
  process.env.AI_BUSINESS_SEEDING_ANALYZE_DEADLINE_MS,
  DEFAULT_ANALYZE_RESPONSE_DEADLINE_MS,
);

const makeAnalyzeDeadlineError = (timeoutMs) =>
  Object.assign(
    new Error(
      `La IA tardo mas de ${Math.round(timeoutMs / 1000)} segundos en responder.`,
    ),
    {
      category: AI_ANALYZE_DEADLINE_CATEGORY,
      code: 'deadline-exceeded',
      status: 'DEADLINE_EXCEEDED',
    },
  );

const isAnalyzeDeadlineError = (error) =>
  error && typeof error === 'object'
    ? error.category === AI_ANALYZE_DEADLINE_CATEGORY
    : false;

const withAnalyzeResponseDeadline = async (workPromise) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      reject(makeAnalyzeDeadlineError(analyzeResponseDeadlineMs));
    }, analyzeResponseDeadlineMs);
  });

  try {
    return await Promise.race([workPromise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      globalThis.clearTimeout(timeoutId);
    }
  }
};

const shouldExposeDiagnosticErrors = () => {
  const explicit = readEnvString(process.env.AI_BUSINESS_SEEDING_DEBUG_ERRORS);
  if (explicit) return explicit.toLowerCase() === 'true';
  const projectId =
    readEnvString(process.env.GCLOUD_PROJECT) ||
    readEnvString(process.env.GOOGLE_CLOUD_PROJECT) ||
    readEnvString(process.env.FIREBASE_PROJECT_ID) ||
    readEnvString(process.env.PROJECT_ID);
  return DEBUG_ERROR_PROJECTS.has(projectId);
};

const getErrorMessage = (error) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error || 'Unknown error');
};

const getErrorStatus = (error) => {
  const status =
    typeof error?.status === 'string'
      ? error.status
      : typeof error?.code === 'string'
        ? error.code
        : '';
  return status || undefined;
};

const classifyAiError = (message, error) => {
  if (isAnalyzeDeadlineError(error)) {
    return AI_ANALYZE_DEADLINE_CATEGORY;
  }

  const lower = message.toLowerCase();
  if (
    lower.includes('aiplatform.googleapis.com') &&
    lower.includes('disabled')
  ) {
    return 'VERTEX_AI_API_DISABLED';
  }
  if (lower.includes('[403 forbidden]') || lower.includes('permission')) {
    return 'VERTEX_AI_PERMISSION_DENIED';
  }
  if (lower.includes('model') && lower.includes('not found')) {
    return 'VERTEX_AI_MODEL_NOT_FOUND';
  }
  if (
    (lower.includes('schema validation failed') &&
      lower.includes('provided data') &&
      lower.includes('null')) ||
    lower.includes('no devolvio una accion estructurada')
  ) {
    return AI_STRUCTURED_OUTPUT_EMPTY_CATEGORY;
  }
  return 'AI_ANALYZE_FAILED';
};

const getAiAnalyzeHttpsCode = (category) => {
  if (category === AI_ANALYZE_DEADLINE_CATEGORY) return 'deadline-exceeded';
  if (category === AI_STRUCTURED_OUTPUT_EMPTY_CATEGORY) return 'unavailable';
  if (category === 'VERTEX_AI_API_DISABLED') return 'failed-precondition';
  if (category === 'VERTEX_AI_PERMISSION_DENIED') return 'permission-denied';
  if (category === 'VERTEX_AI_MODEL_NOT_FOUND') return 'failed-precondition';
  return 'internal';
};

const getAiAnalyzeClientMessage = (category) => {
  if (category === AI_ANALYZE_DEADLINE_CATEGORY) {
    return 'La IA tardo demasiado en analizar la solicitud. Intenta nuevamente.';
  }
  if (category === AI_STRUCTURED_OUTPUT_EMPTY_CATEGORY) {
    return 'La IA no devolvio una respuesta estructurada valida. Intenta nuevamente.';
  }
  return 'No se pudo analizar la solicitud con IA.';
};

const buildAiDiagnostic = (error) => {
  const message = getErrorMessage(error);
  const category = classifyAiError(message, error);
  return {
    category,
    message,
    status: getErrorStatus(error),
    model: businessCreatorModelName,
    location: businessCreatorVertexLocation,
    thinkingLevel: businessCreatorThinkingLevel,
    thoughtSummariesEnabled: businessCreatorThoughtSummariesEnabled,
    appCheckMode: getAiAgentAppCheckMode(),
    responseDeadlineMs: analyzeResponseDeadlineMs,
  };
};

const buildAnalyzeMetadata = (flowResult, requestSignals) => ({
  model: businessCreatorModelName,
  location: businessCreatorVertexLocation,
  thinkingLevel: businessCreatorThinkingLevel,
  thoughtSummariesEnabled: businessCreatorThoughtSummariesEnabled,
  schemaVersion: flowResult?.schemaVersion,
  structuredOutput: flowResult?.structuredOutput === true,
  constrainedOutput:
    flowResult?.constrainedOutput === AI_BUSINESS_SEEDING_CONSTRAINED_OUTPUT,
  appCheckMode: getAiAgentAppCheckMode(),
  appCheckTokenPresent: requestSignals.appCheckTokenPresent,
  authPresent: requestSignals.authPresent,
  durationMs: requestSignals.durationMs,
  modelConfigSource: 'functions-env',
  usage: flowResult?.usage,
  requestMetrics: flowResult?.requestMetrics,
});

const readEnabledActions = (value) =>
  Array.isArray(value)
    ? value
        .filter((item) => typeof item === 'string' && item.trim())
        .slice(0, 10)
    : [];

const readConversationContext = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return undefined;
  return value;
};

export const aiBusinessSeedingAgentAnalyze = onCall(
  buildAiAgentCallableOptions({
    timeoutSeconds: 180,
    memory: '512MiB',
  }),
  async (request) => {
    await assertAiBusinessSeedingDeveloperAccess(request);

    const payload = readObject(request.data);
    const prompt =
      typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
    const enabledActions = readEnabledActions(payload.enabledActions);
    const conversationContext = readConversationContext(
      payload.conversationContext,
    );

    if (!prompt) {
      throw new HttpsError('invalid-argument', 'prompt es requerido.');
    }

    const startedAt = Date.now();

    try {
      const result = await withAnalyzeResponseDeadline(
        aiBusinessSeedingAnalyzeFlow.run(
          { prompt, enabledActions, conversationContext },
          {
            context: {
              auth: request.auth || null,
              app: request.app || null,
            },
          },
        ),
      );
      const flowResult = result?.result || {};
      const durationMs = Date.now() - startedAt;

      logger.info('[aiBusinessSeedingAgentAnalyze] flow completed', {
        action: flowResult?.action || null,
        durationMs,
        model: businessCreatorModelName,
        location: businessCreatorVertexLocation,
        schemaVersion: flowResult?.schemaVersion,
        structuredOutput: flowResult?.structuredOutput === true,
        constrainedOutput:
          flowResult?.constrainedOutput ===
          AI_BUSINESS_SEEDING_CONSTRAINED_OUTPUT,
        usage: flowResult?.usage || null,
        requestMetrics: flowResult?.requestMetrics || null,
        appCheckMode: getAiAgentAppCheckMode(),
        appCheckTokenPresent: Boolean(request.app),
        authPresent: Boolean(request.auth),
      });

      return {
        ok: true,
        action:
          typeof flowResult?.action === 'string' ? flowResult.action : null,
        data: flowResult?.data ?? null,
        rawJson: flowResult?.rawJson || '',
        metadata: buildAnalyzeMetadata(flowResult, {
          appCheckTokenPresent: Boolean(request.app),
          authPresent: Boolean(request.auth),
          durationMs,
        }),
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      const diagnostic = {
        ...buildAiDiagnostic(error),
        appCheckTokenPresent: Boolean(request.app),
        authPresent: Boolean(request.auth),
        durationMs: Date.now() - startedAt,
      };
      logger.error('[aiBusinessSeedingAgentAnalyze] flow failed', {
        error,
        ...diagnostic,
      });
      throw new HttpsError(
        getAiAnalyzeHttpsCode(diagnostic.category),
        getAiAnalyzeClientMessage(diagnostic.category),
        shouldExposeDiagnosticErrors() ? { diagnostic } : undefined,
      );
    }
  },
);
