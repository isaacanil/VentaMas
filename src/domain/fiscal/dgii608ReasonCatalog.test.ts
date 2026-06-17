import { describe, expect, it } from 'vitest';

import {
  DGII_608_REASON_CATALOG_VERSION,
  DGII_608_REASON_OPTIONS,
  getDgii608ReasonOption,
} from './dgii608ReasonCatalog';

describe('dgii608ReasonCatalog', () => {
  it('normaliza codigos numericos simples al buscar motivos 608', () => {
    expect(getDgii608ReasonOption('4')).toEqual(DGII_608_REASON_OPTIONS[3]);
    expect(getDgii608ReasonOption(' 04 ')).toEqual(DGII_608_REASON_OPTIONS[3]);
  });

  it('mantiene valores invalidos fuera del catalogo', () => {
    expect(getDgii608ReasonOption('99')).toBeNull();
    expect(getDgii608ReasonOption(null)).toBeNull();
  });

  it('expone una version estable del catalogo', () => {
    expect(DGII_608_REASON_CATALOG_VERSION).toBe('dgii-608-v1-2025');
  });
});
