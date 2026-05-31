import type {
  AgentConversationContext,
  AgentRecoverableError,
  ConversationTurn,
} from '../types';

export const AGENT_CONTEXT_MAX_DEPTH = 5;
export const AGENT_CONTEXT_MAX_ARRAY_ITEMS = 20;
export const AGENT_CONTEXT_MAX_STRING_LENGTH = 500;
export const AGENT_CONTEXT_RECENT_TURN_LIMIT = 4;
export const AGENT_CONTEXT_ARCHIVED_TURN_LIMIT = 3;

interface BuildAgentConversationContextParams {
  activeAction: string | null;
  actionData: unknown | null;
  executionSuccess: boolean;
  historyTurns: ConversationTurn[];
  lastRecoverableError: AgentRecoverableError | null;
  lastUserMessage: string;
}

export const sanitizeAgentContextValue = (
  value: unknown,
  depth = 0,
): unknown => {
  if (depth > AGENT_CONTEXT_MAX_DEPTH) return '[truncated]';

  if (typeof value === 'string') {
    return value.length > AGENT_CONTEXT_MAX_STRING_LENGTH
      ? `${value.slice(0, AGENT_CONTEXT_MAX_STRING_LENGTH)}...[truncated]`
      : value;
  }

  if (
    value == null ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, AGENT_CONTEXT_MAX_ARRAY_ITEMS)
      .map((item) => sanitizeAgentContextValue(item, depth + 1));
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};

    for (const [key, raw] of Object.entries(obj)) {
      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey.includes('password') ||
        normalizedKey.includes('sessiontoken')
      ) {
        next[key] = '[redacted]';
        continue;
      }

      next[key] = sanitizeAgentContextValue(raw, depth + 1);
    }

    return next;
  }

  return String(value);
};

export const buildAgentConversationContext = ({
  activeAction,
  actionData,
  executionSuccess,
  historyTurns,
  lastRecoverableError,
  lastUserMessage,
}: BuildAgentConversationContextParams):
  | AgentConversationContext
  | undefined => {
  const currentDraft =
    activeAction && actionData !== null
      ? {
          actionId: activeAction,
          actionData: sanitizeAgentContextValue(actionData),
        }
      : null;

  const summarizedTurns = historyTurns
    .slice(-AGENT_CONTEXT_ARCHIVED_TURN_LIMIT)
    .map((turn) => ({
      userMessage: turn.userMessage,
      actionId: turn.actionId,
      executionSuccess: turn.executionSuccess,
    }));

  const currentTurnSummary =
    lastUserMessage || activeAction
      ? {
          userMessage: lastUserMessage,
          actionId: activeAction,
          executionSuccess,
        }
      : null;

  const recentTurns = currentTurnSummary
    ? [...summarizedTurns, currentTurnSummary].slice(
        -AGENT_CONTEXT_RECENT_TURN_LIMIT,
      )
    : summarizedTurns;

  if (!currentDraft && !lastRecoverableError && recentTurns.length === 0) {
    return undefined;
  }

  return {
    currentDraft,
    lastRecoverableError: lastRecoverableError
      ? (sanitizeAgentContextValue(
          lastRecoverableError,
        ) as AgentRecoverableError)
      : null,
    recentTurns,
  };
};
