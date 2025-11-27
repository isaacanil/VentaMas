import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { setARDetailsModal } from '../../../../../features/accountsReceivable/accountsReceivableSlice';
import { selectUser } from '../../../../../features/auth/userSlice';
import { useListenAccountsReceivable } from '../../../../../firebase/accountsReceivable/accountReceivableServices';
import { getDateRange } from '../../../../../utils/date/getDateRange';
import { sortAccounts } from '../../../../../utils/sorts/sortAccountsReceivable';
import { MenuApp } from '../../../../templates/MenuApp/MenuApp';

import { AccountReceivableTable } from './components/AccountReceivableTable/AccountReceivableTable';
import { FilterAccountReceivable } from './components/FilterAccountReceivable/FilterAccountReceivable';

const Container = styled.div`
  display: grid;
  grid-template-rows: min-content min-content 1fr;
  height: 100%;
`;

const mapDataToAccounts = (data) => {
  if (!Array.isArray(data)) return [];

  return data.map((account) => {
    const invoiceData = account?.invoice?.data;
    const client = account?.client || {};
    const paymentMethods = invoiceData?.paymentMethod || [];

    // Calcular total pagado
    const totalPaid = paymentMethods.reduce((sum, method) => {
      return method.status ? sum + method.value : sum;
    }, 0);

    // Determinar si es una aseguradora basado en account.account.type
    const isInsurance = account?.account?.type === 'insurance';

    return {
      id: account.id,
      ncf: invoiceData?.NCF || 'N/A',
      invoiceNumber: invoiceData?.numberID || 'N/A',
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
      initialAmount: account?.initialAmountAr || 0,
      lastPaymentDate: account?.lastPaymentDate,
      totalPaid: totalPaid,
      balance: account?.balance || 0,
      products: invoiceData?.products?.length || 0,
      total: invoiceData?.totalPurchase?.value || 0,
      ver: { account },
      actions: { account },
      type: account?.account?.type || 'normal', // Añadir explícitamente el tipo
      dateGroup: account?.createdAt?.seconds
        ? DateTime.fromMillis(account.createdAt.seconds * 1000).toLocaleString(
            DateTime.DATE_FULL,
          )
        : 'N/A',
    };
  });
};

const filterAccountsByClientType = (data, type) => {
  if (!data) return [];

  if (type === 'insurance') {
    // Mostrar cuentas que son de tipo 'insurance'
    return data.filter((account) => account.type === 'insurance');
  }
  // Para clientes normales, excluir las aseguradoras
  return data.filter((account) => account.type !== 'insurance');
};

export const AccountReceivableList = () => {
  const user = useSelector(selectUser);
  const [datesSelected, setDatesSelected] = useState(getDateRange('today'));
  const [processedAccount, setProcessedAccount] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState('defaultCriteria');
  const [sortDirection, setSortDirection] = useState('asc');
  const [clientType, setClientType] = useState('normal'); // 'normal' o 'insurance'
  const [statusFilter, setStatusFilter] = useState('active');
  const dispatch = useDispatch();

  const { accountsReceivable, loading } = useListenAccountsReceivable(
    user,
    datesSelected,
    statusFilter,
  );

  useEffect(() => {
    const data = mapDataToAccounts(accountsReceivable);

    // Filtrar por tipo de cliente
    const filteredByClientType = filterAccountsByClientType(data, clientType);

    const sortedData = sortAccounts(
      filteredByClientType,
      sortCriteria,
      sortDirection,
    );
    setProcessedAccount(sortedData);
  }, [accountsReceivable, sortCriteria, sortDirection, clientType]);

  // Calculate total balance
  const totalBalance = processedAccount.reduce((sum, account) => {
    return sum + (account.balance || 0);
  }, 0);

  const handleClientTypeChange = (type) => {
    setClientType(type);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
  };

  const handleSortChange = (criteria) => {
    setSortCriteria(criteria);
  };

  const handleToggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleRowClick = (row) => {
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
