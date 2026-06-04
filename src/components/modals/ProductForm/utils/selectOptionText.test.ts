import { describe, expect, it } from 'vitest';

import {
  getSelectOptionText,
  matchesSelectOptionText,
} from './selectOptionText';

describe('selectOptionText', () => {
  it('normaliza texto de opciones simples y compuestas', () => {
    expect(getSelectOptionText('Categoría')).toBe('Categoría');
    expect(getSelectOptionText(['Marca', 'Demo', 2026])).toBe(
      'Marca Demo 2026',
    );
    expect(getSelectOptionText(null)).toBe('');
  });

  it('filtra opciones con la misma regla para label y children', () => {
    expect(matchesSelectOptionText('demo', 'Marca Demo')).toBe(true);
    expect(matchesSelectOptionText('2026', ['Marca', 2026])).toBe(true);
    expect(matchesSelectOptionText('otro', 'Marca Demo')).toBe(false);
  });
});
