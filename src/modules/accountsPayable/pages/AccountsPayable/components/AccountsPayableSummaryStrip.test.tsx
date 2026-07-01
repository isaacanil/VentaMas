import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AccountsPayableSummary } from '../utils/accountsPayableDashboard';

import { AccountsPayableSummaryStrip } from './AccountsPayableSummaryStrip';

const buildSummary = (): AccountsPayableSummary => ({
  totalBalanceAmount: 1250,
  totalCount: 3,
  totalWithEvidence: 1,
  totalWithPayments: 1,
  reviewQueues: [
    {
      balanceAmount: 300,
      count: 1,
      key: 'pending_approval',
      label: 'Pendientes aprobación',
      tone: 'neutral',
    },
    {
      balanceAmount: 250,
      count: 1,
      key: 'on_hold',
      label: 'Retenidas',
      tone: 'warning',
    },
    {
      balanceAmount: 700,
      count: 1,
      key: 'disputed',
      label: 'En disputa',
      tone: 'danger',
    },
    {
      balanceAmount: 900,
      count: 2,
      key: 'fiscal_review',
      label: 'Revisión fiscal',
      tone: 'warning',
    },
  ],
  buckets: [
    {
      balanceAmount: 500,
      count: 1,
      key: 'current',
      label: 'Al dia',
    },
    {
      balanceAmount: 250,
      count: 1,
      key: 'due_1_30',
      label: 'Vencido 1-30',
    },
    {
      balanceAmount: 200,
      count: 1,
      key: 'due_31_60',
      label: 'Vencido 31-60',
    },
    {
      balanceAmount: 300,
      count: 1,
      key: 'due_61_plus',
      label: 'Vencido 61+',
    },
    {
      balanceAmount: 0,
      count: 0,
      key: 'no_due_date',
      label: 'Sin fecha',
    },
  ],
});

describe('AccountsPayableSummaryStrip', () => {
  it('shows loading state instead of numeric totals', () => {
    render(
      <AccountsPayableSummaryStrip
        activeBucket="all"
        activeReviewQueue="all"
        loading
        onSelectBucket={vi.fn()}
        onSelectReviewQueue={vi.fn()}
        scopeNotice="Consulta acotada a 500 registros."
        summary={buildSummary()}
      />,
    );

    expect(screen.getAllByText('Cargando')).toHaveLength(6);
    expect(screen.getAllByText('Actualizando datos')).toHaveLength(6);
    expect(screen.queryByText('Resumen parcial')).not.toBeInTheDocument();
  });

  it('shows unconfirmed state when the CxP source fails', () => {
    render(
      <AccountsPayableSummaryStrip
        activeBucket="all"
        activeReviewQueue="all"
        hasError
        onSelectBucket={vi.fn()}
        onSelectReviewQueue={vi.fn()}
        scopeNotice="Consulta acotada a 500 registros."
        summary={buildSummary()}
      />,
    );

    expect(screen.getAllByText('Sin confirmar')).toHaveLength(10);
    expect(screen.getAllByText('Revisa el aviso de carga')).toHaveLength(6);
    expect(screen.queryByText('Resumen parcial')).not.toBeInTheDocument();
  });

  it('shows operational review queues next to aging totals', () => {
    render(
      <AccountsPayableSummaryStrip
        activeBucket="all"
        activeReviewQueue="all"
        onSelectBucket={vi.fn()}
        onSelectReviewQueue={vi.fn()}
        summary={buildSummary()}
      />,
    );

    expect(screen.getByLabelText('Colas de revisión CxP')).toBeInTheDocument();
    expect(screen.getByText('Pendientes aprobación')).toBeInTheDocument();
    expect(screen.getByText('Retenidas')).toBeInTheDocument();
    expect(screen.getByText('En disputa')).toBeInTheDocument();
    expect(screen.getByText('Revisión fiscal')).toBeInTheDocument();
    expect(screen.getByText('$900.00')).toBeInTheDocument();
  });

  it('shows a visible partial-scope notice for bounded summaries', () => {
    render(
      <AccountsPayableSummaryStrip
        activeBucket="all"
        activeReviewQueue="all"
        onSelectBucket={vi.fn()}
        onSelectReviewQueue={vi.fn()}
        scopeNotice="Consulta acotada a 500 registros de un maximo operativo de 2000."
        summary={buildSummary()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Resumen parcial');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Consulta acotada a 500 registros de un maximo operativo de 2000.',
    );
  });

  it('shows visible fallback metrics without loading copy', () => {
    render(
      <AccountsPayableSummaryStrip
        activeBucket="all"
        activeReviewQueue="all"
        onSelectBucket={vi.fn()}
        onSelectReviewQueue={vi.fn()}
        scopeNotice="El resumen usa el lote visible por una falla temporal de agregados."
        summary={buildSummary()}
      />,
    );

    expect(screen.getByText('$1,250.00')).toBeInTheDocument();
    expect(screen.getByText('3 compras')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Resumen parcial');
    expect(screen.queryByText('Cargando')).not.toBeInTheDocument();
    expect(screen.queryByText('Actualizando datos')).not.toBeInTheDocument();
  });

  it('uses review queue chips as actionable filters', () => {
    const handleSelectReviewQueue = vi.fn();

    const { rerender } = render(
      <AccountsPayableSummaryStrip
        activeBucket="all"
        activeReviewQueue="all"
        onSelectBucket={vi.fn()}
        onSelectReviewQueue={handleSelectReviewQueue}
        summary={buildSummary()}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Filtrar CxP por Retenidas' }),
    );

    expect(handleSelectReviewQueue).toHaveBeenCalledWith('on_hold');

    rerender(
      <AccountsPayableSummaryStrip
        activeBucket="all"
        activeReviewQueue="on_hold"
        onSelectBucket={vi.fn()}
        onSelectReviewQueue={handleSelectReviewQueue}
        summary={buildSummary()}
      />,
    );

    const activeQueue = screen.getByRole('button', {
      name: 'Filtrar CxP por Retenidas',
    });

    expect(activeQueue).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(activeQueue);

    expect(handleSelectReviewQueue).toHaveBeenLastCalledWith('all');
  });
});
