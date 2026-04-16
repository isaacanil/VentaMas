import { describe, expect, it } from 'vitest';

import {
  calculateNewEndSequence,
  calculateStoredSequenceFromAuthorization,
  resolveReceiptIncrease,
} from './taxReceiptAuthorizationModal';

describe('taxReceiptAuthorizationModal utils', () => {
  it('calcula fin de rango inclusivo con incremento unitario', () => {
    expect(
      calculateNewEndSequence(
        {
          authorizationNumber: '1',
          requestNumber: '1',
          startSequence: '100',
          approvedQuantity: '25',
          expirationDate: {} as never,
        },
        1,
      ),
    ).toBe(124);
  });

  it('calcula fin de rango respetando incremento configurado', () => {
    expect(
      calculateNewEndSequence(
        {
          authorizationNumber: '1',
          requestNumber: '1',
          startSequence: '100',
          approvedQuantity: '4',
          expirationDate: {} as never,
        },
        2,
      ),
    ).toBe(106);
  });

  it('convierte inicio autorizado a última secuencia emitida', () => {
    expect(calculateStoredSequenceFromAuthorization('100', 1)).toBe(99);
    expect(calculateStoredSequenceFromAuthorization('100', 2)).toBe(98);
  });

  it('normaliza incremento inválido a uno', () => {
    expect(resolveReceiptIncrease(undefined)).toBe(1);
    expect(resolveReceiptIncrease('0')).toBe(1);
    expect(resolveReceiptIncrease('3')).toBe(3);
  });
});
