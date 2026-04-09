import React, { Fragment, useMemo, useState } from 'react';
import { DateTime } from 'luxon';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useBusinessDataConfig } from '@/features/auth/useBusinessDataConfig';
import { openCreditNoteModal } from '@/features/creditNote/creditNoteModalSlice';
import { selectTaxReceiptEnabled } from '@/features/taxReceipt/taxReceiptSlice';
import { useFbGetCreditNotes } from '@/firebase/creditNotes/useFbGetCreditNotes';
import { useFbGetTaxReceipt } from '@/firebase/taxReceipt/fbGetTaxReceipt';
import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import ROUTES_NAME from '@/router/routes/routesName';

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

type TaxReceiptEnabledRootState = Parameters<typeof selectTaxReceiptEnabled>[0];

type CreditNoteFiltersState = Omit<
  CreditNoteFiltersType,
  'startDate' | 'endDate'
> & {
  startDate: DateTime;
  endDate: DateTime;
};

export const CreditNoteList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CreditNoteFiltersState>(
    () => buildDefaultCreditNoteFilters(),
  );

  const { creditNotes, loading: creditNotesLoading } = useFbGetCreditNotes(
    filters as CreditNoteFiltersType,
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
      !creditNotesLoading &&
      !taxReceiptLoading &&
      (!taxReceiptEnabled ||
        (taxReceiptEnabled && !isCreditNoteReceiptConfigured)),
    [
      creditNotesLoading,
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

  const columns = useCreditNoteColumns({
    creditNotes,
    onView: handleView,
    onEdit: handleEdit,
  });

  const transformedData = creditNotes.map((record) => ({
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
        data={creditNotes}
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
