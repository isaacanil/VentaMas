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
      documentType: 'pasaporte',
      documentId: ' 001-1234567-8 ',
      gender: 'Femenino',
      phone: '809-123-4567',
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
      documentType: 'passport',
      documentId: '001-1234567-8',
      gender: 'female',
      phone: '+18091234567',
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
      documentType: 'cedula',
      documentId: '40212345678',
      phone: '+1 (829) 222-3333',
      payType: 'salary',
      baseSalaryAmount: 18000,
      paymentMethod: 'cash',
    });

    expect(employee.readyToPayStatus).toBe('ready');
    expect(employee.phone).toBe('+18292223333');
    expect(employee.readyToPayIssues).toEqual([]);
  });

  it('normaliza deducciones salariales como obligaciones por pagar', () => {
    const employee = normalizeHrEmployeeInput({
      id: 'employee-deductions',
      code: 'EMP-DED',
      fullName: 'Empleado con Deducciones',
      documentId: '40212345678',
      paymentMethod: 'cash',
      payType: 'salary',
      baseSalaryAmount: 30000,
      salaryDeductions: [
        { id: 'afp', kind: 'afp', mode: 'percentage', rate: '2.87' },
        { id: 'tss', kind: 'tss', mode: 'percentage', rate: 3.04 },
        {
          id: 'salary_itbis',
          kind: 'salary_itbis',
          mode: 'percentage',
          rate: 1,
        },
      ],
    });

    expect(employee.readyToPayStatus).toBe('ready');
    expect(employee.salaryDeductions).toEqual([
      expect.objectContaining({
        id: 'afp',
        kind: 'afp',
        rate: 2.87,
        payableObligation: true,
        accountSystemKey: 'accounts_payable',
      }),
      expect.objectContaining({
        id: 'tss',
        kind: 'tss',
        rate: 3.04,
        payableObligation: true,
        accountSystemKey: 'accounts_payable',
      }),
      expect.objectContaining({
        id: 'salary_itbis',
        kind: 'salary_itbis',
        rate: 1,
        payableObligation: true,
        accountSystemKey: 'tax_payable',
      }),
    ]);
  });

  it('acepta comision configurada solo por servicio especifico', () => {
    const employee = normalizeHrEmployeeInput({
      id: 'stylist-1',
      code: 'STY-01',
      fullName: 'Servicio Avanzado',
      documentType: 'cedula',
      documentId: '40212345678',
      payType: 'commission_only',
      commissionEnabled: true,
      paymentMethod: 'cash',
      serviceCommissionRules: [
        {
          serviceId: 'service-advanced',
          serviceName: 'Servicio avanzado',
          type: 'percentage',
          rateValue: '30',
        },
      ],
    });

    const payload = buildHrEmployeePayload({
      businessId: 'business-1',
      employee,
      timestamp: { __serverTimestamp: true },
      authUid: 'admin-1',
      isNew: true,
    });

    expect(employee.readyToPayStatus).toBe('ready');
    expect(payload.serviceCommissionRules).toEqual([
      {
        id: 'service-advanced',
        serviceId: 'service-advanced',
        serviceName: 'Servicio avanzado',
        type: 'percentage',
        rateValue: 30,
        active: true,
      },
    ]);
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
      documentType: 'rnc',
      documentId: '00122233344',
      gender: 'M',
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
      documentType: 'rnc',
      documentId: '00122233344',
      gender: 'male',
      roles: { employee: true },
      linkedUserIds: ['user-1'],
      profileRefs: { hrEmployeeId: 'employee-1' },
    });
    expect(hrEmployee).toMatchObject({
      id: 'employee-1',
      partyId: 'employee-1',
      linkedUserId: 'user-1',
      documentType: 'rnc',
      gender: 'male',
      readyToPayStatus: 'ready',
      partySnapshot: {
        displayName: 'Luis Mora',
        documentType: 'rnc',
        documentId: '00122233344',
        gender: 'male',
      },
    });
  });
});
