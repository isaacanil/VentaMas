import { DateTime } from 'luxon';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { setARDetailsModal } from '@/features/accountsReceivable/accountsReceivableSlice';
import { selectUser } from '@/features/auth/userSlice';
import { useListenAccountsReceivable } from '@/firebase/accountsReceivable/accountReceivableServices';
import { getDateRange } from '@/utils/date/getDateRange';
import { sortAccounts } from '@/utils/sorts/sortAccountsReceivable';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

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

const Container = styled.div`
  display: grid;
  grid-template-rows: min-content min-content 1fr;
  height: 100%;
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
      return DateTime.fromJSDate(value.toDate()).toLocaleString(DateTime.DATE_FULL);
    }
    if (typeof value.toMillis === 'function') {
      return DateTime.fromMillis(value.toMillis()).toLocaleString(DateTime.DATE_FULL);
    }
    if (typeof value.seconds === 'number') {
      return DateTime.fromMillis(value.seconds * 1000).toLocaleString(
        DateTime.DATE_FULL,
      );
    }
  }
  return 'N/A';
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
    const paymentMethods = invoiceData?.paymentMethod || [];

    // Calcular total pagado
    const totalPaid = paymentMethods.reduce((sum, method) => {
      const amount = Number(method?.value ?? 0);
      return method?.status ? sum + amount : sum;
    }, 0);

    // Determinar si es una aseguradora basado en account.account.type
    const isInsurance = account?.account?.type === 'insurance';

    return {
      id: account.id,
      ncf: invoiceData?.NCF || 'N/A',
      invoiceNumber:
        invoiceData?.numberID !== undefined && invoiceData?.numberID !== null
          ? String(invoiceData.numberID)
          : 'N/A',
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
      initialAmount: Number(account?.initialAmountAr ?? 0),
      lastPaymentDate: account?.lastPaymentDate,
      totalPaid: totalPaid,
      balance: Number(account?.balance ?? 0),
      products: invoiceData?.products?.length || 0,
      total: Number(invoiceData?.totalPurchase?.value ?? 0),
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

export const AccountReceivableList = () => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const [datesSelected, setDatesSelected] = useState<AccountsReceivableDateRange>(
    getDateRange('today'),
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] =
    useState<AccountsReceivableSortCriteria>('defaultCriteria');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [clientType, setClientType] =
    useState<AccountsReceivableClientType>('normal'); // 'normal' o 'insurance'
  const [statusFilter, setStatusFilter] =
    useState<AccountsReceivableStatusFilter>('active');
  const [selectedClient, setSelectedClient] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<AccountsReceivablePaymentStatus>('all');
  const dispatch = useDispatch();

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
        const isUnpaid = totalPaid <= 0.01; // Asumiendo que si no ha pagado nada es unpaid

        if (paymentStatusFilter === 'paid') return isPaid;
        if (paymentStatusFilter === 'unpaid') return isUnpaid;
        if (paymentStatusFilter === 'partial') return !isPaid && !isUnpaid;
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
    setClientType(type);
  };

  const handleClientChange = (client: string) => {
    setSelectedClient(client);
  };

  const handlePaymentStatusChange = (status: AccountsReceivablePaymentStatus) => {
    setPaymentStatusFilter(status);
  };

  const handleStatusFilterChange = (status: AccountsReceivableStatusFilter) => {
    setStatusFilter(status);
  };

  const handleSortChange = (criteria: AccountsReceivableSortCriteria) => {
    setSortCriteria(criteria);
  };

  const handleToggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleRowClick = (row: AccountReceivableRow) => {
    if (row?.id) {
      dispatch(setARDetailsModal({ isOpen: true, arId: row.id }));
    }
  };

  return (
    <Container>
      <MenuApp
        data={processedAccount}
        searchData={searchTerm}
        setSearchData={setSearchTerm}
      />
      <FilterAccountReceivable
        datesSelected={datesSelected}
        setDatesSelected={setDatesSelected}
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

