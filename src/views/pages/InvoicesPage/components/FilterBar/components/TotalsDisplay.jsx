import React from 'react';

import {
  calculateInvoicesTotal,
  countInvoices,
} from '../../../../../../utils/invoice';

import { formatPrice } from '@/utils/format';

export const TotalsDisplay = ({ invoices, className }) => {
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
