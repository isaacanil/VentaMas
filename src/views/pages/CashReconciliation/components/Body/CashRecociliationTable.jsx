// Import DateTime
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '../../../../../features/auth/userSlice';
import { setCashCount } from '../../../../../features/cashCount/cashCountManagementSlice';
import { fbListenCashCounts } from '../../../../../firebase/cashCount/fbGetCashCounts/fbGetCashCounts';
import { useBusinessUsers } from '../../../../../firebase/users/useBusinessUsers';
import { FilterBar } from '../../../../component/FilterBar/FilterBar';
import { AdvancedTable } from '../../../../templates/system/AdvancedTable/AdvancedTable';

import { tableConfig } from './tableConfig';

export const CashReconciliationTable = () => {
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [searchTerm] = useState('');
  const [cashCounts, setCashCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { users: usersList } = useBusinessUsers();
  const filterConfig = {
    defaultValues: {
      status: 'open', // Cambiado de 'active' a null, para que no haya filtro inicial
      user: null,
      createdAtDateRange: null,
    },
    defaultSort: {
      isAscending: false,
    },
    filters: [
      {
        key: 'status',
        type: 'select',
        placeholder: 'Estado',
        clearText: 'Limpiar estado',
      },
      {
        key: 'user',
        type: 'select',
        placeholder: 'Usuario',
        clearText: 'Limpiar usuario',
        showSearch: true,
        icon: null,
      },
    ],
    showSortButton: true,
    showResetButton: true,
  };

  const [filterState, setFilterState] = useState({
    filters: filterConfig.defaultValues,
    isAscending: filterConfig.defaultSort.isAscending,
  });

  const handleClick = (cashCount) => {
    let cashCountToUpdate = {
      ...cashCount,
      opening: {
        ...cashCount.opening,
        date: JSON.stringify(cashCount.opening.date),
      },
    };
    dispatch(setCashCount(cashCountToUpdate));
    navigate(`/cash-register-closure/${cashCountToUpdate?.id}`);
  };

  useEffect(() => {
    setLoading(true);
    const currentFilterDateRange = filterState.filters?.createdAtDateRange;
    const newStartDate = currentFilterDateRange?.startDate ?? null; // Expecting Milliseconds
    const newEndDate = currentFilterDateRange?.endDate ?? null; // Expecting Milliseconds

    if (
      newStartDate !== dateRange.startDate ||
      newEndDate !== dateRange.endDate
    ) {
      setDateRange({ startDate: newStartDate, endDate: newEndDate });
    }

    try {
      fbListenCashCounts(
        user,
        setCashCounts,
        dateRange,
        filterState,
        searchTerm,
        () => setLoading(false),
      );
    } catch (error) {
      console.error('Error in date range:', error);
      setCashCounts([]);
      setLoading(false);
    }
  }, [user, dateRange, filterState, searchTerm]); // dateRange is still a dependency

  const data = cashCounts.map((cashCount) => {
    return {
      incrementNumber: cashCount?.incrementNumber,
      status: cashCount?.state,
      date: cashCount?.updatedAt ? cashCount?.updatedAt : null,
      user: cashCount?.opening.employee.name,
      total: cashCount,
      discrepancy: cashCount,
      action: cashCount,
    };
  });

  const columns = tableConfig();

  const dataConfig = {
    user: {
      data: usersList,
      accessor: ({ user }) => ({
        label: user.realName?.trim() ? user.realName : user.name,
        value: user.id,
      }),
    },
    status: {
      data: [
        { label: 'Abierto', value: 'open' },
        { label: 'Cerrando Cuadre', value: 'closing' },
        { label: 'Cerrado', value: 'closed' },
      ],
      accessor: (item) => ({
        label: item.label,
        value: item.value,
      }),
    },
  };

  return (
    <Container>
      <FilterBar
        config={filterConfig}
        dataConfig={dataConfig}
        onChange={(newFilterStateFromBar) => {
          setFilterState(newFilterStateFromBar);
        }}
      />
      <AdvancedTable
        columns={columns}
        data={data}
        elementName={'cuadre de caja'}
        tableName={'cash_reconciliation_table'}
        onRowClick={(row) => handleClick(row.action)}
        loading={loading}
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;
