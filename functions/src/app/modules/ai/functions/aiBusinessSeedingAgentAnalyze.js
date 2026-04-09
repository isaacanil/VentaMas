import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { aiBusinessSeedingAnalyzeFlow } from '../flows/aiBusinessSeedingAnalyze.flow.js';
import { assertAiBusinessSeedingDeveloperAccess } from './aiBusinessSeedingAccess.js';

const AI_AGENT_REGION = 'us-central1';

const readObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

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
      logger.error('[aiBusinessSeedingAgentAnalyze] flow failed', { error });
      throw new HttpsError('internal', 'No se pudo analizar la solicitud con IA.');
    }
  },
);
