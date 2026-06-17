import { FilterOutlined } from '@/constants/icons/antd';
import { Button, Drawer } from 'antd';
import { DateTime } from 'luxon';
import React, { useState } from 'react';

import { useFbGetClientsOnOpen } from '@/firebase/client/useFbGetClientsOnOpen';
import { useMediaQuery } from '@/hooks/useMediaQuery';

import { CreditNoteFiltersContent } from './CreditNoteFilters/CreditNoteFiltersContent';
import { MobileContainer } from './CreditNoteFilters/styles';

import type { DatePickerRangeValue } from '@/components/common/DatePicker/types';
import type { ElectronicTaxReceiptFilterStatus } from '@/modules/invoice/utils/electronicTaxReceipt';
import type { CreditNoteUsageFilterStatus } from '@/modules/invoice/utils/adjustmentNoteStatusDisplay';
import type {
  ClientOption,
  CreditNoteFiltersState,
} from './CreditNoteFilters/types';

export const CreditNoteFilters = ({
  filters,
  onFiltersChange,
}: {
  filters: CreditNoteFiltersState;
  onFiltersChange: (next: CreditNoteFiltersState) => void;
}) => {
  const { clients: fetchedClients, loading: clientsLoading } =
    useFbGetClientsOnOpen({
      isOpen: true,
  });
  const clients = fetchedClients.map((c) => c.client) as ClientOption[];
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [draftRange, setDraftRange] = useState<DateTime | null>(null);

  const handleDateRangeChange = (dates: DatePickerRangeValue) => {
    if (!dates || !dates[0]) {
      setDraftRange(null);
      onFiltersChange({
        ...filters,
        startDate: DateTime.local().setLocale('es').startOf('day'),
        endDate: DateTime.local().setLocale('es').endOf('day'),
      });
      return;
    }

    if (dates[0] && !dates[1]) {
      setDraftRange(dates[0]);
      return;
    }

    setDraftRange(null);
    onFiltersChange({
      ...filters,
      startDate: dates[0].startOf('day'),
      endDate: dates[1].endOf('day'),
    });
  };

  const handleClientChange = (clientId?: string) => {
    onFiltersChange({
      ...filters,
      clientId: clientId || null,
    });
  };

  const handleUsageStatusChange = (usageStatus?: CreditNoteUsageFilterStatus) => {
    onFiltersChange({
      ...filters,
      usageStatus: usageStatus || null,
    });
  };

  const handleFiscalStatusChange = (
    fiscalStatus?: ElectronicTaxReceiptFilterStatus,
  ) => {
    onFiltersChange({
      ...filters,
      fiscalStatus: fiscalStatus || null,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      startDate: DateTime.local().setLocale('es').startOf('day'),
      endDate: DateTime.local().setLocale('es').endOf('day'),
      clientId: null,
      usageStatus: null,
      fiscalStatus: null,
    });
  };

  const dateRange: DatePickerRangeValue | null = draftRange
    ? [draftRange, null]
    : filters.startDate
      ? [filters.startDate, filters.endDate]
      : null;

  const content = (
    <CreditNoteFiltersContent
      isMobile={isMobile}
      clientsLoading={clientsLoading}
      clients={clients}
      filters={filters}
      dateRange={dateRange}
      onDateRangeChange={handleDateRangeChange}
      onClientChange={handleClientChange}
      onUsageStatusChange={handleUsageStatusChange}
      onFiscalStatusChange={handleFiscalStatusChange}
      onClearFilters={handleClearFilters}
    />
  );

  if (!isMobile) {
    return content;
  }

  return (
    <MobileContainer>
      <Button icon={<FilterOutlined />} onClick={() => setDrawerVisible(true)}>
        Filtros
      </Button>
      <Drawer
        title="Filtros"
        placement="bottom"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        height="70%"
      >
        {content}
      </Drawer>
    </MobileContainer>
  );
};
