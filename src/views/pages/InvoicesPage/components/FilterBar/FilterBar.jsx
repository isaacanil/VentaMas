import { FilterOutlined, MoreOutlined } from '@ant-design/icons';
import { Form, Button, Drawer, Modal } from 'antd';
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';

// Imports locales
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
import { ACCESSIBILITY_CONFIG } from './constants';
import {
  useInvoiceSorting,
  useFilterHandlers,
  useClientOptions,
  useDrawerState,
  useResponsiveLayout,
  useFilterCollapse,
} from './hooks';

// Estilos del componente
const Bar = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  padding: 0.4rem 1rem;
  border-bottom: 1px solid var(--Gray);
  background: var(--White);
  justify-content: flex-start;
  
  .ant-form-item {
    margin-bottom: 0 !important;
    display: inline-block;
  }
  
  .ant-form-item-label {
    padding-bottom: 2px !important;
    line-height: 1.2 !important;
  }
  
  .ant-form-item-label > label {
    font-size: 11px !important;
    font-weight: 500 !important;
    color: #666 !important;
    height: auto !important;
  }
`;

const MobileWrapper = styled.div`
  border-bottom: 1px solid var(--Gray);
  background: var(--White);
`;

const MobileHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;

  .mobile-totals {
    display: flex;
    gap: 1rem;
    font-weight: 550;
  }
`;

const DrawerContent = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  .ant-form {
    display: flex !important;
    flex-direction: column !important;
    gap: 1.25rem !important;
  }

  .ant-select,
  .ant-picker,
  .ant-input-number {
    width: 100% !important;
  }

  .ant-input-number-group-wrapper {
    width: 100% !important;
    
    .ant-input-number {
      width: 50% !important;
    }
  }

  .ant-space-compact {
    width: 100% !important;
    
    .ant-select {
      flex: 1 !important;
    }
  }

  .ant-form-item {
    margin-bottom: 0 !important;
    width: 100% !important;
  }

  .ant-form-item-label {
    padding-bottom: 8px !important;
    
    > label {
      font-size: 14px !important;
      font-weight: 500 !important;
      color: #333 !important;
    }
  }
`;

const ModalContent = styled.div`
  .ant-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .ant-form-item {
    margin-bottom: 0 !important;
  }
  
  .ant-form-item-label > label {
    font-size: 14px !important;
    font-weight: 500 !important;
    color: #333 !important;
  }
`;

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
  const { isMobile } = useResponsiveLayout();
  const [modalVisible, setModalVisible] = useState(false);
  
  // Hook de colapso para desktop
  const { containerRef, register } = useFilterCollapse();
  
  // Hooks personalizados
  const { clientOptions, clientsLoading } = useClientOptions();
  const { handlers, handleClearFilters, hasActiveFilters } = useFilterHandlers(filters, onFiltersChange);
  const sortingProps = useInvoiceSorting(processedInvoices, setProcessedInvoices);

  // Detectar si existen filtros activos *solo* dentro del grupo de filtros adicionales
  const hasActiveAdditionalFilters = useMemo(() => {
    return !!(filters?.paymentMethod || filters?.minAmount || filters?.maxAmount);
  }, [filters]);

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  // Filtros principales para desktop (siempre visibles)
  const mainFilters = useMemo(() => [
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
    <SortControls
      key="sort"
      sortCriteria={sortingProps.sortCriteria}
      sortDirection={sortingProps.sortDirection}
      onSortChange={sortingProps.handleSortChange}
      onToggleDirection={sortingProps.toggleSortDirection}
    />
  ], [
    datesSelected, setDatesSelected, filters, handlers, clientOptions, 
    clientsLoading, sortingProps
  ]);

  // Filtros adicionales para modal en desktop
  const additionalFilters = useMemo(() => [
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
    />
  ], [filters, handlers]);

  // Array completo de filtros para móvil
  const allFilters = useMemo(() => [
    ...mainFilters,
    ...additionalFilters,
    ...(hasActiveFilters ? [
      <ClearFiltersButton
        key="clear"
        onClear={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />
    ] : [])
  ], [mainFilters, additionalFilters, hasActiveFilters, handleClearFilters]);

  // Componente de filtros para desktop (horizontal)
  const FiltersUIDesktop = useMemo(() => (
    <Form layout="vertical" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
      {mainFilters.map((filter, index) => (
        <CollapsibleItem key={index} index={index} registerRef={register}>
          {filter}
        </CollapsibleItem>
      ))}
      
      {/* Botón "Más filtros" para abrir modal */}
      <Button
        icon={<MoreOutlined />}
        onClick={openModal}
        size="middle"
        type={hasActiveAdditionalFilters ? "primary" : "text"}
        aria-label="Filtros adicionales"
      >
        Más filtros
      </Button>

      {/* Botón Limpiar filtros */}
      {hasActiveFilters && (
        <ClearFiltersButton
          onClear={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}
    </Form>
  ), [mainFilters, register, openModal, hasActiveFilters, handleClearFilters, hasActiveAdditionalFilters]);

  // Componente de filtros adicionales para el modal
  const AdditionalFiltersUI = useMemo(() => (
    <ModalContent>
      <Form layout="vertical">
        {additionalFilters}
      </Form>
    </ModalContent>
  ), [additionalFilters]);

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
          height="100vh"
        >
          <DrawerContent>
            <Form layout="vertical" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {allFilters}
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
      
      {/* Modal para filtros adicionales en desktop */}
      <Modal
        title="Filtros adicionales"
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={500}
        centered
      >
        {AdditionalFiltersUI}
      </Modal>
    </Bar>
  );
};

FilterBar.propTypes = {
  invoices: PropTypes.array.isRequired,
  datesSelected: PropTypes.object.isRequired,
  setDatesSelected: PropTypes.func.isRequired,
  processedInvoices: PropTypes.array.isRequired,
  setProcessedInvoices: PropTypes.func.isRequired,
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
}; 
