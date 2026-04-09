import { describe, expect, it } from 'vitest';

import { resolveCloseCashCountError } from './closeCashCountErrors';

describe('resolveCloseCashCountError', () => {
  it('traduce permission-denied a un mensaje accionable', () => {
    expect(
      resolveCloseCashCountError({
        code: 'functions/permission-denied',
        message: 'No autorizado para cerrar el cuadre',
      }).userMessage,
    ).toBe(
      'Tu usuario no tiene acceso activo al negocio o no puede cerrar esta caja.',
    );
  });

  it('detecta stack overflow como cliente desactualizado', () => {
    expect(
      resolveCloseCashCountError({
        code: 'functions/internal',
        message: 'Maximum call stack size exceeded',
      }).userMessage,
    ).toBe('Tu app parece desactualizada; recarga la aplicación.');
  });

  it('detecta serialization-error del cliente como app desactualizada', () => {
    expect(
      resolveCloseCashCountError({
        code: 'client/serialization-error',
        message: 'Converting circular structure to JSON',
      }).userMessage,
    ).toBe('Tu app parece desactualizada; recarga la aplicación.');
  });

  it('preserva mensajes útiles cuando no hay mapeo especial', () => {
    expect(
      resolveCloseCashCountError({
        code: 'functions/internal',
        message: 'Algo específico falló',
      }).userMessage,
    ).toBe('Algo específico falló');
  });
});
