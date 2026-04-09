import type { FormInstance } from 'antd';
import { DateTime } from 'luxon';
import { useEffect } from 'react';

import { toMillis } from '@/utils/date/dateUtils';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';

const toDateTime = (value: unknown) => {
  const millis = toMillis(value);
  return millis ? DateTime.fromMillis(millis) : null;
};

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
  useEffect(() => {
    if (!invoicePanel) {
      onPanelClosed();
      return;
    }

    form.setFieldsValue({
      frequency: 'monthly',
      totalInstallments: 1,
      paymentDate: DateTime.now(),
    });

    form.setFieldsValue({
      ...accountsReceivable,
      paymentDate: toDateTime(accountsReceivable?.paymentDate),
    });
  }, [accountsReceivable, form, invoicePanel, onPanelClosed]);
};
