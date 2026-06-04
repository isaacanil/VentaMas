import { describe, expect, it } from 'vitest';

import {
  buildServiceCommissionLineSnapshot,
  isServiceCommissionCollaboratorEligible,
  isServiceCommissionLineEligible,
  normalizeServiceCommissionServiceRules,
} from './serviceCommissions';

describe('serviceCommissions eligibility', () => {
  it('marca elegible un colaborador activo con tipo y tasa positiva', () => {
    expect(
      isServiceCommissionCollaboratorEligible({
        active: true,
        code: 'C-001',
        defaultRate: 5,
        defaultType: 'percentage',
        name: 'Ana',
      }),
    ).toBe(true);
  });

  it('rechaza colaboradores sin tasa de comision efectiva', () => {
    expect(
      isServiceCommissionCollaboratorEligible({
        active: true,
        code: 'C-002',
        defaultRate: 0,
        defaultType: 'percentage',
        name: 'Luis',
      }),
    ).toBe(false);

    expect(
      isServiceCommissionCollaboratorEligible({
        active: true,
        code: 'C-003',
        defaultRate: null,
        defaultType: 'percentage',
        name: 'Marta',
      }),
    ).toBe(false);
  });

  it('rechaza lineas que no vienen de un colaborador con comision configurada', () => {
    expect(
      isServiceCommissionLineEligible({
        collaboratorCode: 'C-004',
        collaboratorName: 'Ramon',
        rateValue: 10,
        source: 'manual',
        type: 'percentage',
      }),
    ).toBe(false);
  });

  it('normaliza reglas especificas por servicio y elimina duplicados por servicio', () => {
    expect(
      normalizeServiceCommissionServiceRules([
        {
          serviceId: 'service-1',
          serviceName: 'Consulta',
          type: 'percentage',
          rateValue: '12.5',
        },
        {
          serviceId: 'service-1',
          serviceName: 'Consulta avanzada',
          type: 'fixed',
          rateValue: 200,
        },
      ]),
    ).toEqual([
      {
        id: 'service-1',
        serviceId: 'service-1',
        serviceName: 'Consulta avanzada',
        type: 'fixed',
        rateValue: 200,
        active: true,
      },
    ]);
  });

  it('usa la regla del servicio antes que la comision general', () => {
    const snapshot = buildServiceCommissionLineSnapshot({
      collaborator: {
        id: 'emp-1',
        code: 'EMP-1',
        name: 'Ana',
        defaultType: 'percentage',
        defaultRate: 5,
        serviceCommissionRules: [
          {
            serviceId: 'service-advanced',
            serviceName: 'Servicio avanzado',
            type: 'percentage',
            rateValue: 25,
            active: true,
          },
        ],
      },
      defaultRate: 10,
      defaultType: 'percentage',
      product: {
        id: 'service-advanced',
        cid: 'line-1',
        name: 'Servicio avanzado',
        itemType: 'service',
        amountToBuy: 1,
        cost: { total: 0 },
        pricing: { listPrice: 1000, price: 1000 },
      },
    });

    expect(snapshot).toMatchObject({
      rateValue: 25,
      source: 'service',
      estimatedCommissionAmount: 250,
    });
  });

  it('permite colaborador configurado solo para el servicio de la linea', () => {
    const collaborator = {
      active: true,
      code: 'EMP-2',
      defaultRate: null,
      defaultType: 'percentage' as const,
      name: 'Luis',
      serviceCommissionRules: [
        {
          serviceId: 'service-advanced',
          serviceName: 'Servicio avanzado',
          type: 'percentage' as const,
          rateValue: 15,
          active: true,
        },
      ],
    };

    expect(
      isServiceCommissionCollaboratorEligible(collaborator, {
        id: 'service-advanced',
        cid: 'line-2',
        name: 'Servicio avanzado',
        itemType: 'service',
        amountToBuy: 1,
        cost: { total: 0 },
      }),
    ).toBe(true);

    expect(
      isServiceCommissionLineEligible({
        collaborator,
        collaboratorCode: 'EMP-2',
        collaboratorName: 'Luis',
        rateValue: 15,
        source: 'service',
        type: 'percentage',
      }),
    ).toBe(true);
  });
});
