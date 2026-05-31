import { describe, expect, it } from 'vitest';

import { buildAiBusinessSeedingSystemPrompt } from './aiBusinessSeedingSystemPrompt.js';

describe('buildAiBusinessSeedingSystemPrompt', () => {
  it('includes all action instructions when no explicit list is provided', () => {
    const prompt = buildAiBusinessSeedingSystemPrompt(undefined);

    expect(prompt).toContain('"action": "chat"');
    expect(prompt).toContain('"action": "create_business"');
  });

  it('keeps chat as a fallback when the explicit action list is empty', () => {
    const prompt = buildAiBusinessSeedingSystemPrompt([]);

    expect(prompt).toContain('"action": "chat"');
    expect(prompt).not.toContain('"action": "create_business"');
  });

  it('keeps chat available for clarification when an operational action is enabled', () => {
    const prompt = buildAiBusinessSeedingSystemPrompt(['create_business']);

    expect(prompt).toContain('"action": "chat"');
    expect(prompt).toContain('"action": "create_business"');
  });
});
