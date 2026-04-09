import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';

import type { AgentRecoverableError, LogEntry } from '../types';

const AI_AGENT_CALLABLE_TIMEOUT_MS = 240_000;

interface ExecuteRequest {
  operation?: 'execute';
  actionId: string;
  actionData: unknown;
  isTestMode?: boolean;
  sessionToken?: string | null;
}

interface ExecuteResponse {
  ok?: boolean;
  action?: string | null;
  data?: unknown;
  logs?: LogEntry[];
  error?: AgentRecoverableError | null;
}

const aiBusinessSeedingAgentExecuteCallable = httpsCallable<
  ExecuteRequest,
  ExecuteResponse
>(functions, 'aiBusinessSeedingAgent', {
  timeout: AI_AGENT_CALLABLE_TIMEOUT_MS,
});

export const fbAiBusinessSeedingAgentExecute = async ({
  actionId,
  actionData,
  isTestMode,
}: {
  actionId: string;
  actionData: unknown;
  isTestMode?: boolean;
}): Promise<ExecuteResponse> => {
  const { sessionToken } = getStoredSession();
  const request: ExecuteRequest = {
    operation: 'execute',
    actionId,
    actionData,
    isTestMode,
    ...(sessionToken ? { sessionToken } : {}),
  };
  const response = await aiBusinessSeedingAgentExecuteCallable(request);
  return response?.data || {};
};
