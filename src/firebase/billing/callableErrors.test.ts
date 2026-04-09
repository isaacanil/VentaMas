import { describe, expect, it } from 'vitest';

import { resolveBillingCallableErrorMessage } from './callableErrors';

describe('resolveBillingCallableErrorMessage', () => {
  const unavailableMessage = 'La funcionalidad de billing aún no está desplegada en backend.';

  it('preserva errores not-found con mensaje de negocio', () => {
    expect(
      resolveBillingCallableErrorMessage(
        {
          code: 'functions/not-found',
          message: 'Versión de plan no encontrada',
        },
        unavailableMessage,
      ),
    ).toBe('Versión de plan no encontrada');
  });

  it('mantiene el mensaje de backend no desplegado para unimplemented', () => {
    expect(
      resolveBillingCallableErrorMessage(
        {
          code: 'functions/unimplemented',
          message: 'UNIMPLEMENTED',
        },
        unavailableMessage,
      ),
    ).toBe(unavailableMessage);
  });

  it('preserva el mensaje descriptivo de unimplemented cuando backend lo especifica', () => {
    expect(
      resolveBillingCallableErrorMessage(
        {
          code: 'functions/unimplemented',
          message: 'Proveedor de pago cardnet deshabilitado por configuración',
        },
        unavailableMessage,
      ),
    ).toBe('Proveedor de pago cardnet deshabilitado por configuración');
  });

  it('trata not-found genérico como callable faltante', () => {
    expect(
      resolveBillingCallableErrorMessage(
        {
          code: 'functions/not-found',
          message: 'NOT_FOUND',
        },
        unavailableMessage,
      ),
    ).toBe(unavailableMessage);
  });
});
