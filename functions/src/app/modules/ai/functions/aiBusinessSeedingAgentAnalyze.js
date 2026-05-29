import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import {
  businessCreatorModelName,
  businessCreatorVertexLocation,
} from '../config/genkit.js';
import { aiBusinessSeedingAnalyzeFlow } from '../flows/aiBusinessSeedingAnalyze.flow.js';
import { assertAiBusinessSeedingDeveloperAccess } from './aiBusinessSeedingAccess.js';

const AI_AGENT_REGION = 'us-central1';
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
  if (lower.includes('aiplatform.googleapis.com') && lower.includes('disabled')) {
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
  };
};

const readEnabledActions = (value) =>
  Array.isArray(value)
    ? value.filter((item) => typeof item === 'string' && item.trim()).slice(0, 10)
    : [];

const readConversationContext = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value;
};

export const aiBusinessSeedingAgentAnalyze = onCall(
  {
    region: AI_AGENT_REGION,
    timeoutSeconds: 180,
    memory: '512MiB',
    enforceAppCheck: false,
  },
  async (request) => {
    await assertAiBusinessSeedingDeveloperAccess(request);

    const payload = readObject(request.data);
    const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
    const enabledActions = readEnabledActions(payload.enabledActions);
    const conversationContext = readConversationContext(payload.conversationContext);

    if (!prompt) {
      throw new HttpsError('invalid-argument', 'prompt es requerido.');
    }

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
      const rawJson = result?.result?.rawJson || '';
      let parsed;
      try {
        parsed = JSON.parse(rawJson);
      } catch (parseError) {
        logger.error('[aiBusinessSeedingAgentAnalyze] invalid JSON from model', {
          rawJson,
          parseError,
        });
        throw new HttpsError('internal', 'La IA devolvió un formato inválido.');
      }

      return {
        ok: true,
        action: typeof parsed?.action === 'string' ? parsed.action : null,
        data: parsed?.data ?? null,
        rawJson,
      };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      const diagnostic = buildAiDiagnostic(error);
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
