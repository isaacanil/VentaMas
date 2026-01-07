// @ts-nocheck
import React from 'react';

import { formatPrice } from '@/utils/format';
import {
  calculateInvoicesTotal,
  countInvoices,
} from '@/utils/invoice';


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
