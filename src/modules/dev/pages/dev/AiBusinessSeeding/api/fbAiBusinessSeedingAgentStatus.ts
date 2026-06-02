import { createFirebaseCallable } from '@/firebase/functions/callable';

import {
  AI_BUSINESS_SEEDING_OPERATIONS,
  type AgentRuntimeMetadata,
} from '../types';

const AI_AGENT_CALLABLE_TIMEOUT_MS = 60_000;

interface StatusRequest {
  operation: typeof AI_BUSINESS_SEEDING_OPERATIONS.STATUS;
}

interface StatusResponse {
  ok?: boolean;
  operation?: typeof AI_BUSINESS_SEEDING_OPERATIONS.STATUS;
  metadata?: AgentRuntimeMetadata;
}

const aiBusinessSeedingAgentStatusCallable = createFirebaseCallable<
  StatusRequest,
  StatusResponse
>('aiBusinessSeedingAgent', {
  timeout: AI_AGENT_CALLABLE_TIMEOUT_MS,
  limitedUseAppCheckTokens: true,
});

export const fbAiBusinessSeedingAgentStatus =
  async (): Promise<StatusResponse> => {
    const response = await aiBusinessSeedingAgentStatusCallable({
      operation: AI_BUSINESS_SEEDING_OPERATIONS.STATUS,
    });
    return response || {};
  };
