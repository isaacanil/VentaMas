import { FilterOutlined } from '@/constants/icons/antd';
import { Button, Drawer } from 'antd';
import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';

import { useFbGetClientsOnOpen } from '@/firebase/client/useFbGetClientsOnOpen';

import { CreditNoteFiltersContent } from './CreditNoteFilters/CreditNoteFiltersContent';
import { MobileContainer } from './CreditNoteFilters/styles';

import type { CreditNoteStatus } from '@/types/creditNote';
import type { DatePickerRangeValue } from '@/components/common/DatePicker/types';
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
  const [isMobile, setIsMobile] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [draftRange, setDraftRange] = useState<DateTime | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleStatusChange = (status?: CreditNoteStatus) => {
    onFiltersChange({
      ...filters,
      status: status || null,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      startDate: DateTime.local().setLocale('es').startOf('day'),
      endDate: DateTime.local().setLocale('es').endOf('day'),
      clientId: null,
      status: null,
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
      onStatusChange={handleStatusChange}
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
