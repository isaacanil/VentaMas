import { describe, expect, it } from 'vitest';

import { applyLinkedUserDefaults } from './HrEmployeeEditorModal.helpers';

describe('HrEmployeeEditorModal helpers', () => {
  it('limpia el usuario vinculado cuando se selecciona sin usuario', () => {
    expect(
      applyLinkedUserDefaults(
        {
          code: 'EMP-1',
          fullName: 'Ana Perez',
          linkedUserId: 'user-1',
        },
        null,
      ),
    ).toMatchObject({
      code: 'EMP-1',
      fullName: 'Ana Perez',
      linkedUserId: null,
    });
  });

  it('rellena campos vacios desde el usuario sin pisar campos existentes', () => {
    expect(
      applyLinkedUserDefaults(
        {
          code: 'EMP-1',
          fullName: '',
          email: '',
          phone: '809-000-0000',
        },
        {
          value: 'user-1',
          label: 'Ana Perez',
          code: 'USR-1',
          email: 'ana@empresa.test',
          phone: '809-123-4567',
        },
      ),
    ).toMatchObject({
      linkedUserId: 'user-1',
      code: 'EMP-1',
      fullName: 'Ana Perez',
      email: 'ana@empresa.test',
      phone: '809-000-0000',
    });
  });
});
