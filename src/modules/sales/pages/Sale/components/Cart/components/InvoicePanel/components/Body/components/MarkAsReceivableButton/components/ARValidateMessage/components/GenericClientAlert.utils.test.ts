import { describe, expect, it } from 'vitest';

import { buildARValidations } from './GenericClientAlert.utils';

import type { BuildARValidationsInput } from './GenericClientAlert.utils';

const createInput = (
  overrides: Partial<BuildARValidationsInput> = {},
): BuildARValidationsInput => ({
  isGenericClient: false,
  isInvoiceLimitExceeded: false,
  isCreditLimitExceeded: false,
  creditLimit: {
    creditLimit: {
      status: true,
      value: 100,
    },
    invoice: {
      status: true,
      value: 2,
    },
  },
  activeAccountsReceivableCount: 0,
  clientId: 'client-1',
  invoiceId: 'invoice-1',
  hasAccountReceivablePermission: true,
  isChangeNegative: false,
  abilitiesLoading: false,
  creditLimitValue: null,
  ...overrides,
});

describe('buildARValidations', () => {
  it('retorna una lista vacia cuando no hay validaciones pendientes', () => {
    expect(buildARValidations(createInput())).toEqual([]);
  });

  it('mantiene prioridad y copy para venta con cambio negativo sin permiso y cliente generico', () => {
    const validations = buildARValidations(
      createInput({
        isGenericClient: true,
        hasAccountReceivablePermission: false,
        isChangeNegative: true,
      }),
    );

    expect(validations).toEqual([
      {
        status: 'error',
        icon: 'lock',
        title: 'Acceso Restringido',
        message:
          'No se puede facturar ventas con cambio negativo sin permisos de CxC',
        priority: 0,
      },
      {
        status: 'error',
        icon: 'user',
        title: 'No se puede agregar a cuenta por cobrar con cliente genérico',
        message:
          'Selecciona un cliente específico para continuar con la cuenta por cobrar',
        priority: 1,
        action: 'selectClient',
      },
    ]);
  });

  it('omite el bloqueo de permiso mientras las habilidades cargan', () => {
    const validations = buildARValidations(
      createInput({
        hasAccountReceivablePermission: false,
        isChangeNegative: true,
        abilitiesLoading: true,
      }),
    );

    expect(validations.map((validation) => validation.title)).not.toContain(
      'Acceso Restringido',
    );
  });

  it('incluye configuracion pendiente cuando un cliente especifico no tiene limites activos', () => {
    const validations = buildARValidations(
      createInput({
        creditLimit: {
          creditLimit: { status: false },
          invoice: { status: false },
        },
      }),
    );

    expect(validations).toEqual([
      {
        status: 'warning',
        icon: 'warning',
        title: 'Configuración pendiente',
        message: 'Define límites de crédito y facturas',
        action: true,
        priority: 3,
      },
    ]);
  });

  it('construye mensajes de limites superados sin cambiar el formato', () => {
    const validations = buildARValidations(
      createInput({
        isCreditLimitExceeded: true,
        isInvoiceLimitExceeded: true,
        activeAccountsReceivableCount: 2,
        creditLimit: {
          creditLimit: { status: true, value: 500 },
          invoice: { status: true, value: 3 },
        },
        creditLimitValue: 650,
      }),
    );

    expect(validations).toEqual([
      {
        status: 'warning',
        icon: 'creditCard',
        title: 'Límite de crédito excedido',
        message: 'Nuevo balance: $650.00 (límite: $500)',
        action: true,
        priority: 4,
      },
      {
        status: 'warning',
        icon: 'fileText',
        title: 'Límite de facturas alcanzado',
        message: '3 / 3 facturas (incluyendo esta)',
        action: true,
        priority: 5,
      },
    ]);
  });
});
