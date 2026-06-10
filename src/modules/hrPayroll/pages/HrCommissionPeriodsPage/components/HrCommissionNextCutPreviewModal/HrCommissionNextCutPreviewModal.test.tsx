import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { HrCommissionNextCutPreview } from '@/types/hrPayroll';

import { HrCommissionNextCutPreviewModal } from './HrCommissionNextCutPreviewModal';

const preview: HrCommissionNextCutPreview = {
  ok: true,
  preview: true,
  blocked: false,
  blockedReason: null,
  businessId: 'business-1',
  ruleId: 'rule-1',
  ruleLabel: 'Corte quincenal',
  frequency: 'biweekly',
  startDateKey: '2026-06-01',
  endDateKey: '2026-06-15',
  businessTimeZone: 'America/Santo_Domingo',
  employeesCount: 2,
  entriesCount: 4,
  totalEstimatedAmount: 1610,
  currency: 'DOP',
  exceedsMaxCutEntries: false,
  maxCutEntries: 450,
  retroactiveEntriesCount: 0,
  hasRetroactiveEntries: false,
  canCreate: true,
};

describe('HrCommissionNextCutPreviewModal', () => {
  it('calls create only when the confirmation button is pressed', () => {
    const onConfirm = vi.fn();

    render(
      <HrCommissionNextCutPreviewModal
        actionKey={null}
        isOpen
        preview={preview}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /crear corte/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('blocks confirmation when the preview reports retroactive entries', () => {
    render(
      <HrCommissionNextCutPreviewModal
        actionKey={null}
        isOpen
        preview={{
          ...preview,
          blocked: true,
          canCreate: false,
          hasRetroactiveEntries: true,
          retroactiveEntriesCount: 1,
        }}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText(/retroactiva pendiente/i)).toBeInTheDocument();
    expect(
      screen.getByRole('dialog', { name: /revisar próximo corte/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Retroactivas pendientes')).toBeInTheDocument();
    expect(screen.queryByText(/total estimado/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /crear corte/i }),
    ).not.toBeInTheDocument();
  });

  it('opens retroactive review from the confirmation modal', () => {
    const onReviewRetroactives = vi.fn();

    render(
      <HrCommissionNextCutPreviewModal
        actionKey={null}
        isOpen
        preview={{
          ...preview,
          blocked: true,
          canCreate: false,
          hasRetroactiveEntries: true,
          retroactiveEntriesCount: 1,
        }}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        onReviewRetroactives={onReviewRetroactives}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /revisar retroactivas/i }),
    );

    expect(onReviewRetroactives).toHaveBeenCalledTimes(1);
  });
});
