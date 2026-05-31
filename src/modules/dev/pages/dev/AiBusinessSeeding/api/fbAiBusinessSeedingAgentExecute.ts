import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';

import { getAiBusinessSeedingTargetFunctions } from './aiBusinessSeedingTargetFirebase';
import {
  AI_BUSINESS_SEEDING_OPERATIONS,
  type AgentRecoverableError,
  type LogEntry,
} from '../types';
import { getCurrentAiBusinessSeedingEnvironment } from '../utils/environment';
import type { AiBusinessSeedingEnvironmentId } from '../utils/environment';

const AI_AGENT_CALLABLE_TIMEOUT_MS = 240_000;

interface ExecuteRequest {
  operation?: typeof AI_BUSINESS_SEEDING_OPERATIONS.EXECUTE;
  actionId: string;
  actionData: unknown;
  isTestMode?: boolean;
  executeRequestId?: string | null;
  sessionToken?: string | null;
}

interface ExecuteResponse {
  ok?: boolean;
  action?: string | null;
  data?: unknown;
  logs?: LogEntry[];
  error?: AgentRecoverableError | null;
  metadata?: {
    reusedExecution?: boolean;
  };
}

export const fbAiBusinessSeedingAgentExecute = async ({
  actionId,
  actionData,
  isTestMode,
  executeRequestId,
  targetEnvironmentId,
  sessionToken: targetSessionToken,
}: {
  actionId: string;
  actionData: unknown;
  isTestMode?: boolean;
  executeRequestId?: string | null;
  targetEnvironmentId?: AiBusinessSeedingEnvironmentId;
  sessionToken?: string | null;
}): Promise<ExecuteResponse> => {
  const currentEnvironmentId = getCurrentAiBusinessSeedingEnvironment().id;
  const environmentId = targetEnvironmentId || currentEnvironmentId;
  const aiBusinessSeedingAgentExecuteCallable = httpsCallable<
    ExecuteRequest,
    ExecuteResponse
  >(
    getAiBusinessSeedingTargetFunctions(environmentId),
    'aiBusinessSeedingAgent',
    {
      timeout: AI_AGENT_CALLABLE_TIMEOUT_MS,
    },
  );
  const { sessionToken } = getStoredSession();
  const resolvedSessionToken =
    targetSessionToken ||
    (environmentId === currentEnvironmentId ? sessionToken : null);
  const request: ExecuteRequest = {
    operation: AI_BUSINESS_SEEDING_OPERATIONS.EXECUTE,
    actionId,
    actionData,
    isTestMode,
    ...(executeRequestId ? { executeRequestId } : {}),
    ...(resolvedSessionToken ? { sessionToken: resolvedSessionToken } : {}),
  };
  const response = await aiBusinessSeedingAgentExecuteCallable(request);
  return response?.data || {};
};
