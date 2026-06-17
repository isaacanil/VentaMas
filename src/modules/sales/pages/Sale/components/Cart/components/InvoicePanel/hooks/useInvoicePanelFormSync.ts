import type { FormInstance } from 'antd';
import { DateTime } from 'luxon';
import { useEffect, useRef } from 'react';

import { toMillis } from '@/utils/date/dateUtils';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';
import type { TimestampLike } from '@/utils/date/types';

const toDateTime = (value: TimestampLike) => {
  const millis = toMillis(value);
  return millis ? DateTime.fromMillis(millis) : null;
};

const buildInvoicePanelDefaultValues = () => ({
  frequency: 'monthly',
  totalInstallments: 1,
  paymentDate: DateTime.now(),
});

const buildAccountsReceivableFormValues = (
  accountsReceivable: AccountsReceivableDoc | Record<string, unknown>,
) => ({
  ...accountsReceivable,
  paymentDate: toDateTime(accountsReceivable?.paymentDate as TimestampLike),
});

interface UseInvoicePanelFormSyncArgs {
  accountsReceivable: AccountsReceivableDoc | Record<string, unknown>;
  form: FormInstance;
  invoicePanel: boolean;
  onPanelClosed: () => void;
}

export const useInvoicePanelFormSync = ({
  accountsReceivable,
  form,
  invoicePanel,
  onPanelClosed,
}: UseInvoicePanelFormSyncArgs) => {
  const wasInvoicePanelOpenRef = useRef(false);
  const shouldApplyOpenDefaultsRef = useRef(false);

  useEffect(() => {
    const wasInvoicePanelOpen = wasInvoicePanelOpenRef.current;
    wasInvoicePanelOpenRef.current = invoicePanel;

    if (!wasInvoicePanelOpen && invoicePanel) {
      shouldApplyOpenDefaultsRef.current = true;
      return;
    }

    if (wasInvoicePanelOpen && !invoicePanel) {
      onPanelClosed();
    }
  }, [invoicePanel, onPanelClosed]);

  useEffect(() => {
    if (!invoicePanel) return;

    const shouldApplyOpenDefaults = shouldApplyOpenDefaultsRef.current;
    shouldApplyOpenDefaultsRef.current = false;

    form.setFieldsValue({
      ...(shouldApplyOpenDefaults ? buildInvoicePanelDefaultValues() : {}),
      ...buildAccountsReceivableFormValues(accountsReceivable),
    });
  }, [accountsReceivable, form, invoicePanel]);
};
