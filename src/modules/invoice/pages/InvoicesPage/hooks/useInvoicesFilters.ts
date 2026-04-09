import { useMemo, useState } from 'react';

import { useFbGetInvoicesWithFilters } from '@/firebase/invoices/useFbGetInvoicesWithFilters';
import type {
  DateRangeSelection,
  InvoiceFilters,
} from '@/types/invoiceFilters';
import { getDateRange } from '@/utils/date/getDateRange';

const DEFAULT_FILTERS: InvoiceFilters = {
  clientId: null,
  receivablesOnly: false,
  paymentStatus: '',
};

export const useInvoicesFilters = () => {
  const [datesSelected, setDatesSelected] = useState<DateRangeSelection>(
    getDateRange('today') as DateRangeSelection,
  );
  const [baseFilters, setBaseFilters] =
    useState<InvoiceFilters>(DEFAULT_FILTERS);

  const filters = useMemo<InvoiceFilters>(
    () => ({
      ...baseFilters,
      startDate: datesSelected.startDate,
      endDate: datesSelected.endDate,
    }),
    [baseFilters, datesSelected.endDate, datesSelected.startDate],
  );

  const { invoices, loading } = useFbGetInvoicesWithFilters(filters);

  return {
    datesSelected,
    setDatesSelected,
    filters,
    invoices,
    loading,
    setBaseFilters,
  };
};
