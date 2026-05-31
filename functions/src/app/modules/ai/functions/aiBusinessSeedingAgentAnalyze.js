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
import { assertAiBusinessSeedingDeveloperAccess } from './aiBusinessSeedingAccess.js';

const DEBUG_ERROR_PROJECTS = new Set(['ventamax-staging']);

const readObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const readEnvString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : '';

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

const classifyAiError = (message) => {
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
  return 'AI_ANALYZE_FAILED';
};

const buildAiDiagnostic = (error) => {
  const message = getErrorMessage(error);
  return {
    category: classifyAiError(message),
    message,
    status: getErrorStatus(error),
    model: businessCreatorModelName,
    location: businessCreatorVertexLocation,
    thinkingLevel: businessCreatorThinkingLevel,
    thoughtSummariesEnabled: businessCreatorThoughtSummariesEnabled,
    appCheckMode: getAiAgentAppCheckMode(),
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
      const result = await aiBusinessSeedingAnalyzeFlow.run(
        { prompt, enabledActions, conversationContext },
        {
          context: {
            auth: request.auth || null,
            app: request.app || null,
          },
        },
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
        'internal',
        'No se pudo analizar la solicitud con IA.',
        shouldExposeDiagnosticErrors() ? { diagnostic } : undefined,
      );
    }
  },
);
