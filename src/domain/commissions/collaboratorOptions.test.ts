import { describe, expect, it } from 'vitest';

import type { ServiceCommissionCollaboratorRecord } from '@/domain/commissions/types';

import { buildServiceCommissionCollaboratorOptions } from './collaboratorOptions';

const collaborator = (
  overrides: Partial<ServiceCommissionCollaboratorRecord>,
): ServiceCommissionCollaboratorRecord => ({
  id: 'employee-1',
  businessId: 'business-1',
  code: 'EMP-001',
  name: 'Ana Perez',
  active: true,
  ...overrides,
});

describe('collaboratorOptions', () => {
  it('dedupes active collaborators and sorts options by label', () => {
    expect(
      buildServiceCommissionCollaboratorOptions({
        collaborators: [
          collaborator({
            id: 'employee-2',
            code: 'EMP-002',
            name: 'Zoe Ramos',
          }),
          collaborator({
            id: 'employee-inactive',
            code: 'EMP-000',
            name: 'Inactivo',
            active: false,
          }),
          collaborator({
            id: 'employee-1',
            code: 'EMP-001',
            name: 'Ana Perez',
          }),
          collaborator({
            id: 'employee-1',
            code: 'EMP-001-DUP',
            name: 'Duplicado',
          }),
        ],
      }).map(({ label, value }) => ({ label, value })),
    ).toEqual([
      { label: 'EMP-001 - Ana Perez', value: 'employee-1' },
      { label: 'EMP-002 - Zoe Ramos', value: 'employee-2' },
    ]);
  });
});
