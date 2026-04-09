import { DateTime } from 'luxon';
import { useEffect, useMemo, useReducer } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

import { setARDetailsModal } from '@/features/accountsReceivable/accountsReceivableSlice';
import { selectUser } from '@/features/auth/userSlice';
import { useListenAccountsReceivable } from '@/firebase/accountsReceivable/accountReceivableServices';
import { useOpenAccountReceivableSummary } from '@/modules/accountsReceivable/hooks/useOpenAccountReceivableSummary';
import { ACCOUNT_RECEIVABLE_DETAIL_QUERY_PARAM } from '@/modules/accountsReceivable/utils/accountReceivableNavigation';
import { sortAccounts } from '@/utils/sorts/sortAccountsReceivable';
import { isPreorderDocument } from '@/utils/invoice/documentIdentity';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import { PageBody } from '@/components/layout/PageShell';

import { AccountReceivableTable } from './components/AccountReceivableTable/AccountReceivableTable';
import { FilterAccountReceivable } from './components/FilterAccountReceivable/FilterAccountReceivable';

import type { UserIdentity } from '@/types/users';
import type {
  AccountReceivableRow,
  AccountsReceivableClientType,
  AccountsReceivableDateRange,
  AccountsReceivablePaymentStatus,
  AccountsReceivableRecord,
  AccountsReceivableSortCriteria,
  AccountsReceivableStatusFilter,
  SortDirection,
  TimestampLike,
} from '@/utils/accountsReceivable/types';

const Container = styled(PageBody)`
  display: grid;
  grid-template-rows: min-content 1fr;
`;

const getDateGroup = (value?: TimestampLike): string => {
  if (!value) return 'N/A';
  if (value instanceof Date) {
    return DateTime.fromJSDate(value).toLocaleString(DateTime.DATE_FULL);
  }
  if (typeof value === 'number') {
    return DateTime.fromMillis(value).toLocaleString(DateTime.DATE_FULL);
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed)
      ? 'N/A'
      : DateTime.fromMillis(parsed).toLocaleString(DateTime.DATE_FULL);
  }
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      return DateTime.fromJSDate(value.toDate()).toLocaleString(
        DateTime.DATE_FULL,
      );
    }
    if (typeof value.toMillis === 'function') {
      return DateTime.fromMillis(value.toMillis()).toLocaleString(
        DateTime.DATE_FULL,
      );
    }
    if (typeof value.seconds === 'number') {
      return DateTime.fromMillis(value.seconds * 1000).toLocaleString(
        DateTime.DATE_FULL,
      );
    }
  }
  return 'N/A';
};

const resolveMonetaryValue = (
  value: number | { value?: number } | null | undefined,
): number => {
  if (typeof value === 'number') return value;
  return Number(value?.value ?? 0);
};

const mapDataToAccounts = (
  data: AccountsReceivableRecord[] | null | undefined,
): AccountReceivableRow[] => {
  if (!data || !Array.isArray(data)) {
    console.warn('mapDataToAccounts received invalid data:', data);
    return [];
  }

  return data.map((account) => {
    const invoiceData = account?.invoice?.data;
    const client = account?.client || {};

    // Calcular total pagado desde CxC (source of truth):
    // initialAmountAr (totalReceivable) - balance (arBalance).
    const initialAmount = Number(account?.initialAmountAr ?? 0) || 0;
    const balance = Number(account?.balance ?? 0) || 0;
    const totalPaid = Math.max(0, initialAmount - balance);

    // Determinar si es una aseguradora basado en account.account.type
    const isInsurance = account?.account?.type === 'insurance';

    // Determinar si la CxC proviene de una preventa y si sigue siendo preventa
    const originIsPreorder =
      account?.account?.originType === 'preorder' ||
      Boolean(account?.account?.preorderId);

    // Usar isPreorderDocument para saber si el doc SIGUE siendo preventa
    // (si fue convertida a factura, status = 'completed' y/o tiene NCF)
    const stillPreorder = originIsPreorder
      ? isPreorderDocument(invoiceData as Parameters<typeof isPreorderDocument>[0])
      : false;

    // Número de preventa original (si aplica)
    const preorderNumberRaw =
      invoiceData?.preorderDetails?.numberID ??
      invoiceData?.preorderDetails?.number ??
      null;

    const invoiceNumberRaw =
      invoiceData?.numberID ?? invoiceData?.number ?? null;

    // Si sigue siendo preventa → mostrar número de preventa
    // Si fue convertida a factura → mostrar número de factura (numberID actualizado)
    const documentNumber = stillPreorder
      ? (preorderNumberRaw ?? account?.account?.numberId ?? invoiceNumberRaw)
      : invoiceNumberRaw;

    const invoiceNumber =
      documentNumber !== undefined && documentNumber !== null
        ? String(documentNumber)
        : 'N/A';

    // Guardar el número de preventa original para referencia en el modal
    const preorderNumber =
      originIsPreorder && preorderNumberRaw != null
        ? String(preorderNumberRaw)
        : undefined;

    return {
      id: account.id,
      ncf: invoiceData?.NCF || 'N/A',
      invoiceNumber,
      documentType: stillPreorder ? ('preorder' as const) : ('invoice' as const),
      documentNumber: invoiceNumber,
      preorderNumber,
      client: client?.name || 'Generic Client',
      rnc: client?.personalID,
      // Incluir la información de la aseguradora si existe
      insurance:
        invoiceData?.insurance?.name ||
        account?.account?.insurance?.name ||
        'N/A',
      hasInsurance: !!(
        invoiceData?.insurance?.name || account?.account?.insurance?.name
      ),
      isInsurance: isInsurance, // Flag basado en account.account.type
      date: account?.createdAt,
      initialAmount: initialAmount,
      lastPaymentDate: account?.lastPaymentDate,
      totalPaid: totalPaid,
      balance: balance,
      products: invoiceData?.products?.length || 0,
      total: resolveMonetaryValue(invoiceData?.totalPurchase),
      ver: { account },
      actions: { account },
      type: account?.account?.type || 'normal', // Añadir explícitamente el tipo
      dateGroup: getDateGroup(account?.createdAt),
    };
  });
};

const filterAccountsByClientType = (
  data: AccountReceivableRow[],
  type: AccountsReceivableClientType,
) => {
  if (!data || !Array.isArray(data)) return [];

  if (type === 'insurance') {
    // Mostrar cuentas que son de tipo 'insurance'
    return data.filter((account) => account.type === 'insurance');
  }
  // Para clientes normales, excluir las aseguradoras
  return data.filter((account) => account.type !== 'insurance');
};

interface AccountReceivableListState {
  datesSelected: AccountsReceivableDateRange;
  searchTerm: string;
  sortCriteria: AccountsReceivableSortCriteria;
  sortDirection: SortDirection;
  clientType: AccountsReceivableClientType;
  statusFilter: AccountsReceivableStatusFilter;
  selectedClient: string;
  paymentStatusFilter: AccountsReceivablePaymentStatus;
}

type AccountReceivableListAction =
  | { type: 'setDatesSelected'; value: AccountsReceivableDateRange }
  | { type: 'setSearchTerm'; value: string }
  | { type: 'setSortCriteria'; value: AccountsReceivableSortCriteria }
  | { type: 'toggleSortDirection' }
  | { type: 'setClientType'; value: AccountsReceivableClientType }
  | { type: 'setStatusFilter'; value: AccountsReceivableStatusFilter }
  | { type: 'setSelectedClient'; value: string }
  | { type: 'setPaymentStatusFilter'; value: AccountsReceivablePaymentStatus };

const initialAccountReceivableListState: AccountReceivableListState = {
  datesSelected: { startDate: null, endDate: null },
  searchTerm: '',
  sortCriteria: 'defaultCriteria',
  sortDirection: 'asc',
  clientType: 'normal',
  statusFilter: 'active',
  selectedClient: 'all',
  paymentStatusFilter: 'pending',
};

const accountReceivableListReducer = (
  state: AccountReceivableListState,
  action: AccountReceivableListAction,
): AccountReceivableListState => {
  switch (action.type) {
    case 'setDatesSelected':
      return { ...state, datesSelected: action.value };
    case 'setSearchTerm':
      return { ...state, searchTerm: action.value };
    case 'setSortCriteria':
      return { ...state, sortCriteria: action.value };
    case 'toggleSortDirection':
      return {
        ...state,
        sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc',
      };
    case 'setClientType':
      return { ...state, clientType: action.value };
    case 'setStatusFilter':
      return { ...state, statusFilter: action.value };
    case 'setSelectedClient':
      return { ...state, selectedClient: action.value };
    case 'setPaymentStatusFilter':
      return { ...state, paymentStatusFilter: action.value };
    default:
      return state;
  }
};

export const AccountReceivableList = () => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const [searchParams] = useSearchParams();
  const [state, dispatchState] = useReducer(
    accountReceivableListReducer,
    initialAccountReceivableListState,
  );
  const {
    datesSelected,
    searchTerm,
    sortCriteria,
    sortDirection,
    clientType,
    statusFilter,
    selectedClient,
    paymentStatusFilter,
  } = state;
  const dispatch = useDispatch();
  const openAccountReceivableSummary = useOpenAccountReceivableSummary();
  const arIdFromQuery = searchParams.get(ACCOUNT_RECEIVABLE_DETAIL_QUERY_PARAM);

  const { accountsReceivable, loading } = useListenAccountsReceivable(
    user,
    datesSelected,
    statusFilter,
  );

  const clientOptions = useMemo(() => {
    const data = mapDataToAccounts(accountsReceivable);
    const clients = new Set<string>();
    data.forEach((account) => {
      if (account.client && account.client !== 'Generic Client') {
        clients.add(account.client);
      }
    });

    return Array.from(clients)
      .sort()
      .map((client) => ({ value: client, label: client }));
  }, [accountsReceivable]);

  const processedAccount = useMemo<AccountReceivableRow[]>(() => {
    let data = mapDataToAccounts(accountsReceivable);

    // Filtrar por tipo de cliente
    data = filterAccountsByClientType(data, clientType);

    if (selectedClient !== 'all') {
      data = data.filter((account) => account.client === selectedClient);
    }

    if (paymentStatusFilter !== 'all') {
      data = data.filter((account) => {
        const balance = account.balance || 0;
        const totalPaid = account.totalPaid || 0;

        // Tolerancia pequeña para errores de punto flotante
        const isPaid = balance <= 0.01;
        const hasAnyPayment = totalPaid > 0.01;
        const isUnpaid = !isPaid && !hasAnyPayment;
        const isPartial = !isPaid && hasAnyPayment;

        if (paymentStatusFilter === 'pending') return !isPaid;
        if (paymentStatusFilter === 'paid') return isPaid;
        if (paymentStatusFilter === 'unpaid') return isUnpaid;
        if (paymentStatusFilter === 'partial') return isPartial;
        return true;
      });
    }

    const sortedData = sortAccounts(data, sortCriteria, sortDirection);
    return sortedData;
  }, [
    accountsReceivable,
    sortCriteria,
    sortDirection,
    clientType,
    selectedClient,
    paymentStatusFilter,
  ]);

  // Calculate total balance
  const totalBalance = processedAccount.reduce(
    (sum, account) => sum + (account.balance || 0),
    0,
  );

  const handleClientTypeChange = (type: AccountsReceivableClientType) => {
    dispatchState({ type: 'setClientType', value: type });
  };

  const handleClientChange = (client: string) => {
    dispatchState({ type: 'setSelectedClient', value: client });
  };

  const handlePaymentStatusChange = (
    status: AccountsReceivablePaymentStatus,
  ) => {
    dispatchState({ type: 'setPaymentStatusFilter', value: status });
  };

  const handleStatusFilterChange = (status: AccountsReceivableStatusFilter) => {
    dispatchState({ type: 'setStatusFilter', value: status });
  };

  const handleSortChange = (criteria: AccountsReceivableSortCriteria) => {
    dispatchState({ type: 'setSortCriteria', value: criteria });
  };

  const handleToggleSortDirection = () => {
    dispatchState({ type: 'toggleSortDirection' });
  };

  const handleRowClick = (row: AccountReceivableRow) => {
    if (row?.id) {
      openAccountReceivableSummary(row.id);
    }
  };

  useEffect(() => {
    if (!arIdFromQuery) return;

    dispatch(setARDetailsModal({ isOpen: true, arId: arIdFromQuery }));
  }, [arIdFromQuery, dispatch]);

  return (
    <Container>
      <MenuApp
        data={processedAccount}
        searchData={searchTerm}
        setSearchData={(value) =>
          dispatchState({ type: 'setSearchTerm', value })
        }
      />
      <FilterAccountReceivable
        datesSelected={datesSelected}
        setDatesSelected={(value) =>
          dispatchState({ type: 'setDatesSelected', value })
        }
        clientType={clientType}
        onClientTypeChange={handleClientTypeChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        sortCriteria={sortCriteria}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onToggleSortDirection={handleToggleSortDirection}
        totalCount={processedAccount.length}
        selectedClient={selectedClient}
        onClientChange={handleClientChange}
        clientOptions={clientOptions}
        paymentStatusFilter={paymentStatusFilter}
        onPaymentStatusChange={handlePaymentStatusChange}
      />
      <AccountReceivableTable
        data={processedAccount}
        searchTerm={searchTerm}
        totalBalance={totalBalance}
        showInsuranceColumn={clientType === 'insurance'} // Mostrar columna solo cuando se selecciona aseguradora
        onRowClick={handleRowClick}
        loading={loading}
      />
    </Container>
  );
};
