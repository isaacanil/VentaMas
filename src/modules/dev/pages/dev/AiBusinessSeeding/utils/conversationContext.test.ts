import { describe, expect, it } from 'vitest';

import {
  AGENT_CONTEXT_MAX_ARRAY_ITEMS,
  AGENT_CONTEXT_MAX_STRING_LENGTH,
  buildAgentConversationContext,
  sanitizeAgentContextValue,
} from './conversationContext';

import type { ConversationTurn } from '../types';

const buildTurn = (index: number): ConversationTurn => ({
  id: `turn-${index}`,
  userMessage: `turn ${index}`,
  logs: [],
  actionId: index % 2 === 0 ? 'create_business' : 'chat',
  actionData: null,
  executionSuccess: index % 2 === 0,
  isTestMode: false,
});

describe('sanitizeAgentContextValue', () => {
  it('redacts sensitive fields and truncates long strings before sending context', () => {
    const sanitized = sanitizeAgentContextValue({
      name: 'Colmado La Fe',
      password: 'Temporal123',
      sessionToken: 'secret-token',
      notes: 'x'.repeat(AGENT_CONTEXT_MAX_STRING_LENGTH + 20),
    }) as Record<string, unknown>;

    expect(sanitized.password).toBe('[redacted]');
    expect(sanitized.sessionToken).toBe('[redacted]');
    expect(String(sanitized.notes)).toHaveLength(
      AGENT_CONTEXT_MAX_STRING_LENGTH + '...[truncated]'.length,
    );
    expect(String(sanitized.notes)).toContain('...[truncated]');
  });

  it('caps arrays in context payloads', () => {
    const sanitized = sanitizeAgentContextValue(
      Array.from({ length: AGENT_CONTEXT_MAX_ARRAY_ITEMS + 5 }, (_, index) => ({
        index,
      })),
    );

    expect(sanitized).toHaveLength(AGENT_CONTEXT_MAX_ARRAY_ITEMS);
  });
});

describe('buildAgentConversationContext', () => {
  it('omits context when there is no useful conversation state', () => {
    expect(
      buildAgentConversationContext({
        activeAction: null,
        actionData: null,
        executionSuccess: false,
        historyTurns: [],
        lastRecoverableError: null,
        lastUserMessage: '',
      }),
    ).toBeUndefined();
  });

  it('builds a compact context with draft, recoverable error and recent turns', () => {
    const context = buildAgentConversationContext({
      activeAction: 'create_business',
      actionData: {
        business: { name: 'Colmado La Fe' },
        users: [{ name: 'maria', password: 'Temporal123' }],
      },
      executionSuccess: false,
      historyTurns: [1, 2, 3, 4, 5].map(buildTurn),
      lastRecoverableError: {
        code: 'USERNAME_EXISTS',
        message: 'Usuario duplicado',
        suggestions: ['maria.1'],
      },
      lastUserMessage: 'Maria sera owner',
    });

    expect(context?.currentDraft?.actionId).toBe('create_business');
    expect(context?.recentTurns).toHaveLength(4);
    expect(context?.recentTurns?.[3]).toMatchObject({
      userMessage: 'Maria sera owner',
      actionId: 'create_business',
      executionSuccess: false,
    });
    expect(context?.lastRecoverableError).toMatchObject({
      code: 'USERNAME_EXISTS',
    });
    expect(JSON.stringify(context)).not.toContain('Temporal123');
  });
});
