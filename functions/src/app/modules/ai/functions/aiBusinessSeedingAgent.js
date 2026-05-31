import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { buildAiAgentCallableOptions } from '../config/aiCallableOptions.js';
import {
  AI_BUSINESS_SEEDING_OPERATIONS,
  readAiBusinessSeedingOperation,
  resolveAiBusinessSeedingOperationTarget,
} from '../utils/aiBusinessSeedingOperations.js';
import { aiBusinessSeedingAgentAnalyze } from './aiBusinessSeedingAgentAnalyze.js';
import { aiBusinessSeedingAgentExecute } from './aiBusinessSeedingAgentExecute.js';
import { aiBusinessSeedingAgentStatus } from './aiBusinessSeedingAgentStatus.js';

const readObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const aiBusinessSeedingAgent = onCall(
  buildAiAgentCallableOptions({
    cors: true,
    invoker: 'public',
    timeoutSeconds: 180,
    memory: '512MiB',
  }),
  async (request) => {
    const payload = readObject(request.data);
    const operation = readAiBusinessSeedingOperation(payload);
    const target = resolveAiBusinessSeedingOperationTarget(operation);

    if (target === AI_BUSINESS_SEEDING_OPERATIONS.STATUS) {
      if (typeof aiBusinessSeedingAgentStatus.run !== 'function') {
        throw new HttpsError('internal', 'Dispatcher status unavailable.');
      }
      return aiBusinessSeedingAgentStatus.run(request);
    }

    if (target === AI_BUSINESS_SEEDING_OPERATIONS.ANALYZE) {
      if (typeof aiBusinessSeedingAgentAnalyze.run !== 'function') {
        throw new HttpsError('internal', 'Dispatcher analyze unavailable.');
      }
      return aiBusinessSeedingAgentAnalyze.run(request);
    }

    if (target === AI_BUSINESS_SEEDING_OPERATIONS.EXECUTE) {
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
