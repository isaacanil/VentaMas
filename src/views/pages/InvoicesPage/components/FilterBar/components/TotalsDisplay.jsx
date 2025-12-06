import React from 'react';

import { useFormatPrice } from '../../../../../../hooks/useFormatPrice';
import {
  calculateInvoicesTotal,
  countInvoices,
} from '../../../../../../utils/invoice';

export const TotalsDisplay = ({ invoices, className }) => {
  const totalAmount = calculateInvoicesTotal(invoices);
  const totalCount = countInvoices(invoices);
  const formattedPrice = useFormatPrice(totalAmount);

  return (
    <div className={className}>
      <span>{formattedPrice}</span>
      <span>#{totalCount}</span>
    </div>
  );
};
