import type React from 'react';

export type LogType = 'info' | 'success' | 'warning' | 'error';

export const AI_BUSINESS_SEEDING_OPERATIONS = {
  ANALYZE: 'analyze',
  EXECUTE: 'execute',
  STATUS: 'status',
} as const;

export type AiBusinessSeedingOperation =
  (typeof AI_BUSINESS_SEEDING_OPERATIONS)[keyof typeof AI_BUSINESS_SEEDING_OPERATIONS];

export interface LogEntry {
  msg: string;
  type: LogType;
}

export interface AgentRecoverableError {
  code: string;
  message: string;
  field?: string;
  value?: unknown;
  suggestions?: string[];
  clarificationQuestion?: string;
  suggestedUserPrompt?: string;
  retryable?: boolean;
}

export interface AgentConversationContext {
  currentDraft?: {
    actionId: string | null;
    actionData: unknown | null;
  } | null;
  lastRecoverableError?: AgentRecoverableError | null;
  recentTurns?: Array<{
    userMessage: string;
    actionId: string | null;
    executionSuccess: boolean;
  }>;
}

export interface AgentRuntimeMetadata {
  appCheckMode?: string;
  appCheckTokenPresent?: boolean;
  authPresent?: boolean;
  availableActions?: string[];
  durationMs?: number;
  generatedAt?: string;
  location?: string;
  model?: string;
  modelConfigSource?: string;
  thinkingLevel?: string | null;
  thoughtSummariesEnabled?: boolean;
  schemaVersion?: string;
  structuredOutput?: boolean;
  constrainedOutput?: boolean;
  usage?: AgentUsageMetadata;
  requestMetrics?: AgentRequestMetrics;
}

export interface AgentUsageMetadata {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  inputCharacters?: number;
  outputCharacters?: number;
  thoughtsTokens?: number;
  cachedContentTokens?: number;
}

export interface AgentRequestMetrics {
  contextCharacters?: number;
  contextOriginalCharacters?: number;
  contextTruncated?: boolean;
  promptCharacters?: number;
  promptWithContextCharacters?: number;
}

export interface ConversationTurn {
  id: string;
  userMessage: string;
  logs: LogEntry[];
  actionId: string | null;
  actionData: unknown | null;
  executionSuccess: boolean;
  isTestMode: boolean;
  recoverableError?: AgentRecoverableError | null;
}

export interface ActionPreviewProps<TData = unknown> {
  data: TData;
  onExecute?: () => void;
  loading?: boolean;
  isTestMode?: boolean;
  readonly?: boolean;
}

export interface ActionResultProps<TData = unknown> {
  data: TData;
  onReset: () => void;
  readonly?: boolean;
}

export interface ActionDefinition<TData = unknown, TResult = unknown> {
  id: string;
  name: string;
  description?: string;
  PreviewComponent?: React.ComponentType<ActionPreviewProps<TData>>;
  ResultComponent?: React.ComponentType<ActionResultProps<TResult>>;
}

export interface BusinessSeedData {
  business?: {
    name?: string;
    address?: string;
  };
  users?: Array<{
    name?: string;
    email?: string;
    role?: string;
  }>;
  createdBusinessId?: string;
}
