import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AccountsPayablePayment } from '@/types/payments';

import { SupplierPaymentVoidModal } from './SupplierPaymentVoidModal';

const payment = {
  id: 'payment-1',
  receiptNumber: 'REC-001',
} as AccountsPayablePayment;

describe('SupplierPaymentVoidModal', () => {
  it('requires reason and evidence before confirming a void action', () => {
    const onConfirm = vi.fn();

    render(
      <SupplierPaymentVoidModal
        onCancel={vi.fn()}
        onConfirm={onConfirm}
        open
        payment={payment}
      />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Anular pago' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent(
      'Indica un motivo de al menos 5 caracteres.',
    );
    expect(screen.getAllByRole('alert')[1]).toHaveTextContent(
      'Indica una evidencia o referencia.',
    );
    expect(screen.getByLabelText('Motivo de anulación')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText('Evidencia o referencia')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('requires evidence when the reason is valid', () => {
    const onConfirm = vi.fn();

    render(
      <SupplierPaymentVoidModal
        onCancel={vi.fn()}
        onConfirm={onConfirm}
        open
        payment={payment}
      />,
    );

    fireEvent.change(screen.getByLabelText('Motivo de anulación'), {
      target: { value: 'Pago duplicado' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Anular pago' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Indica una evidencia o referencia.',
    );
  });

  it('trims and forwards a valid void reason and evidence', () => {
    const onConfirm = vi.fn();

    render(
      <SupplierPaymentVoidModal
        onCancel={vi.fn()}
        onConfirm={onConfirm}
        open
        payment={payment}
      />,
    );

    fireEvent.change(screen.getByLabelText('Motivo de anulación'), {
      target: { value: '  Pago duplicado  ' },
    });
    fireEvent.change(screen.getByLabelText('Evidencia o referencia'), {
      target: { value: '  Ticket AP-104  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Anular pago' }));

    expect(onConfirm).toHaveBeenCalledWith('Pago duplicado', 'Ticket AP-104');
  });
});
