import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { buildAiAgentCallableOptions } from '../config/aiCallableOptions.js';
import { createBusinessWithAiFlow } from '../flows/businessCreator.flow.js';
import { buildSuggestedBusinessDraft } from '../utils/businessDraft.util.js';
import { readAiCallableObject as readObject } from '../utils/aiCallablePayload.util.js';
import { assertAiBusinessSeedingDeveloperAccess } from './aiBusinessSeedingAccess.js';

export const aiCreateBusinessAgent = onCall(
  buildAiAgentCallableOptions({
    timeoutSeconds: 180,
    memory: '512MiB',
  }),
  async (request) => {
    await assertAiBusinessSeedingDeveloperAccess(request);

    const payload = readObject(request.data);
    const draftInput = readObject(payload.draftInput);

    if (!draftInput.idea || typeof draftInput.idea !== 'string') {
      throw new HttpsError(
        'invalid-argument',
        'draftInput.idea es requerido para generar la propuesta.',
      );
    }

    let aiDraft;
    try {
      const result = await createBusinessWithAiFlow.run(draftInput, {
        context: {
          auth: request.auth || null,
          app: request.app || null,
        },
      });
      aiDraft = result?.result || null;
    } catch (error) {
      logger.error('[aiCreateBusinessAgent] flow failed', { error });
      throw new HttpsError(
        'internal',
        'No se pudo generar la propuesta del negocio con IA.',
      );
    }

    const suggestedBusiness = buildSuggestedBusinessDraft({
      input: draftInput,
      aiDraft,
    });

    return {
      ok: true,
      mode: 'draft',
      aiDraft,
      suggestedBusiness,
    };
  },
);
