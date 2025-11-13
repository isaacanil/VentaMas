import { FilterOutlined, MoreOutlined } from '@ant-design/icons';
import { Form, Button, Drawer, Modal } from 'antd';
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';

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
import {
  Bar,
  MobileWrapper,
  MobileHeader,
  DrawerContent,
  ModalContent,
} from './styles';

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
  const { handlers, handleClearFilters, hasActiveFilters } = useFilterHandlers(
    filters,
    onFiltersChange,
  );
  const sortingProps = useInvoiceSorting(
    processedInvoices,
    setProcessedInvoices,
  );

  // Detectar si existen filtros activos *solo* dentro del grupo de filtros adicionales
  const hasActiveAdditionalFilters = useMemo(() => {
    return !!(
      filters?.paymentMethod ||
      filters?.minAmount ||
      filters?.maxAmount
    );
  }, [filters]);

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  // Filtros principales para desktop (siempre visibles)
  const mainFilters = useMemo(
    () => [
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
      />,
    ],
    [
      datesSelected,
      setDatesSelected,
      filters,
      handlers,
      clientOptions,
      clientsLoading,
      sortingProps,
    ],
  );

  // Filtros adicionales para modal en desktop
  const additionalFilters = useMemo(
    () => [
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
    ],
    [filters, handlers],
  );

  // Array completo de filtros para móvil
  const allFilters = useMemo(
    () => [
      ...mainFilters,
      ...additionalFilters,
      ...(hasActiveFilters
        ? [
            <ClearFiltersButton
              key="clear"
              onClear={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
            />,
          ]
        : []),
    ],
    [mainFilters, additionalFilters, hasActiveFilters, handleClearFilters],
  );

  // Componente de filtros para desktop (horizontal)
  const FiltersUIDesktop = useMemo(
    () => (
      <Form
        layout="vertical"
        style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}
      >
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
          type={hasActiveAdditionalFilters ? 'primary' : 'text'}
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
    ),
    [
      mainFilters,
      register,
      openModal,
      hasActiveFilters,
      handleClearFilters,
      hasActiveAdditionalFilters,
    ],
  );

  // Componente de filtros adicionales para el modal
  const AdditionalFiltersUI = useMemo(
    () => (
      <ModalContent>
        <Form layout="vertical">{additionalFilters}</Form>
      </ModalContent>
    ),
    [additionalFilters],
  );

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
            <Form
              layout="vertical"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
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
