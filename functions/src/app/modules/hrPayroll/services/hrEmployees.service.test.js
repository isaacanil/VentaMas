import { describe, expect, it } from 'vitest';

import {
  buildBusinessPartyPayload,
  buildHrEmployeePayload,
  normalizeHrEmployeeInput,
  resolveHrEmployeeId,
  validateHrEmployeeInput,
} from './hrEmployees.service.js';

describe('hrEmployees.service', () => {
  it('normaliza el empleado y deriva un id estable desde el codigo', () => {
    const employee = normalizeHrEmployeeInput({
      code: ' EMP-001 ',
      fullName: '  Ana Perez  ',
      documentId: ' 001-1234567-8 ',
      payType: 'mixed',
      baseSalaryAmount: '25000',
      commissionEnabled: true,
      defaultCommissionRate: '5',
    });

    expect(resolveHrEmployeeId({ code: ' EMP-001 ' })).toBe('emp-001');
    expect(employee).toMatchObject({
      employeeId: 'emp-001',
      code: 'EMP-001',
      fullName: 'Ana Perez',
      documentId: '001-1234567-8',
      payType: 'mixed',
      baseSalaryAmount: 25000,
      commissionEnabled: true,
      defaultCommissionRate: 5,
      readyToPayStatus: 'needs_review',
    });
    expect(employee.readyToPayIssues).toContain(
      'Falta cuenta o destino de transferencia.',
    );
  });

  it('marca como listo cuando tiene datos minimos de pago', () => {
    const employee = normalizeHrEmployeeInput({
      id: 'cashier-1',
      code: 'CAJ-01',
      fullName: 'Caja Principal',
      documentId: '40212345678',
      payType: 'salary',
      baseSalaryAmount: 18000,
      paymentMethod: 'cash',
    });

    expect(employee.readyToPayStatus).toBe('ready');
    expect(employee.readyToPayIssues).toEqual([]);
  });

  it('valida campos obligatorios antes de escribir', () => {
    const employee = normalizeHrEmployeeInput({
      code: '',
      fullName: '',
    });

    expect(validateHrEmployeeInput(employee)).toEqual(
      expect.arrayContaining(['codigo es requerido.', 'nombre es requerido.']),
    );
  });

  it('construye payloads coherentes para party y empleado', () => {
    const timestamp = { __serverTimestamp: true };
    const employee = normalizeHrEmployeeInput({
      id: 'employee-1',
      code: 'EMP-1',
      fullName: 'Luis Mora',
      linkedUserId: 'user-1',
      documentId: '00122233344',
      paymentMethod: 'cash',
      baseSalaryAmount: 10000,
    });

    const party = buildBusinessPartyPayload({
      businessId: 'business-1',
      employee,
      timestamp,
      authUid: 'admin-1',
      isNew: true,
    });
    const hrEmployee = buildHrEmployeePayload({
      businessId: 'business-1',
      employee,
      timestamp,
      authUid: 'admin-1',
      isNew: true,
    });

    expect(party).toMatchObject({
      id: 'employee-1',
      businessId: 'business-1',
      displayName: 'Luis Mora',
      roles: { employee: true },
      linkedUserIds: ['user-1'],
      profileRefs: { hrEmployeeId: 'employee-1' },
    });
    expect(hrEmployee).toMatchObject({
      id: 'employee-1',
      partyId: 'employee-1',
      linkedUserId: 'user-1',
      readyToPayStatus: 'ready',
      partySnapshot: {
        displayName: 'Luis Mora',
        documentId: '00122233344',
      },
    });
  });
});
