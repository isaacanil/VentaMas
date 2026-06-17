import { describe, expect, it } from 'vitest';

import type { TaxReceiptDocument } from '@/types/taxReceipt';

import {
  buildFiscalAttentionSummary,
  getReceiptLabel,
  hasCompleteFiscalRange,
  parseReceiptQuantity,
} from './fiscalAttentionSummary';

const receipt = (
  overrides: Partial<TaxReceiptDocument['data']> = {},
): TaxReceiptDocument => ({
  data: {
    name: 'Credito Fiscal',
    type: 'B',
    serie: '01',
    sequence: 1,
    quantity: 10,
    ...overrides,
  },
});

describe('fiscalAttentionSummary', () => {
  it('mantiene resumen neutral cuando fiscal esta deshabilitado', () => {
    expect(
      buildFiscalAttentionSummary([receipt({ quantity: 0 })], false),
    ).toEqual({
      primaryIssue: null,
      tone: 'neutral',
    });
  });

  it('advierte cuando no hay series activas', () => {
    expect(buildFiscalAttentionSummary([], true)).toEqual({
      primaryIssue: 'No hay series activas para emitir comprobantes.',
      tone: 'warning',
    });
  });

  it('ignora series disabled al calcular disponibilidad activa', () => {
    expect(
      buildFiscalAttentionSummary(
        [receipt({ disabled: true, name: 'Agotada', quantity: 0 })],
        true,
      ),
    ).toEqual({
      primaryIssue: 'No hay series activas para emitir comprobantes.',
      tone: 'warning',
    });
  });

  it('prioriza cantidad 0 antes que rango incompleto', () => {
    expect(
      buildFiscalAttentionSummary(
        [
          receipt({ name: 'Sin secuencia', sequence: '' }),
          receipt({ name: 'Agotada', quantity: 0 }),
        ],
        true,
      ),
    ).toEqual({
      primaryIssue: 'Agotada no tiene disponibilidad.',
      tone: 'danger',
    });
  });

  it('advierte cuando la serie activa tiene rango incompleto', () => {
    expect(
      buildFiscalAttentionSummary(
        [receipt({ name: 'Credito Fiscal', sequence: '' })],
        true,
      ),
    ).toEqual({
      primaryIssue: 'Credito Fiscal necesita completar su rango fiscal.',
      tone: 'warning',
    });
  });

  it('usa type mas serie como fallback de etiqueta', () => {
    const fallbackReceipt = receipt({
      name: ' ',
      type: 'E',
      serie: '31',
      quantity: 0,
    });

    expect(getReceiptLabel(fallbackReceipt)).toBe('E31');
    expect(buildFiscalAttentionSummary([fallbackReceipt], true)).toEqual({
      primaryIssue: 'E31 no tiene disponibilidad.',
      tone: 'danger',
    });
  });

  it('parsea cantidades y valida rango completo sin mutar el recibo', () => {
    const validReceipt = receipt({ quantity: '05' });

    expect(parseReceiptQuantity(validReceipt.data.quantity)).toBe(5);
    expect(parseReceiptQuantity('')).toBeNull();
    expect(hasCompleteFiscalRange(validReceipt)).toBe(true);
    expect(hasCompleteFiscalRange(receipt({ serie: '' }))).toBe(false);
  });
});
