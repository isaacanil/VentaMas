import { DateTime } from 'luxon';

import type { DatePickerRangeValue } from '@/components/common/DatePicker/types';
import type { ElectronicTaxReceiptFilterStatus } from '@/modules/invoice/utils/electronicTaxReceipt';
import type { CreditNoteUsageFilterStatus } from '@/modules/invoice/utils/adjustmentNoteStatusDisplay';
import type { CreditNoteFilters } from '@/types/creditNote';

export type CreditNoteFiltersState = Omit<
  CreditNoteFilters,
  'startDate' | 'endDate' | 'status'
> & {
  startDate: DateTime;
  endDate: DateTime;
  usageStatus?: CreditNoteUsageFilterStatus | null;
  fiscalStatus?: ElectronicTaxReceiptFilterStatus | null;
};

export type CreditNoteFiltersContentProps = {
  isMobile: boolean;
  clientsLoading: boolean;
  clients: ClientOption[];
  filters: CreditNoteFiltersState;
  dateRange: DatePickerRangeValue | null;
  onDateRangeChange: (dates: DatePickerRangeValue) => void;
  onClientChange: (clientId?: string) => void;
  onUsageStatusChange: (status?: CreditNoteUsageFilterStatus) => void;
  onFiscalStatusChange: (status?: ElectronicTaxReceiptFilterStatus) => void;
  onClearFilters: () => void;
};

export type ClientOption = {
  id?: string;
  name?: string;
  rnc?: string;
};
