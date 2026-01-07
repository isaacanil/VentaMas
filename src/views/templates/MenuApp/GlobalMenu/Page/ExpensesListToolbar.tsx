// @ts-nocheck
import React from 'react';
import { useDispatch } from 'react-redux';
import { useMatch } from 'react-router-dom';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import {
  resetExpense,
  setExpense,
} from '@/features/expense/expenseManagementSlice';
import {
  openExpenseFormModal,
  toggleExpenseChartModal,
} from '@/features/expense/expenseUISlice';
import ROUTES_NAME from '@/router/routes/routesName';
import { Button } from '@/views/templates/system/Button/Button';

export const ExpensesListToolbar = ({ side = 'left' }) => {
  const { EXPENSES_LIST } = ROUTES_NAME.EXPENSES_TERM;
  const matchWithExpenseList = useMatch(EXPENSES_LIST);
  const dispatch = useDispatch();

  // Configuramos para abrir el modal en lugar de navegar
  const handleOpenCreateExpenseModal = () => {
    // Resetear el estado del formulario para crear uno nuevo
    dispatch(resetExpense());
    // Establecer modo 'add'
    dispatch(setExpense({ mode: 'add' }));
    // Abrir el modal
    dispatch(openExpenseFormModal());
  };

  const handleOpenExpensesChart = () => {
    dispatch(toggleExpenseChartModal());
  };
  return (
    matchWithExpenseList && (
      <Container>
        {/* {
                    side === 'left' && (
                        <SearchInput
                            search
                            deleteBtn
                            icon={icons.operationModes.search}
                            placeholder='Buscar Categoría...'
                            bgColor={'white'}
                            value={searchData}
                            onClear={() => setSearchData('')}
                            onChange={(e) => setSearchData(e.target.value)}
                        />
                    )
                } */}
        {side === 'right' && (
          <Group>
            <Button title="Ver Reporte" onClick={handleOpenExpensesChart} />{' '}
            <Button
              title="Gasto"
              startIcon={icons.operationModes.add}
              onClick={handleOpenCreateExpenseModal}
            />
          </Group>
        )}
      </Container>
    )
  );
};
const Container = styled.div``;
const Group = styled.div`
  display: flex;
  gap: 0.4em;
  align-items: center;
`;
