import { describe, expect, it } from 'vitest';

import {
  buildAiBusinessSeedingUsernameSuggestions,
  normalizeAiBusinessSeedingUsernameCandidate,
} from './aiBusinessSeedingUsernameSuggestions.js';

describe('aiBusinessSeedingUsernameSuggestions', () => {
  it('normalizes candidates without trailing punctuation', () => {
    expect(
      normalizeAiBusinessSeedingUsernameCandidate(
        'Colmado Aurora Duplicado.Aurora.',
      ),
    ).toBe('colmado-aurora-duplicado.aurora');
  });

  it('suggests short alternatives for a duplicated owner username', () => {
    const suggestions = buildAiBusinessSeedingUsernameSuggestions({
      username: 'aurora.owner.0529a',
      businessName: 'Colmado Aurora Duplicado 0529-A',
      realName: '',
    });

    expect(suggestions).toEqual([
      'aurora.owner.0529a-1',
      'aurora.owner.0529a-2',
      'colmado-aurora-owner',
      'owner-colmado-aurora',
      'colmado-aurora-admin',
    ]);
    expect(suggestions.every((suggestion) => suggestion.length <= 32)).toBe(
      true,
    );
    expect(suggestions.every((suggestion) => !/[.-]$/.test(suggestion))).toBe(
      true,
    );
  });
});
