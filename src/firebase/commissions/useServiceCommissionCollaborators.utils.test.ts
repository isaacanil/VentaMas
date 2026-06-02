import { describe, expect, it } from 'vitest';

import { normalizeServiceCommissionCollaboratorRecord } from './useServiceCommissionCollaborators.utils';

describe('normalizeServiceCommissionCollaboratorRecord', () => {
  it('normaliza valores minimos con codigo estable', () => {
    expect(
      normalizeServiceCommissionCollaboratorRecord('emp-1', {
        businessId: ' business-1 ',
        defaultRate: '-3',
        displayName: ' Ana Perez ',
      }),
    ).toMatchObject({
      id: 'emp-1',
      businessId: 'business-1',
      code: 'emp-1',
      name: 'Ana Perez',
      defaultType: 'percentage',
      defaultRate: 0,
      active: true,
    });
  });

  it('conserva datos de colaborador y normaliza documentos', () => {
    expect(
      normalizeServiceCommissionCollaboratorRecord('emp-2', {
        active: false,
        code: 'C-02',
        documentId: ' 001-0000000-0 ',
        documentType: 'cedula',
        hrEmployeeId: 'hr-2',
        name: 'Carlos',
        defaultType: 'fixed',
        defaultRate: '125.5',
      }),
    ).toMatchObject({
      id: 'emp-2',
      code: 'C-02',
      name: 'Carlos',
      documentType: 'cedula',
      documentId: '001-0000000-0',
      hrEmployeeId: 'hr-2',
      defaultType: 'fixed',
      defaultRate: 125.5,
      active: false,
    });
  });
});
