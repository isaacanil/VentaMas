// Import DateTime
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { selectUser } from '@/features/auth/userSlice';
import { setCashCount } from '@/features/cashCount/cashCountManagementSlice';
import { fbListenCashCounts } from '@/firebase/cashCount/fbGetCashCounts/fbGetCashCounts';
import { useBusinessUsers } from '@/firebase/users/useBusinessUsers';
import { AdvancedTable } from '@/views/templates/system/AdvancedTable/AdvancedTable';
import type { UserIdentity } from '@/types/users';
import type { CashCountRecord, CashCountState } from '@/utils/cashCount/types';
import { FilterCashReconciliation } from '../FilterBar/FilterCashReconciliation';
import { tableConfig } from './tableConfig';

interface DateRangeFilter {
  startDate: number | null;
  endDate: number | null;
}

interface FilterState {
  filters: {
    status: CashCountState | 'active';
    user: string | null;
    createdAtDateRange: DateRangeFilter | null;
  };
  isAscending: boolean;
}

interface BusinessUserListItem {
  user?: UserIdentity;
  uid?: string;
  id?: string;
}

export const CashReconciliationTable = () => {
  const [searchTerm] = useState('');
  const [cashCounts, setCashCounts] = useState<CashCountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector(selectUser) as UserIdentity | null;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { users: usersList } = useBusinessUsers() as {
    users: BusinessUserListItem[];
  };

  const userOptions = useMemo(() => {
    return (usersList || []).map((item) => {
      const userData = item.user || {};
      return {
        label: userData.realName?.trim()
          ? userData.realName
          : userData.name || 'Sin nombre',
        value: userData.id || userData.uid || item.uid || item.id || '',
      };
    });
  }, [usersList]);

  const [filterState, setFilterState] = useState<FilterState>({
    filters: {
      status: 'active',
      user: null,
      createdAtDateRange: null,
    },
    isAscending: false,
  });

  const handleClick = (cashCount: CashCountRecord) => {
    const cashCountToUpdate = {
      ...cashCount,
      opening: {
        ...cashCount.opening,
        date: JSON.stringify(cashCount.opening?.date ?? null),
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

  // Unificar dependencias en una clave para facilitar la comparaci?n
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

  // Ajustar estado durante render cuando cambian props/dependencias
  if (subscriptionKey !== prevSubscriptionKey) {
    setPrevSubscriptionKey(subscriptionKey);
    setLoading(true);
  }

  // Suscripci?n a Firebase listener
  useEffect(() => {
    const handleLoadComplete = () => {
      setLoading(false);
    };

    let unsubscribe: (() => void) | undefined;
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
      setTimeout(() => {
        setCashCounts([]);
        handleLoadComplete();
      }, 0);
    }

    return () => {
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
      user: cashCount?.opening?.employee &&
        typeof cashCount.opening.employee === 'object'
        ? (cashCount.opening.employee as UserIdentity).name
        : null,
      total: cashCount,
      discrepancy: cashCount,
      action: cashCount,
    };
  });

  const columns = tableConfig();

  return (
    <Container>
      <FilterCashReconciliation
        filters={filterState.filters}
        onFiltersChange={(newFilters) =>
          setFilterState((prev) => ({ ...prev, filters: newFilters }))
        }
        sortAscending={filterState.isAscending}
        onSortChange={(isAscending) =>
          setFilterState((prev) => ({ ...prev, isAscending }))
        }
        userOptions={userOptions}
      />
      <AdvancedTable
        columns={columns}
        data={data}
        elementName={'cuadre de caja'}
        tableName={'cash_reconciliation_table'}
        onRowClick={(row) => handleClick(row.action as CashCountRecord)}
        loading={loading}
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;
