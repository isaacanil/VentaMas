import React, { Fragment, useMemo, useState } from 'react';
import { message } from 'antd';
import { DateTime } from 'luxon';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { selectUser } from '@/features/auth/userSlice';
import { selectBusinessData } from '@/features/auth/businessSlice';
import { useBusinessDataConfig } from '@/features/auth/useBusinessDataConfig';
import { openCreditNoteModal } from '@/features/creditNote/creditNoteModalSlice';
import { selectTaxReceiptEnabled } from '@/features/taxReceipt/taxReceiptSlice';
import { useFbGetCreditNotes } from '@/firebase/creditNotes/useFbGetCreditNotes';
import { fbRefreshElectronicTaxReceiptStatus } from '@/firebase/electronicTaxReceipts/fbRefreshElectronicTaxReceiptStatus';
import { useFbGetTaxReceipt } from '@/firebase/taxReceipt/fbGetTaxReceipt';
import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';
import { MenuApp } from '@/modules/navigation/public';
import ROUTES_NAME from '@/router/routes/routesName';
import { resolveBusinessFiscalRollout } from '@/utils/fiscal/fiscalRollout';
import { resolveCreditNoteUsageFilterStatus } from '@/modules/invoice/utils/adjustmentNoteStatusDisplay';
import {
  resolveElectronicTaxReceiptFilterStatus,
  type ElectronicTaxReceiptFilterStatus,
} from '@/modules/invoice/utils/electronicTaxReceipt';

import { CreditNoteConfigWarningState } from './CreditNoteConfigWarningState';
import { CreditNoteFilters } from './components/CreditNoteFilters';
import {
  buildDefaultCreditNoteFilters,
  getCreditNoteWarningContent,
} from './creditNoteListUtils';
import { HeaderContainer, HeaderTitle, Container, TableContainer } from './styles';
import { useCreditNoteColumns } from './useCreditNoteColumns';

import type {
  CreditNoteFilters as CreditNoteFiltersType,
  CreditNoteRecord,
} from '@/types/creditNote';
import type { TaxReceiptDocument } from '@/types/taxReceipt';
import type { UserIdentity } from '@/types/users';

type TaxReceiptEnabledRootState = Parameters<typeof selectTaxReceiptEnabled>[0];
type UserRootState = Parameters<typeof selectUser>[0];
type BusinessRootState = Parameters<typeof selectBusinessData>[0];

type CreditNoteFiltersState = Omit<
  CreditNoteFiltersType,
  'startDate' | 'endDate' | 'status'
> & {
  startDate: DateTime;
  endDate: DateTime;
  usageStatus?: ReturnType<typeof resolveCreditNoteUsageFilterStatus> | null;
  fiscalStatus?: ElectronicTaxReceiptFilterStatus | null;
};

export const CreditNoteList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshingCreditNoteId, setRefreshingCreditNoteId] = useState<
    string | null
  >(null);
  const [filters, setFilters] = useState<CreditNoteFiltersState>(
    () => buildDefaultCreditNoteFilters(),
  );
  const user = useSelector<UserRootState, UserIdentity | null>(selectUser);
  const business = useSelector<BusinessRootState, Record<string, unknown> | null>(
    selectBusinessData,
  );
  const hasBusinessFiscalContext = Boolean(business);
  const electronicModelEnabled =
    resolveBusinessFiscalRollout(business).electronicModelEnabled;

  const creditNoteQueryFilters = useMemo<CreditNoteFiltersType>(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
      clientId: filters.clientId ?? undefined,
    }),
    [filters.clientId, filters.endDate, filters.startDate],
  );

  const { creditNotes, loading: creditNotesLoading } = useFbGetCreditNotes(
    creditNoteQueryFilters,
  );
  const { taxReceipt, isLoading: taxReceiptLoading } = useFbGetTaxReceipt() as {
    taxReceipt: TaxReceiptDocument[];
    isLoading: boolean;
  };
  const taxReceiptEnabled = useSelector<
    TaxReceiptEnabledRootState,
    ReturnType<typeof selectTaxReceiptEnabled>
  >(selectTaxReceiptEnabled);

  const isOverallLoading = creditNotesLoading || taxReceiptLoading;

  const creditNoteReceipt = useMemo(() => {
    if (taxReceiptLoading) return null;
    return taxReceipt?.find((receipt) => {
      const name = (receipt.data?.name || '').toLowerCase();
      return (
        (name.includes('nota') && name.includes('credito')) ||
        receipt.data?.serie === '04'
      );
    });
  }, [taxReceipt, taxReceiptLoading]);

  const isCreditNoteReceiptConfigured =
    !!creditNoteReceipt && !creditNoteReceipt.data?.disabled;

  const showConfigWarning = useMemo(
    () =>
      hasBusinessFiscalContext &&
      !creditNotesLoading &&
      !taxReceiptLoading &&
      !electronicModelEnabled &&
      (!taxReceiptEnabled ||
        (taxReceiptEnabled && !isCreditNoteReceiptConfigured)),
    [
      creditNotesLoading,
      electronicModelEnabled,
      hasBusinessFiscalContext,
      isCreditNoteReceiptConfigured,
      taxReceiptEnabled,
      taxReceiptLoading,
    ],
  );

  const handleGoToTaxReceiptConfig = () => {
    navigate(ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_TAX_RECEIPT);
  };

  const handleView = (record: CreditNoteRecord) => {
    dispatch(
      openCreditNoteModal({
        mode: 'view',
        creditNoteData: record,
      }),
    );
  };

  const handleEdit = (record: CreditNoteRecord) => {
    dispatch(
      openCreditNoteModal({
        mode: 'edit',
        creditNoteData: record,
      }),
    );
  };

  const handleRefreshElectronicStatus = async (record: CreditNoteRecord) => {
    const creditNoteId = record.id;
    if (!user?.businessID || !creditNoteId) {
      message.error('No se pudo identificar la nota de credito');
      return;
    }
    if (!record.electronicTaxReceipt?.submissionId) {
      message.warning('Esta nota aun no tiene submissionId de GISYS');
      return;
    }

    setRefreshingCreditNoteId(String(creditNoteId));
    try {
      const result = await fbRefreshElectronicTaxReceiptStatus({
        businessId: user.businessID,
        creditNoteId: String(creditNoteId),
        documentKind: 'creditNote',
      });
      message.success(
        `Estado e-CF actualizado: ${
          result.electronicTaxReceipt?.status || 'consultado'
        }`,
      );
    } catch (error) {
      console.error('Error al consultar estado e-CF de nota de credito:', error);
      message.error('No se pudo consultar el estado e-CF');
    } finally {
      setRefreshingCreditNoteId(null);
    }
  };

  const visibleCreditNotes = useMemo(
    () =>
      creditNotes.filter((record) => {
        const matchesUsage =
          !filters.usageStatus ||
          resolveCreditNoteUsageFilterStatus(record) === filters.usageStatus;
        const matchesFiscal =
          !filters.fiscalStatus ||
          resolveElectronicTaxReceiptFilterStatus(
            record.electronicTaxReceipt,
            record.status,
          ) === filters.fiscalStatus;

        return matchesUsage && matchesFiscal;
      }),
    [creditNotes, filters.fiscalStatus, filters.usageStatus],
  );

  const columns = useCreditNoteColumns({
    creditNotes: visibleCreditNotes,
    onView: handleView,
    onEdit: handleEdit,
    onRefreshElectronicStatus: handleRefreshElectronicStatus,
    refreshingCreditNoteId,
  });

  const transformedData = visibleCreditNotes.map((record) => ({
    ...record,
    actions: record,
  }));

  const headerComponent = (
    <HeaderContainer>
      <HeaderTitle>Notas de Credito</HeaderTitle>
    </HeaderContainer>
  );

  useBusinessDataConfig();

  if (showConfigWarning) {
    return (
      <CreditNoteConfigWarningState
        {...getCreditNoteWarningContent(taxReceiptEnabled)}
        onConfigure={handleGoToTaxReceiptConfig}
      />
    );
  }

  return (
    <Fragment>
      <MenuApp
        searchData={searchTerm}
        setSearchData={setSearchTerm}
        data={visibleCreditNotes}
      />
      <Container>
        <TableContainer>
          <CreditNoteFilters filters={filters} onFiltersChange={setFilters} />
          <AdvancedTable
            data={transformedData}
            columns={columns}
            loading={isOverallLoading}
            searchTerm={searchTerm}
            headerComponent={headerComponent}
            tableName="creditNotes"
            elementName="nota de credito"
            onRowClick={handleView}
            numberOfElementsPerPage={15}
            emptyText="No hay notas de credito para mostrar"
          />
        </TableContainer>
      </Container>
    </Fragment>
  );
};
