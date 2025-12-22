// Import DateTime
import { useEffect, useMemo, useState } from 'react';
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

  // Derivar dateRange usando useMemo en vez de useState + useEffect
  const dateRange = useMemo(() => {
    const currentFilterDateRange = filterState.filters?.createdAtDateRange;
    return {
      startDate: currentFilterDateRange?.startDate ?? null,
      endDate: currentFilterDateRange?.endDate ?? null,
    };
  }, [filterState.filters?.createdAtDateRange]);

  // Unificar dependencias en una clave para facilitar la comparación
  const subscriptionKey = useMemo(() => {
    return JSON.stringify({
      userId: user?.id,
      dateRange,
      filters: filterState.filters,
      isAscending: filterState.isAscending,
      searchTerm,
    });
  }, [user?.id, dateRange, filterState, searchTerm]);

  // Estado para la clave anterior
  const [prevSubscriptionKey, setPrevSubscriptionKey] = useState(subscriptionKey);

  // PATRÓN RECOMENDADO REACT: Ajustar estado durante render cuando cambian props/dependencias
  if (subscriptionKey !== prevSubscriptionKey) {
    setPrevSubscriptionKey(subscriptionKey);
    setLoading(true);
  }

  // Suscripción a Firebase listener
  useEffect(() => {
    const handleLoadComplete = () => {
      setLoading(false);
    };

    let unsubscribe;
    try {
      unsubscribe = fbListenCashCounts(
        user,
        setCashCounts,
        dateRange,
        filterState,
        searchTerm,
        handleLoadComplete,
      );
    } catch (error) {
      console.error('Error in date range:', error);
      // Hacemos esto asíncrono para evitar 'setState in effect' si el error es síncrono
      setTimeout(() => {
        setCashCounts([]);
        handleLoadComplete();
      }, 0);
    }

    return () => {
      // Cleanup: cancelar suscripción si existe
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, dateRange, filterState, searchTerm]);

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
