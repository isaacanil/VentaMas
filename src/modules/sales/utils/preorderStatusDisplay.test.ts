import { describe, expect, it } from 'vitest';

import {
  getPreorderStatusLabel,
  getPreorderStatusTagColor,
  getPreorderStatusTone,
  resolvePreorderStatus,
} from './preorderStatusDisplay';

describe('preorderStatusDisplay', () => {
  it('uses the canonical top-level preorder status before legacy detail status', () => {
    expect(
      resolvePreorderStatus({
        status: 'completed',
        preorderDetails: { status: 'pending' },
      }),
    ).toBe('completed');
  });

  it('falls back to preorderDetails status for legacy records', () => {
    expect(
      resolvePreorderStatus({
        preorderDetails: { status: 'cancelled' },
      }),
    ).toBe('cancelled');
  });

  it('normalizes known status labels and tag colors', () => {
    expect(getPreorderStatusLabel('pending')).toBe('Pendiente');
    expect(getPreorderStatusLabel('completed')).toBe('Completada');
    expect(getPreorderStatusLabel('cancelled')).toBe('Cancelada');
    expect(getPreorderStatusTagColor('pending')).toBe('orange');
    expect(getPreorderStatusTagColor('completed')).toBe('green');
    expect(getPreorderStatusTagColor('cancelled')).toBe('red');
  });

  it('does not display unknown or empty statuses as cancelled', () => {
    expect(getPreorderStatusLabel(null)).toBe('Desconocida');
    expect(getPreorderStatusTagColor(undefined)).toBe('default');
    expect(getPreorderStatusLabel('archived')).toBe('Desconocida');
  });

  it('keeps modal tone values centralized', () => {
    expect(getPreorderStatusTone('completed')).toEqual({
      text: '#166534',
      background: '#dcfce7',
    });
  });
});
