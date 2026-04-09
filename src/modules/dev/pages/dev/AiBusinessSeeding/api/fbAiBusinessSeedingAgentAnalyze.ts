import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';

import type { AgentConversationContext } from '../types';

const AI_AGENT_CALLABLE_TIMEOUT_MS = 240_000;

interface AnalyzeRequest {
  operation?: 'analyze';
  prompt: string;
  enabledActions?: string[];
  conversationContext?: AgentConversationContext;
}

interface AnalyzeResponse {
  ok?: boolean;
  action?: string | null;
  data?: unknown;
  rawJson?: string;
}

const aiBusinessSeedingAgentAnalyzeCallable = httpsCallable<
  AnalyzeRequest,
  AnalyzeResponse
>(functions, 'aiBusinessSeedingAgent', {
  timeout: AI_AGENT_CALLABLE_TIMEOUT_MS,
});

export const fbAiBusinessSeedingAgentAnalyze = async (
  request: AnalyzeRequest,
): Promise<AnalyzeResponse> => {
  const response = await aiBusinessSeedingAgentAnalyzeCallable({
    operation: 'analyze',
    ...request,
  });
  return response?.data || {};
};
