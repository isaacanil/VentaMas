import { DateTime } from 'luxon';

import type { DatePickerRangeValue } from '@/components/common/DatePicker/types';
import type { CreditNoteFilters, CreditNoteStatus } from '@/types/creditNote';

export type CreditNoteFiltersState = Omit<
  CreditNoteFilters,
  'startDate' | 'endDate'
> & {
  startDate: DateTime;
  endDate: DateTime;
};

export type CreditNoteFiltersContentProps = {
  isMobile: boolean;
  clientsLoading: boolean;
  clients: ClientOption[];
  filters: CreditNoteFiltersState;
  dateRange: DatePickerRangeValue | null;
  onDateRangeChange: (dates: DatePickerRangeValue) => void;
  onClientChange: (clientId?: string) => void;
  onStatusChange: (status?: CreditNoteStatus) => void;
  onClearFilters: () => void;
};

export type ClientOption = {
  id?: string;
  name?: string;
  rnc?: string;
};
