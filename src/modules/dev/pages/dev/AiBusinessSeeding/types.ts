import type React from 'react';

export type LogType = 'info' | 'success' | 'warning' | 'error';

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
