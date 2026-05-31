import { describe, expect, it } from 'vitest';

import {
  AI_BUSINESS_SEEDING_CONTEXT_CHARACTER_LIMIT,
  buildAiBusinessSeedingConversationContext,
} from './aiBusinessSeedingConversationContext.js';

describe('buildAiBusinessSeedingConversationContext', () => {
  it('returns an empty block for missing or invalid context', () => {
    expect(buildAiBusinessSeedingConversationContext()).toEqual({
      text: '',
      metrics: {
        contextCharacters: 0,
        contextOriginalCharacters: 0,
        contextTruncated: false,
      },
    });
  });

  it('redacts sensitive fields and reports context metrics', () => {
    const result = buildAiBusinessSeedingConversationContext({
      currentDraft: {
        actionId: 'create_business',
        actionData: {
          users: [{ name: 'maria', password: 'Temporal123' }],
        },
      },
      sessionToken: 'secret-token',
    });

    expect(result.text).toContain('CONTEXTO_DE_CONVERSACION_JSON');
    expect(result.text).toContain('[redacted]');
    expect(result.text).not.toContain('Temporal123');
    expect(result.text).not.toContain('secret-token');
    expect(result.metrics.contextCharacters).toBe(result.text.length);
    expect(result.metrics.contextOriginalCharacters).toBeGreaterThan(0);
    expect(result.metrics.contextTruncated).toBe(false);
  });

  it('truncates very large context blocks before model generation', () => {
    const result = buildAiBusinessSeedingConversationContext({
      currentDraft: {
        actionId: 'create_business',
        actionData: {
          notes: Array.from({ length: 30 }, (_, index) => ({
            index,
            text: 'x'.repeat(500),
          })),
        },
      },
    });

    expect(result.text).toContain('...[truncated]');
    expect(result.metrics.contextOriginalCharacters).toBeGreaterThan(
      AI_BUSINESS_SEEDING_CONTEXT_CHARACTER_LIMIT,
    );
    expect(result.metrics.contextTruncated).toBe(true);
  });
});
