import { useState } from 'react';

import { PillButton } from '@/views/component/PillButton/PillButton';
import { CashupInvoicesOverview } from '@/views/pages/CashReconciliation/page/CashupInvoicesOverview/CashupInvoicesOverview';
import type { CashCountInvoice } from '@/utils/cashCount/types';

interface ViewInvoiceProps {
  invoices?: CashCountInvoice[];
  invoicesCount?: number;
  loading?: boolean;
}

export const ViewInvoice = ({
  invoices = [],
  invoicesCount = 0,
  loading = false,
}: ViewInvoiceProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleOpenInvoiceView = () => setIsOpen(true);

  return (
    <>
      <PillButton
        onClick={handleOpenInvoiceView}
        loading={loading}
        badgeCount={invoicesCount}
      >
        Facturas
      </PillButton>
      <CashupInvoicesOverview
        isOpen={isOpen}
        invoices={invoices}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};
