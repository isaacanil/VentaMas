import { useEffect, useState, useMemo, useCallback } from 'react';

import { useFbGetClientsOnOpen } from '../../../../../../firebase/client/useFbGetClientsOnOpen';
import { useOverflowCollapse } from '../../../../../../hooks/useOverflowCollapse';
import useViewportWidth from '../../../../../../hooks/windows/useViewportWidth';
import { BREAKPOINTS } from '../constants';

export const useInvoiceSorting = (processedInvoices, setProcessedInvoices) => {
  const [sortCriteria, setSortCriteria] = useState('defaultCriteria');
  const [sortDirection, setSortDirection] = useState('asc');

  const sortInvoices = useCallback((arr, by, dir) => {
  const safeArr = Array.isArray(arr) ? arr : [];
  if (by === 'defaultCriteria') return safeArr;

    return [...safeArr].sort((a, b) => {
      const getValue = (obj) => by.split('.').reduce((x, k) => (x != null ? x[k] : ''), obj);
      let valueA = getValue(a);
      let valueB = getValue(b);
      
      const isNumeric = !isNaN(parseFloat(valueA)) && !isNaN(parseFloat(valueB));
      
      if (isNumeric) {
        valueA = parseFloat(valueA);
        valueB = parseFloat(valueB);
        return dir === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      return dir === 'asc' 
        ? `${valueA}`.localeCompare(`${valueB}`) 
        : `${valueB}`.localeCompare(`${valueA}`);
    });
  }, []);

  const sortAndSetInvoices = useCallback(() => {
    const sorted = sortInvoices(processedInvoices, sortCriteria, sortDirection);
    // Evitar actualizaciones redundantes de estado
    const current = Array.isArray(processedInvoices) ? processedInvoices : [];
    const isSameOrder =
      sorted.length === current.length &&
      sorted.every((item, idx) => item === current[idx]);
    if (!isSameOrder) {
      setProcessedInvoices(sorted);
    }
  }, [processedInvoices, sortCriteria, sortDirection, sortInvoices, setProcessedInvoices]);

  const toggleSortDirection = useCallback(() => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  const handleSortChange = useCallback((value) => {
    setSortCriteria(value);
  }, []);

  useEffect(() => {
    sortAndSetInvoices();
  }, [sortAndSetInvoices]);

  return {
    sortCriteria,
    sortDirection,
    handleSortChange,
    toggleSortDirection,
  };
};

export const useFilterHandlers = (filters, onFiltersChange) => {
  const createFilterHandler = useCallback((filterKey) => (value) => {
    onFiltersChange?.({ ...(filters ?? {}), [filterKey]: value ?? null });
  }, [filters, onFiltersChange]);

  const handlers = useMemo(() => ({
    clientId: createFilterHandler('clientId'),
    paymentMethod: createFilterHandler('paymentMethod'),
    minAmount: createFilterHandler('minAmount'),
    maxAmount: createFilterHandler('maxAmount'),
  }), [createFilterHandler]);

  const handleClearFilters = useCallback(() => {
    onFiltersChange?.({
      ...(filters ?? {}),
      clientId: null,
      paymentMethod: null,
      minAmount: null,
      maxAmount: null,
    });
  }, [filters, onFiltersChange]);

  const hasActiveFilters = useMemo(() => {
    return !!(filters?.clientId || filters?.paymentMethod || filters?.minAmount || filters?.maxAmount);
  }, [filters]);

  return { handlers, handleClearFilters, hasActiveFilters };
};

export const useClientOptions = () => {
  const { clients: fetchedClients, loading: clientsLoading } = useFbGetClientsOnOpen({ isOpen: true });
  
  const clientOptions = useMemo(() => {
  const clients = (fetchedClients || []).map((c) => c?.client).filter(Boolean);
    return [
      { value: '', label: 'Todos' },
      ...clients.map(client => ({
        value: client.id,
        label: `${client.name}${client.rnc ? ` (${client.rnc})` : ''}`,
        searchText: `${client.name} ${client.rnc || ''}`.toLowerCase(),
      }))
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
  
  return useMemo(() => ({
    isMobile: vw <= BREAKPOINTS.mobile,
  isTablet: vw > BREAKPOINTS.mobile && vw <= BREAKPOINTS.desktop,
  isDesktop: vw > BREAKPOINTS.desktop,
    currentBreakpoint: vw <= BREAKPOINTS.mobile ? 'mobile' : 
                      vw <= BREAKPOINTS.desktop ? 'tablet' : 'desktop'
  }), [vw]);
};

// Hook de colapso para desktop
export const useFilterCollapse = () => {
  return useOverflowCollapse({
    moreButtonWidth: 80, // Ancho estimado del botón "Más filtros"
    gap: 16 // Gap entre elementos
  });
}; 