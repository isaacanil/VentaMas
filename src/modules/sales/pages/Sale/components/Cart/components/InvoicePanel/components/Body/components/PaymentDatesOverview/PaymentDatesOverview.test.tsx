import { fireEvent, render, screen, within } from '@testing-library/react';
import { DateTime } from 'luxon';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import PaymentDatesOverview from './PaymentDatesOverview';

vi.mock('@/constants/icons/antd', () => ({
  CalendarOutlined: () => <span data-testid="calendar-icon" />,
}));

vi.mock('@/components/heroui', () => {
  type MockButtonProps = Record<string, unknown> & {
    children?: ReactNode;
    isDisabled?: boolean;
    onPress?: () => void;
  };

  type MockModalProps = Record<string, unknown> & {
    ariaLabel?: string;
    children?: ReactNode;
    footer?: ReactNode;
    isDismissable?: boolean;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    title?: ReactNode;
  };

  function VmButton({
    children,
    fullWidth: _fullWidth,
    isDisabled,
    onPress,
    variant: _variant,
    ...props
  }: MockButtonProps) {
    return (
      <button
        {...props}
        disabled={Boolean(isDisabled)}
        onClick={() => onPress?.()}
      >
        {children}
      </button>
    );
  }

  function VmModal({
    ariaLabel,
    children,
    footer,
    isDismissable,
    isOpen,
    onOpenChange,
    title,
  }: MockModalProps) {
    return isOpen ? (
      <div
        role="dialog"
        aria-label={String(ariaLabel || title || '')}
        data-is-dismissable={String(isDismissable)}
      >
        <button
          type="button"
          aria-label="Cerrar modal"
          onClick={() => onOpenChange?.(false)}
        />
        {title ? <h2>{title}</h2> : null}
        {children}
        {footer ? <footer>{footer}</footer> : null}
      </div>
    ) : null;
  }

  return {
    VmButton,
    VmModal,
  };
});

const firstPayment = DateTime.fromISO('2026-07-25').toMillis();
const secondPayment = DateTime.fromISO('2026-08-25').toMillis();

describe('PaymentDatesOverview', () => {
  it('opens and closes the payment plan with explicit VmModal controls', () => {
    render(
      <PaymentDatesOverview
        paymentDates={[firstPayment, secondPayment]}
        nextPaymentDate={firstPayment}
        frequency="monthly"
        installments={2}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ver fechas de pago' }));

    const dialog = screen.getByRole('dialog', {
      name: 'Plan de pagos mensual (2 cuotas)',
    });
    expect(dialog).toHaveAttribute('data-is-dismissable', 'false');
    expect(within(dialog).getByText('Pago #1')).toBeInTheDocument();
    expect(within(dialog).getByText('Próximo pago')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cerrar' }));

    expect(
      screen.queryByRole('dialog', {
        name: 'Plan de pagos mensual (2 cuotas)',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders the calendar view without range preset copy', () => {
    render(
      <PaymentDatesOverview
        paymentDates={[firstPayment, secondPayment]}
        nextPaymentDate={firstPayment}
        frequency="monthly"
        installments={2}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ver fechas de pago' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver calendario' }));

    const dialog = screen.getByRole('dialog', {
      name: 'Plan de pagos mensual (2 cuotas)',
    });
    expect(within(dialog).getByText('julio 2026')).toBeInTheDocument();
    expect(within(dialog).getByText('agosto 2026')).toBeInTheDocument();
    expect(within(dialog).queryByText('Últimos 90 días')).toBeNull();
    expect(within(dialog).queryByText('PERIODOS PASADOS')).toBeNull();
  });
});
