import { createFirebaseCallable } from '@/firebase/functions/callable';

import {
  AI_BUSINESS_SEEDING_OPERATIONS,
  type AgentConversationContext,
  type AgentRuntimeMetadata,
} from '../types';

const AI_AGENT_CALLABLE_TIMEOUT_MS = 240_000;

interface AnalyzeRequest {
  operation?: typeof AI_BUSINESS_SEEDING_OPERATIONS.ANALYZE;
  prompt: string;
  enabledActions?: string[];
  conversationContext?: AgentConversationContext;
}

interface AnalyzeResponse {
  ok?: boolean;
  action?: string | null;
  data?: unknown;
  rawJson?: string;
  metadata?: AgentRuntimeMetadata;
}

const aiBusinessSeedingAgentAnalyzeCallable = createFirebaseCallable<
  AnalyzeRequest,
  AnalyzeResponse
>('aiBusinessSeedingAgent', {
  timeout: AI_AGENT_CALLABLE_TIMEOUT_MS,
  limitedUseAppCheckTokens: true,
});

export const fbAiBusinessSeedingAgentAnalyze = async (
  request: AnalyzeRequest,
): Promise<AnalyzeResponse> => {
  const response = await aiBusinessSeedingAgentAnalyzeCallable({
    operation: AI_BUSINESS_SEEDING_OPERATIONS.ANALYZE,
    ...request,
  });
  return response || {};
};
