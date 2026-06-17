import { renderHook } from '@testing-library/react';
import type { FormInstance } from 'antd';
import { DateTime } from 'luxon';
import { describe, expect, it, vi } from 'vitest';

import { useInvoicePanelFormSync } from './useInvoicePanelFormSync';

const createForm = () =>
  ({
    setFieldsValue: vi.fn(),
  }) as unknown as FormInstance;

const createProps = ({
  accountsReceivable = {},
  form = createForm(),
  invoicePanel = false,
  onPanelClosed = vi.fn(),
} = {}) => ({
  accountsReceivable,
  form,
  invoicePanel,
  onPanelClosed,
});

describe('useInvoicePanelFormSync', () => {
  it('calls onPanelClosed only when the panel transitions from open to closed', () => {
    const form = createForm();
    const onPanelClosed = vi.fn();
    const accountsReceivable = {};

    const { rerender } = renderHook((props) => useInvoicePanelFormSync(props), {
      initialProps: createProps({
        accountsReceivable,
        form,
        invoicePanel: false,
        onPanelClosed,
      }),
    });

    rerender(
      createProps({
        accountsReceivable,
        form,
        invoicePanel: false,
        onPanelClosed,
      }),
    );

    expect(onPanelClosed).not.toHaveBeenCalled();

    rerender(
      createProps({
        accountsReceivable,
        form,
        invoicePanel: true,
        onPanelClosed,
      }),
    );

    expect(onPanelClosed).not.toHaveBeenCalled();

    rerender(
      createProps({
        accountsReceivable,
        form,
        invoicePanel: false,
        onPanelClosed,
      }),
    );

    rerender(
      createProps({
        accountsReceivable,
        form,
        invoicePanel: false,
        onPanelClosed,
      }),
    );

    expect(onPanelClosed).toHaveBeenCalledTimes(1);
  });

  it('applies defaults on open without reinjecting them during open receivable syncs', () => {
    const form = createForm();
    const onPanelClosed = vi.fn();
    const firstPaymentDate = DateTime.fromISO('2026-01-15').toMillis();
    const nextPaymentDate = DateTime.fromISO('2026-02-15').toMillis();

    const { rerender } = renderHook((props) => useInvoicePanelFormSync(props), {
      initialProps: createProps({
        accountsReceivable: { paymentDate: firstPaymentDate },
        form,
        invoicePanel: true,
        onPanelClosed,
      }),
    });

    expect(form.setFieldsValue).toHaveBeenCalledTimes(1);
    expect(form.setFieldsValue).toHaveBeenLastCalledWith(
      expect.objectContaining({
        frequency: 'monthly',
        totalInstallments: 1,
      }),
    );
    expect(
      DateTime.isDateTime(
        vi.mocked(form.setFieldsValue).mock.calls[0]?.[0]?.paymentDate,
      ),
    ).toBe(true);

    rerender(
      createProps({
        accountsReceivable: { comments: 'updated', paymentDate: nextPaymentDate },
        form,
        invoicePanel: true,
        onPanelClosed,
      }),
    );

    const syncedValues = vi.mocked(form.setFieldsValue).mock.calls[1]?.[0];

    expect(form.setFieldsValue).toHaveBeenCalledTimes(2);
    expect(syncedValues).not.toHaveProperty('frequency');
    expect(syncedValues).not.toHaveProperty('totalInstallments');
    expect(DateTime.isDateTime(syncedValues?.paymentDate)).toBe(true);
    expect(syncedValues?.comments).toBe('updated');
  });
});
