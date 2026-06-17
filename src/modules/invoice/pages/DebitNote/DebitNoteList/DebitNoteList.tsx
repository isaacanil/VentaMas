import React, { Fragment, useMemo, useState } from 'react';
import { PlusOutlined } from '@/constants/icons/antd';
import { Button, Descriptions, Modal, Tag, Typography, message } from 'antd';
import { DateTime } from 'luxon';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { AdvancedTable } from '@/components/ui/AdvancedTable';
import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectUser } from '@/features/auth/userSlice';
import { fbRefreshElectronicTaxReceiptStatus } from '@/firebase/electronicTaxReceipts/fbRefreshElectronicTaxReceiptStatus';
import { useFbGetDebitNotes } from '@/modules/invoice/firebase/debitNotes/useFbGetDebitNotes';
import { useFbGetTaxReceipt } from '@/firebase/taxReceipt/fbGetTaxReceipt';
import { useBusinessDataConfig } from '@/modules/auth/public';
import { MenuApp } from '@/modules/navigation/public';
import ROUTES_NAME from '@/router/routes/routesName';
import { selectTaxReceiptEnabled } from '@/features/taxReceipt/taxReceiptSlice';
import { resolveBusinessFiscalRollout } from '@/utils/fiscal/fiscalRollout';
import { formatPrice } from '@/utils/format';
import { AdjustmentNoteFiscalStatusTag } from '@/modules/invoice/components/AdjustmentNoteFiscalStatusTag';
import {
  resolveDebitNoteOperationalFilterStatus,
  resolveDebitNoteOperationalStatusDisplay,
  type DebitNoteOperationalFilterStatus,
} from '@/modules/invoice/utils/adjustmentNoteStatusDisplay';
import {
  resolveElectronicTaxReceiptFilterStatus,
  type ElectronicTaxReceiptFilterStatus,
} from '@/modules/invoice/utils/electronicTaxReceipt';

import { DebitNoteConfigWarningState } from './DebitNoteConfigWarningState';
import { DebitNoteCreateModal } from './DebitNoteCreateModal';
import {
  buildDefaultDebitNoteFilters,
  getDebitNoteWarningContent,
} from './debitNoteListUtils';
import { DebitNoteFilters } from './DebitNoteFilters';
import {
  Container,
  HeaderContainer,
  HeaderTitle,
  TableContainer,
} from './styles';
import { useDebitNoteColumns } from './useDebitNoteColumns';

import type {
  DebitNoteFilters as DebitNoteFiltersType,
  DebitNoteRecord,
} from '@/modules/invoice/types/debitNote';
import type { TaxReceiptDocument } from '@/types/taxReceipt';
import type { UserIdentity } from '@/types/users';

type TaxReceiptEnabledRootState = Parameters<typeof selectTaxReceiptEnabled>[0];
type UserRootState = Parameters<typeof selectUser>[0];
type BusinessRootState = Parameters<typeof selectBusinessData>[0];

type DebitNoteFiltersState = Omit<
  DebitNoteFiltersType,
  'startDate' | 'endDate' | 'status'
> & {
  startDate: DateTime;
  endDate: DateTime;
  operationalStatus?: DebitNoteOperationalFilterStatus | string | null;
  fiscalStatus?: ElectronicTaxReceiptFilterStatus | null;
};

export const DebitNoteList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDebitNote, setSelectedDebitNote] =
    useState<DebitNoteRecord | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshingDebitNoteId, setRefreshingDebitNoteId] = useState<
    string | null
  >(null);
  const [filters, setFilters] = useState<DebitNoteFiltersState>(() =>
    buildDefaultDebitNoteFilters(),
  );
  const user = useSelector<UserRootState, UserIdentity | null>(selectUser);
  const business = useSelector<
    BusinessRootState,
    Record<string, unknown> | null
  >(selectBusinessData);
  const hasBusinessFiscalContext = Boolean(business);
  const electronicModelEnabled =
    resolveBusinessFiscalRollout(business).electronicModelEnabled;

  const debitNoteQueryFilters = useMemo<DebitNoteFiltersType>(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
      clientId: filters.clientId ?? undefined,
    }),
    [filters.clientId, filters.endDate, filters.startDate],
  );

  const { debitNotes, loading: debitNotesLoading } = useFbGetDebitNotes(
    debitNoteQueryFilters,
  );
  const { taxReceipt, isLoading: taxReceiptLoading } = useFbGetTaxReceipt() as {
    taxReceipt: TaxReceiptDocument[];
    isLoading: boolean;
  };
  const taxReceiptEnabled = useSelector<
    TaxReceiptEnabledRootState,
    ReturnType<typeof selectTaxReceiptEnabled>
  >(selectTaxReceiptEnabled);

  const debitNoteReceipt = useMemo(() => {
    if (taxReceiptLoading) return null;
    return taxReceipt?.find((receipt) => {
      const name = (receipt.data?.name || '').toLowerCase();
      return (
        (name.includes('nota') && name.includes('debito')) ||
        receipt.data?.serie === '03'
      );
    });
  }, [taxReceipt, taxReceiptLoading]);

  const showConfigWarning = useMemo(
    () =>
      hasBusinessFiscalContext &&
      !debitNotesLoading &&
      !taxReceiptLoading &&
      !electronicModelEnabled &&
      (!taxReceiptEnabled ||
        (taxReceiptEnabled &&
          (!debitNoteReceipt || debitNoteReceipt.data?.disabled))),
    [
      debitNoteReceipt,
      debitNotesLoading,
      electronicModelEnabled,
      hasBusinessFiscalContext,
      taxReceiptEnabled,
      taxReceiptLoading,
    ],
  );

  const handleRefreshElectronicStatus = async (record: DebitNoteRecord) => {
    const debitNoteId = record.id;
    if (!user?.businessID || !debitNoteId) {
      message.error('No se pudo identificar la nota de debito');
      return;
    }
    if (!record.electronicTaxReceipt?.submissionId) {
      message.warning('Esta nota aun no tiene submissionId de GISYS');
      return;
    }

    setRefreshingDebitNoteId(String(debitNoteId));
    try {
      const result = await fbRefreshElectronicTaxReceiptStatus({
        businessId: user.businessID,
        debitNoteId: String(debitNoteId),
        documentKind: 'debitNote',
      });
      message.success(
        `Estado e-CF actualizado: ${
          result.electronicTaxReceipt?.status || 'consultado'
        }`,
      );
    } catch (error) {
      console.error('Error al consultar estado e-CF de nota de debito:', error);
      message.error('No se pudo consultar el estado e-CF');
    } finally {
      setRefreshingDebitNoteId(null);
    }
  };

  const visibleDebitNotes = useMemo(
    () =>
      debitNotes.filter((record) => {
        const matchesOperational =
          !filters.operationalStatus ||
          resolveDebitNoteOperationalFilterStatus(record) ===
            filters.operationalStatus;
        const matchesFiscal =
          !filters.fiscalStatus ||
          resolveElectronicTaxReceiptFilterStatus(
            record.electronicTaxReceipt,
            record.status,
          ) === filters.fiscalStatus;

        return matchesOperational && matchesFiscal;
      }),
    [debitNotes, filters.fiscalStatus, filters.operationalStatus],
  );

  const columns = useDebitNoteColumns({
    debitNotes: visibleDebitNotes,
    onView: setSelectedDebitNote,
    onRefreshElectronicStatus: handleRefreshElectronicStatus,
    refreshingDebitNoteId,
  });

  const transformedData = visibleDebitNotes.map((record) => ({
    ...record,
    actions: record,
  }));
  const selectedDebitNoteOperationalStatus = selectedDebitNote
    ? resolveDebitNoteOperationalStatusDisplay(selectedDebitNote)
    : null;

  const headerComponent = (
    <HeaderContainer>
      <HeaderTitle>Notas de Debito</HeaderTitle>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setIsCreateModalOpen(true)}
      >
        Nueva nota
      </Button>
    </HeaderContainer>
  );

  useBusinessDataConfig();

  if (showConfigWarning) {
    return (
      <DebitNoteConfigWarningState
        {...getDebitNoteWarningContent(Boolean(taxReceiptEnabled))}
        onConfigure={() =>
          navigate(ROUTES_NAME.SETTING_TERM.GENERAL_CONFIG_TAX_RECEIPT)
        }
      />
    );
  }

  return (
    <Fragment>
      <MenuApp
        searchData={searchTerm}
        setSearchData={setSearchTerm}
        data={visibleDebitNotes}
      />
      <Container>
        <TableContainer>
          <DebitNoteFilters filters={filters} onFiltersChange={setFilters} />
          <AdvancedTable
            data={transformedData}
            columns={columns}
            loading={debitNotesLoading || taxReceiptLoading}
            searchTerm={searchTerm}
            headerComponent={headerComponent}
            tableName="debitNotes"
            elementName="nota de debito"
            onRowClick={setSelectedDebitNote}
            numberOfElementsPerPage={15}
            emptyText="No hay notas de debito para mostrar"
          />
        </TableContainer>
      </Container>
      <Modal
        title="Detalle de nota de debito"
        open={Boolean(selectedDebitNote)}
        onCancel={() => setSelectedDebitNote(null)}
        footer={null}
      >
        {selectedDebitNote && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Numero">
              {selectedDebitNote.ncf || selectedDebitNote.number || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Cliente">
              {selectedDebitNote.client?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="NCF afectado">
              {selectedDebitNote.invoiceNcf || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Monto">
              {formatPrice(selectedDebitNote.totalAmount || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Estado">
              <Tag
                color={selectedDebitNoteOperationalStatus?.color || 'default'}
              >
                {selectedDebitNoteOperationalStatus?.label || 'Emitida'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="e-CF/DGII">
              <AdjustmentNoteFiscalStatusTag
                snapshot={selectedDebitNote.electronicTaxReceipt}
                fallbackStatus={selectedDebitNote.status}
                diagnosticDisplay="below"
              />
            </Descriptions.Item>
            <Descriptions.Item label="Motivo">
              <Typography.Text>
                {selectedDebitNote.reason || '-'}
              </Typography.Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
      <DebitNoteCreateModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </Fragment>
  );
};
