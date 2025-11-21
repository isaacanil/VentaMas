import { Button, Select } from 'antd';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';

import { DatePicker } from '../../../../../../../components/common/DatePicker';
import { icons } from '../../../../../../../constants/icons/icons';
import useBusiness from '../../../../../../../hooks/useBusiness';
import useViewportWidth from '../../../../../../../hooks/windows/useViewportWidth';
import { sortAccounts } from '../../../../../../../utils/sorts/sortAccountsReceivable';

export const FilterAccountReceivable = ({
  datesSelected = [],
  setDatesSelected = () => {},
  accounts = [],
  onSort = () => {},
  onClientTypeChange = () => {},
  statusFilter = 'active',
  onStatusFilterChange = () => {},
}) => {
  // --- LÓGICA INTACTA (NO SE HA TOCADO NADA) ---
  const [sortCriteria, setSortCriteria] = useState('defaultCriteria');
  const [sortDirection, setSortDirection] = useState('asc');
  const { isPharmacy } = useBusiness();

  const handleSort = (newCriteria) => {
    setSortCriteria(newCriteria);
    const sortedAccounts = sortAccounts(accounts, newCriteria, sortDirection);
    onSort(sortedAccounts);
  };

  const toggleSortDirection = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    const sortedAccounts = sortAccounts(accounts, sortCriteria, newDirection);
    onSort(sortedAccounts);
  };

  const handleSortChange = (value) => {
    handleSort(value);
  };

  const handleClientTypeChange = (value) => {
    onClientTypeChange(value);
  };

  const handleStatusChange = (value) => {
    onStatusFilterChange(value);
  };

  const datePickerValue = useMemo(() => {
    const hasStart =
      datesSelected?.startDate || datesSelected?.startDate === 0;
    const hasEnd = datesSelected?.endDate || datesSelected?.endDate === 0;
    if (!hasStart && !hasEnd) return null;

    const startValue = hasStart ? dayjs(datesSelected.startDate) : null;
    const endValue = hasEnd ? dayjs(datesSelected.endDate) : null;
    return [startValue, endValue];
  }, [datesSelected]);

  const handleDateRangeChange = (range) => {
    if (!Array.isArray(range)) {
      setDatesSelected({ startDate: null, endDate: null });
      return;
    }
    const [start, end] = range;
    const normalizePart = (value, boundary = 'start') => {
      if (!value || !dayjs.isDayjs(value)) return null;
      return (boundary === 'start'
        ? value.startOf('day')
        : value.endOf('day')
      ).valueOf();
    };
    setDatesSelected({
      startDate: normalizePart(start, 'start'),
      endDate: normalizePart(end, 'end'),
    });
  };

  const sortOptions = [
    { value: 'defaultCriteria', label: 'Por defecto' },
    { value: 'date', label: 'Fecha' },
    { value: 'invoiceNumber', label: 'No. Factura' },
    { value: 'client', label: 'Cliente' },
    { value: 'balance', label: 'Balance' },
    { value: 'initialAmount', label: 'Monto Inicial' },
  ];

  if (isPharmacy) {
    sortOptions.splice(4, 0, { value: 'insurance', label: 'Aseguradora' });
  }

  const vw = useViewportWidth();
  // --- FIN DE LÓGICA INTACTA ---

  return (
    <ToolbarContainer>
      {/* 1. DatePicker: Elemento principal */}
      <DatePickerWrapper>
        <DatePicker
          mode="range"
          value={datePickerValue}
          onChange={handleDateRangeChange}
          placeholder={['Desde', 'Hasta']}
          allowClear
          size="middle"
          style={{ width: '100%' }}
        />
      </DatePickerWrapper>

      {/* 2. Selector Cliente/Aseguradora (Condicional) */}
      {isPharmacy && (
        <Select
          defaultValue="normal"
          style={{ width: 130 }}
          onChange={handleClientTypeChange}
          options={[
            { value: 'normal', label: 'Clientes' },
            { value: 'insurance', label: 'Aseguradoras' },
          ]}
        />
      )}

      {/* 3. Selector de Estado */}
      <Select
        value={statusFilter}
        style={{ width: 130 }}
        onChange={handleStatusChange}
        options={[
          { value: 'active', label: 'Activas' },
          { value: 'inactive', label: 'Inactivas' },
          { value: 'all', label: 'Todas' },
        ]}
      />

      {/* 4. Grupo de Ordenamiento (Empujado a la derecha automáticamente) */}
      <SortControlGroup>
        <SortLabel>Ordenar:</SortLabel>
        <Select
          defaultValue="defaultCriteria"
          style={{ width: 160 }}
          onChange={handleSortChange}
          options={sortOptions}
        />
        <Button
          icon={sortDirection === 'asc' ? icons.sort.sortAsc : icons.sort.sortDesc}
          onClick={toggleSortDirection}
          disabled={sortCriteria === 'defaultCriteria'}
        />
        
        {/* Badge de Total */}
        {vw > 900 && (
          <TotalBadge>
             Total: {accounts.length}
          </TotalBadge>
        )}
      </SortControlGroup>

    </ToolbarContainer>
  );
};

FilterAccountReceivable.defaultProps = {
  onFilter: () => { },
  datesSelected: [],
  setDatesSelected: () => { },
  onReportSaleOpen: () => { },
  processedInvoices: [],
  setProcessedInvoices: () => { },
  onStatusFilterChange: () => { },
};

// --- STYLED COMPONENTS FLUIDOS ---

const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px; /* Espaciado uniforme entre todos los elementos */
  width: 100%;
  padding: 10px 16px;
  background-color: var(--white);
  border-bottom: 1px solid #e5e7eb;
  
  /* Sombra sutil para darle profundidad sobre la tabla */
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch; /* En móviles, que ocupen todo el ancho */
    gap: 10px;
  }
`;

const DatePickerWrapper = styled.div`
  /* Ancho base cómodo, pero flexible */
  width: 240px;

  @media (max-width: 600px) {
    width: 100%;
  }
`;

const SortControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  /* LA CLAVE: Esto empuja este grupo al final si hay espacio, 
     pero permite que fluya normal si falta espacio. */
  margin-left: auto;

  @media (max-width: 960px) {
    /* En pantallas medianas/pequeñas, quitamos el empuje para que siga el flujo natural */
    margin-left: 0;
    width: 100%; /* Opcional: para que ocupe una línea propia si baja */
    justify-content: flex-end; /* Alinearlo a la derecha visualmente si baja */
    padding-top: 4px;
  }
  
  @media (max-width: 600px) {
    justify-content: space-between; /* En móvil, distribuir espacio */
  }
`;

const SortLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  white-space: nowrap;
`;

const TotalBadge = styled.div`
  margin-left: 8px;
  padding: 2px 8px;
  background-color: #f3f4f6;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  white-space: nowrap;
  border: 1px solid #e5e7eb;
`;
