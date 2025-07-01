import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Form, Button, Drawer } from 'antd';
import { FilterOutlined } from '@ant-design/icons';

// Imports locales
import { ACCESSIBILITY_CONFIG } from './constants';
import {
  useInvoiceSorting,
  useFilterHandlers,
  useClientOptions,
  useDrawerState,
  useResponsiveLayout,
  useFilterCollapse,
} from './hooks';
import {
  CollapsibleItem,
  DateRangeFilter,
  ClientFilter,
  PaymentMethodFilter,
  AmountRangeFilter,
  SortControls,
  ClearFiltersButton,
  TotalsDisplay,
} from './components';
import { Bar, MobileWrapper, MobileHeader, DrawerContent } from './styles';

/* ─────────────────────────────────────────────────────────────────── */
/*                        COMPONENTE PRINCIPAL                          */
/* ─────────────────────────────────────────────────────────────────── */

export const FilterBar = ({
  invoices,
  datesSelected,
  setDatesSelected,
  processedInvoices,
  setProcessedInvoices,
  filters,
  onFiltersChange,
}) => {
  const { drawerVisible, openDrawer, closeDrawer } = useDrawerState();
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout();
  
  // Hook de colapso para desktop
  const { containerRef, register, visibleCount, hasOverflow } = useFilterCollapse();
  
  // Hooks personalizados
  const { clientOptions, clientsLoading } = useClientOptions();
  const { handlers, handleClearFilters, hasActiveFilters } = useFilterHandlers(filters, onFiltersChange);
  const sortingProps = useInvoiceSorting(processedInvoices, setProcessedInvoices);

  // Array ordenado de filtros (orden de prioridad)
  const filtersArray = useMemo(() => [
    <DateRangeFilter 
      key="date"
      datesSelected={datesSelected}
      setDatesSelected={setDatesSelected}
    />,
    <ClientFilter
      key="client"
      value={filters?.clientId}
      onChange={handlers.clientId}
      clientOptions={clientOptions}
      loading={clientsLoading}
    />,
    <PaymentMethodFilter
      key="payment"
      value={filters?.paymentMethod}
      onChange={handlers.paymentMethod}
    />,
    <AmountRangeFilter
      key="amount"
      minAmount={filters?.minAmount}
      maxAmount={filters?.maxAmount}
      onMinChange={handlers.minAmount}
      onMaxChange={handlers.maxAmount}
    />,
    <SortControls
      key="sort"
      sortCriteria={sortingProps.sortCriteria}
      sortDirection={sortingProps.sortDirection}
      onSortChange={sortingProps.handleSortChange}
      onToggleDirection={sortingProps.toggleSortDirection}
    />,
    ...(hasActiveFilters ? [
      <ClearFiltersButton
        key="clear"
        onClear={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />
    ] : [])
  ], [
    datesSelected, setDatesSelected, filters, handlers, clientOptions, 
    clientsLoading, sortingProps, handleClearFilters, hasActiveFilters
  ]);

  // Dividir filtros visibles y ocultos
  const visibleFilters = useMemo(() => {
    return visibleCount === Infinity ? filtersArray : filtersArray.slice(0, visibleCount);
  }, [filtersArray, visibleCount]);

  const hiddenFilters = useMemo(() => {
    return visibleCount === Infinity ? [] : filtersArray.slice(visibleCount);
  }, [filtersArray, visibleCount]);

  // Componente de filtros para desktop (horizontal)
  const FiltersUIDesktop = useMemo(() => (
    <Form layout="vertical" style={{ display: 'flex', gap: '1rem' }}>
      {visibleFilters.map((filter, index) => (
        <CollapsibleItem key={index} index={index} registerRef={register}>
          {filter}
        </CollapsibleItem>
      ))}
      
      {/* Botón "Más filtros" si hay overflow */}
      {hasOverflow && (
        <Button
          icon={<FilterOutlined />}
          onClick={openDrawer}
          size="middle"
          type="text"
          aria-label={ACCESSIBILITY_CONFIG.ariaLabels.filterButton}
        >
          Más
        </Button>
      )}
    </Form>
  ), [visibleFilters, register, hasOverflow, openDrawer]);

  // Componente de filtros ocultos para el drawer en desktop
  const HiddenFiltersUI = useMemo(() => {
    if (hiddenFilters.length === 0) return null;
    
    return (
      <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {hiddenFilters}
      </Form>
    );
  }, [hiddenFilters]);

  // Renderizado móvil
  if (isMobile) {
    return (
      <MobileWrapper>
        <MobileHeader>
          <Button 
            icon={<FilterOutlined />} 
            onClick={openDrawer}
            aria-label={ACCESSIBILITY_CONFIG.ariaLabels.filterButton}
          >
            Filtros
          </Button>
          <TotalsDisplay invoices={invoices} className="mobile-totals" />
        </MobileHeader>

        <Drawer
          title="Filtros"
          placement="bottom"
          onClose={closeDrawer}
          open={drawerVisible}
          height="auto"
        >
          <DrawerContent>
            <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <DateRangeFilter 
                datesSelected={datesSelected}
                setDatesSelected={setDatesSelected}
              />
              
              <ClientFilter
                value={filters?.clientId}
                onChange={handlers.clientId}
                clientOptions={clientOptions}
                loading={clientsLoading}
              />
              
              <PaymentMethodFilter
                value={filters?.paymentMethod}
                onChange={handlers.paymentMethod}
              />
              
              <AmountRangeFilter
                minAmount={filters?.minAmount}
                maxAmount={filters?.maxAmount}
                onMinChange={handlers.minAmount}
                onMaxChange={handlers.maxAmount}
              />
              
              <SortControls
                sortCriteria={sortingProps.sortCriteria}
                sortDirection={sortingProps.sortDirection}
                onSortChange={sortingProps.handleSortChange}
                onToggleDirection={sortingProps.toggleSortDirection}
              />
              
              <ClearFiltersButton
                onClear={handleClearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </Form>
          </DrawerContent>
        </Drawer>
      </MobileWrapper>
    );
  }

  // Renderizado desktop
  return (
    <Bar ref={containerRef}>
      {FiltersUIDesktop}
      
      {/* Drawer para filtros ocultos en desktop */}
      {hasOverflow && (
        <Drawer
          title="Filtros adicionales"
          placement="right"
          onClose={closeDrawer}
          open={drawerVisible}
          width={400}
        >
          <DrawerContent>{HiddenFiltersUI}</DrawerContent>
        </Drawer>
      )}
    </Bar>
  );
};

/* ─────────────────────────────────────────────────────────────────── */
/*                           PROPTYPES                                  */
/* ─────────────────────────────────────────────────────────────────── */

FilterBar.propTypes = {
  invoices: PropTypes.array.isRequired,
  datesSelected: PropTypes.object.isRequired,
  setDatesSelected: PropTypes.func.isRequired,
  processedInvoices: PropTypes.array.isRequired,
  setProcessedInvoices: PropTypes.func.isRequired,
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
};
