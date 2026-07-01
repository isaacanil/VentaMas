import { describe, expect, it, vi } from 'vitest';

import type { AccountsPayableControlActionDefinition } from './accountsPayableControlActions';
import { buildAccountsPayableControlMenuItems } from './accountsPayableControlMenuItems';

const buildActionDefinition = (
  overrides: Partial<AccountsPayableControlActionDefinition>,
): AccountsPayableControlActionDefinition =>
  ({
    action: 'place_hold',
    confirmLabel: 'Confirmar',
    description: 'Descripción',
    evidenceLabel: 'Evidencia',
    evidencePlaceholder: 'Referencia',
    label: 'Poner en hold',
    reasonLabel: 'Motivo',
    reasonPlaceholder: 'Motivo de control',
    requiresEvidence: true,
    title: 'Control CxP',
    tone: 'warning',
    ...overrides,
  }) as AccountsPayableControlActionDefinition;

describe('accountsPayableControlMenuItems', () => {
  it('maps control action definitions into AntD menu items', () => {
    const items = buildAccountsPayableControlMenuItems({
      actions: [
        buildActionDefinition({ action: 'approve', label: 'Aprobar' }),
        buildActionDefinition({
          action: 'reject',
          label: 'Rechazar',
          tone: 'danger',
        }),
      ],
      onSelect: vi.fn(),
    });

    expect(items).toEqual([
      expect.objectContaining({
        danger: false,
        key: 'approve',
        label: 'Aprobar',
      }),
      expect.objectContaining({
        danger: true,
        key: 'reject',
        label: 'Rechazar',
      }),
    ]);
  });

  it('stops row propagation and selects the clicked action', () => {
    const onSelect = vi.fn();
    const stopPropagation = vi.fn();
    const items = buildAccountsPayableControlMenuItems({
      actions: [buildActionDefinition({ action: 'open_dispute' })],
      onSelect,
    });
    const item = items?.[0] as { onClick?: (info: unknown) => void };

    item.onClick?.({ domEvent: { stopPropagation } });

    expect(stopPropagation).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith('open_dispute');
  });
});
