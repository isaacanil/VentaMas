import { describe, expect, it } from 'vitest';

import {
  getSelectOptionText,
  matchesSelectOptionText,
} from './selectOptionText';

describe('selectOptionText', () => {
  it('keeps simple and composed option text formatting', () => {
    expect(getSelectOptionText('Categoría')).toBe('Categoría');
    expect(getSelectOptionText(['Marca', 'Demo', 2026])).toBe(
      'Marca Demo 2026',
    );
    expect(getSelectOptionText(null)).toBe('');
  });

  it('matches option text with trimmed accent-insensitive search terms', () => {
    expect(matchesSelectOptionText(' categoria ', 'Categoría')).toBe(true);
    expect(matchesSelectOptionText('2026', ['Marca', 2026])).toBe(true);
    expect(matchesSelectOptionText('otro', 'Marca Demo')).toBe(false);
  });
});
