import { useCallback, useMemo, useState } from 'react';

import { useFbGetClientsOnOpen } from '@/firebase/client/useFbGetClientsOnOpen';
import { useOverflowCollapse } from '@/hooks/useOverflowCollapse';
import useViewportWidth from '@/hooks/windows/useViewportWidth';
import type { InvoiceFilters } from '@/types/invoiceFilters';
import { BREAKPOINTS } from '@/modules/invoice/pages/InvoicesPage/components/FilterBar/constants';

export type SortDirection = 'asc' | 'desc';

export const sortInvoices = <T extends object>(
  invoices: T[],
  by: string,
  dir: SortDirection,
) => {
  const safeArr = Array.isArray(invoices) ? invoices : [];
  if (by === 'defaultCriteria') return safeArr;

  return [...safeArr].sort((a, b) => {
    const getValue = (obj: T) =>
      by.split('.').reduce((x, k) => {
        if (x != null && typeof x === 'object' && k in x) {
          return (x as Record<string, unknown>)[k];
        }
        return '';
      }, obj as unknown);

    let valueA = getValue(a);
    let valueB = getValue(b);

    const numericA = typeof valueA === 'string' ? Number(valueA) : valueA;
    const numericB = typeof valueB === 'string' ? Number(valueB) : valueB;
    const isNumeric =
      typeof numericA === 'number' &&
      Number.isFinite(numericA) &&
      typeof numericB === 'number' &&
      Number.isFinite(numericB);

    if (isNumeric) {
      return dir === 'asc' ? numericA - numericB : numericB - numericA;
    }

    return dir === 'asc'
      ? `${valueA}`.localeCompare(`${valueB}`)
      : `${valueB}`.localeCompare(`${valueA}`);
  });
};

export const useInvoiceSorting = () => {
  const [sortCriteria, setSortCriteria] = useState('defaultCriteria');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortCriteria(value);
  }, []);

  return {
    sortCriteria,
    sortDirection,
    handleSortChange,
    toggleSortDirection,
  };
};

export const useFilterHandlers = (
  filters: InvoiceFilters,
  onFiltersChange: (next: InvoiceFilters) => void,
) => {
  const createFilterHandler = useCallback(
    (filterKey: keyof InvoiceFilters) => (value: unknown) => {
      const nextValue =
        filterKey === 'paymentStatus' ? value || '' : (value ?? null);
      onFiltersChange?.({ ...(filters ?? {}), [filterKey]: nextValue });
    },
    [filters, onFiltersChange],
  );

  const handlers = useMemo(
    () => ({
      clientId: createFilterHandler('clientId'),
      paymentMethod: createFilterHandler('paymentMethod'),
      paymentStatus: createFilterHandler('paymentStatus'),
      minAmount: createFilterHandler('minAmount'),
      maxAmount: createFilterHandler('maxAmount'),
      receivablesOnly: createFilterHandler('receivablesOnly'),
    }),
    [createFilterHandler],
  );

  const handleClearFilters = useCallback(() => {
    onFiltersChange?.({
      ...(filters ?? {}),
      clientId: null,
      paymentMethod: null,
      paymentStatus: '',
      minAmount: null,
      maxAmount: null,
      receivablesOnly: false,
    });
  }, [filters, onFiltersChange]);

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters?.clientId ||
      filters?.paymentMethod ||
      filters?.paymentStatus ||
      filters?.minAmount ||
      filters?.maxAmount ||
      filters?.receivablesOnly
    );
  }, [filters]);

  return { handlers, handleClearFilters, hasActiveFilters };
};

interface ClientOption {
  value: string;
  label: string;
  searchText: string;
}

interface ClientRecord {
  client?: {
    id?: string;
    name?: string;
    rnc?: string;
  } | null;
}

export const useClientOptions = () => {
  const { clients: fetchedClients, loading: clientsLoading } =
    useFbGetClientsOnOpen({
      isOpen: true,
    });

  const clientOptions = useMemo<ClientOption[]>(() => {
    const clients = (fetchedClients || [])
      .map((c: ClientRecord) => c?.client)
      .filter(Boolean) as Array<NonNullable<ClientRecord['client']>>;

    return [
      { value: '', label: 'Todos', searchText: '' },
      ...clients.map((client) => ({
        value: client.id ?? '',
        label: `${client.name ?? ''}${client.rnc ? ` (${client.rnc})` : ''}`,
        searchText: `${client.name ?? ''} ${client.rnc || ''}`.toLowerCase(),
      })),
    ];
  }, [fetchedClients]);

  return { clientOptions, clientsLoading };
};

// Hook para manejar el estado del drawer
export const useDrawerState = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);

  const openDrawer = useCallback(() => setDrawerVisible(true), []);
  const closeDrawer = useCallback(() => setDrawerVisible(false), []);

  return { drawerVisible, openDrawer, closeDrawer };
};

// Hook para manejar breakpoints de manera más dinámica
export const useResponsiveLayout = () => {
  const vw = useViewportWidth();

  return useMemo(
    () => ({
      isMobile: vw <= BREAKPOINTS.mobile,
      isTablet: vw > BREAKPOINTS.mobile && vw <= BREAKPOINTS.desktop,
      isDesktop: vw > BREAKPOINTS.desktop,
      currentBreakpoint:
        vw <= BREAKPOINTS.mobile
          ? 'mobile'
          : vw <= BREAKPOINTS.desktop
            ? 'tablet'
            : 'desktop',
    }),
    [vw],
  );
};

// Hook de colapso para desktop
export const useFilterCollapse = () => {
  return useOverflowCollapse({
    moreButtonWidth: 80, // Ancho estimado del botón "Más filtros"
    gap: 16, // Gap entre elementos
  });
};
