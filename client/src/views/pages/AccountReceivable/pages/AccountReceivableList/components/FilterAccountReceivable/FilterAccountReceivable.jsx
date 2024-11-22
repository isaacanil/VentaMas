import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Button, Select, Form } from 'antd';
import useViewportWidth from '../../../../../../../hooks/windows/useViewportWidth';
import { DatePicker } from '../../../../../../templates/system/Dates/DatePicker/DatePicker';
import { DateRangeFilter } from '../../../../../../templates/system/Button/TimeFilterButton/DateRangeFilter';
import { icons } from '../../../../../../../constants/icons/icons';
import { sortAccounts } from '../../../../../../../utils/sorts/sortAccountsReceivable';

const FilterContainer = styled.div`
  height: 3em;
  display: grid;
  padding: 0 1em;
  align-items: center;
  background: white;
  border-radius: 8px;
`;

export const FilterAccountReceivable = ({
  datesSelected = [],
  setDatesSelected = () => {},
  accounts = [],
  onSort = () => {},
}) => {
  const [sortCriteria, setSortCriteria] = useState('defaultCriteria');
  const [sortDirection, setSortDirection] = useState('asc');

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

  const handleTimeChange = (dates) => {
    setDatesSelected(dates);
  };

  const sortOptions = [
    { value: 'defaultCriteria', label: 'Por defecto' },
    { value: 'date', label: 'Fecha' },
    { value: 'invoiceNumber', label: 'Número de Factura' },
    { value: 'client', label: 'Cliente' },
    { value: 'balance', label: 'Balance' },
    { value: 'initialAmount', label: 'Monto Inicial' },
  ];

  const vw = useViewportWidth();

  return (
    <Container>
      <Row>
        <DatePicker inputMovilWidth setDates={setDatesSelected} dates={datesSelected} />
        <DateRangeFilter setDates={handleTimeChange} dates={datesSelected} />
      </Row>
      <Buttons>
        <OrderOptions>
          <Form.Item label="Ordenar: " style={{ marginBottom: 0 }}>
            <Select
              defaultValue="defaultCriteria"
              style={{ width: 180 }}
              onChange={handleSortChange}
              options={sortOptions}
            />
          </Form.Item>
          <Button
            icon={sortDirection === 'asc' ? icons.sort.sortAsc : icons.sort.sortDesc}
            onClick={toggleSortDirection}
            disabled={sortCriteria === 'defaultCriteria'}
          />
        </OrderOptions>
        {vw < 900 && (
          <MoreInfo>
            <Label>Total de Cuentas</Label>
            <Label>#{processedAccounts.length}</Label>
          </MoreInfo>
        )}
      </Buttons>
    </Container>
  );
};

FilterAccountReceivable.defaultProps = {
  onFilter: () => {},
  datesSelected: [],
  setDatesSelected: () => {},
  onReportSaleOpen: () => {},
  processedInvoices: [],
  setProcessedInvoices: () => {},
};

const Container = styled.div`
  width: 100%;
  display: flex;
  background-color: var(--White);
  align-items: end;
  border-bottom: 1px solid var(--Gray);
  padding: 0.4em 1em;
  margin: 0 auto;
  gap: 1em;

  select {
    padding: 0.1em 0.2em;
  }

  @media (max-width: 900px) {
    gap: 0.8em;
    display: grid;
  }
`;

const Buttons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1em;

  @media (max-width: 900px) {
    gap: 0.2em;
    order: 1;
    justify-content: space-between;
  }
`;

const Label = styled.div`
  font-size: 1em;
  font-weight: 550;
  min-height: 2em;
  display: flex;
  align-items: center;
  white-space: nowrap;

  @media (max-width: 800px) {
    font-size: 1em;
  }
`;

const Row = styled.div`
  display: grid;
  gap: 1em;
  align-items: end;
  grid-template-columns: min-content min-content min-content;

  @media (max-width: 800px) {
    row-gap: 0;
    column-gap: 1em;
  }
`;

const OrderOptions = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;

  @media (max-width: 800px) {
    gap: 0.2em;
  }
`;

const MoreInfo = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
`;
