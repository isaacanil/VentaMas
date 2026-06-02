import { describe, expect, it } from 'vitest';

import {
  buildLinkedUserOptions,
  buildUserLabelMap,
} from './HrPayrollWorkspace.helpers';

describe('HrPayrollWorkspace helpers', () => {
  it('convierte usuarios del negocio en opciones limpias', () => {
    const options = buildLinkedUserOptions([
      {
        uid: ' user-1 ',
        displayName: ' Ana Perez ',
        number: ' EMP-1 ',
        email: ' ana@empresa.test ',
        tel: ' 809-123-4567 ',
      },
      {
        name: 'Sin identificador',
      },
    ]);

    expect(options).toEqual([
      {
        value: 'user-1',
        label: 'Ana Perez',
        code: 'EMP-1',
        email: 'ana@empresa.test',
        phone: '809-123-4567',
      },
    ]);
  });

  it('crea un mapa estable de etiquetas por usuario', () => {
    const labels = buildUserLabelMap([
      { value: 'user-1', label: 'Ana Perez' },
      { value: 'user-2', label: 'Carlos Ruiz' },
    ]);

    expect(labels.get('user-1')).toBe('Ana Perez');
    expect(labels.get('user-2')).toBe('Carlos Ruiz');
  });
});
