import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { aiBusinessSeedingAgentAnalyze } from './aiBusinessSeedingAgentAnalyze.js';
import { aiBusinessSeedingAgentExecute } from './aiBusinessSeedingAgentExecute.js';

const AI_AGENT_REGION = 'us-central1';

const readObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const readString = (value) =>
  typeof value === 'string' && value.trim() ? value.trim() : '';

export const aiBusinessSeedingAgent = onCall(
  {
    region: AI_AGENT_REGION,
    timeoutSeconds: 180,
    memory: '512MiB',
    enforceAppCheck: false,
  },
  async (request) => {
    const payload = readObject(request.data);
    const operation =
      readString(payload.operation) || readString(payload.op) || 'analyze';

    if (operation === 'analyze') {
      if (typeof aiBusinessSeedingAgentAnalyze.run !== 'function') {
        throw new HttpsError('internal', 'Dispatcher analyze unavailable.');
      }
      return aiBusinessSeedingAgentAnalyze.run(request);
    }

    if (operation === 'execute') {
      if (typeof aiBusinessSeedingAgentExecute.run !== 'function') {
        throw new HttpsError('internal', 'Dispatcher execute unavailable.');
      }
      return aiBusinessSeedingAgentExecute.run(request);
    }

    throw new HttpsError(
      'invalid-argument',
      `Operación no soportada: ${operation || 'vacía'}`,
    );
  },
);

