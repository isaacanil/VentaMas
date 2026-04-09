import React from 'react';
import type { InvoiceRecord } from '@/modules/invoice/pages/InvoicesPage/types';

import { formatPrice } from '@/utils/format';
import { calculateInvoicesTotal, countInvoices } from '@/utils/invoice';

type TotalsDisplayProps = {
  invoices: InvoiceRecord[];
  className?: string;
};

export const TotalsDisplay = ({ invoices, className }: TotalsDisplayProps) => {
  const totalAmount = calculateInvoicesTotal(invoices);
  const totalCount = countInvoices(invoices);
  const formattedPrice = formatPrice(totalAmount);

  return (
    <div className={className}>
      <span>{formattedPrice}</span>
      <span>#{totalCount}</span>
    </div>
  );
};
