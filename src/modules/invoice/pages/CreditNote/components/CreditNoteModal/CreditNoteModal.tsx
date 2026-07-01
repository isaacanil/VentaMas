import { message, Grid, Skeleton, Tabs } from 'antd';
import { DateTime } from 'luxon';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { selectBusinessData } from '@/features/auth/businessSlice';
import { selectCartTaxationEnabled } from '@/features/cart/cartSlice';
import {
  closeCreditNoteModal,
  selectCreditNoteModal,
  openCreditNoteModal,
} from '@/features/creditNote/creditNoteModalSlice';
import { selectTaxReceiptEnabled } from '@/features/taxReceipt/taxReceiptSlice';
import { useFbGetClientsOnOpen } from '@/firebase/client/useFbGetClientsOnOpen';
import { fbAddCreditNote } from '@/firebase/creditNotes/fbAddCreditNote';
import { fbUpdateCreditNote } from '@/firebase/creditNotes/fbUpdateCreditNote';
import { useFbGetCreditNotesByInvoice } from '@/firebase/creditNotes/useFbGetCreditNotesByInvoice';
import { useFbGetInvoicesByClient } from '@/firebase/invoices/useFbGetInvoicesByClient';
import { useFbGetTaxReceipt } from '@/firebase/taxReceipt/fbGetTaxReceipt';
import { FiscalDocumentPaginatedPrintHost } from '@/modules/invoice/components/FiscalDocumentPagination/FiscalDocumentPaginatedPrintHost';
import { useFbGetCreditNoteApplications } from '@/modules/invoice/hooks/creditNote/useFbGetCreditNoteApplications';
import { creditNoteToInvoicePrintData } from '@/modules/invoice/utils/adjustmentNotePrintData';
import { formatPrice } from '@/utils/format';
import { resolveBusinessFiscalRollout } from '@/utils/fiscal/fiscalRollout';
import { getTotalPrice, getTax } from '@/utils/pricing';

import { ApplicationHistoryTab } from './components/ApplicationHistoryTab';
import { CreditNoteActions } from './components/CreditNoteActions';
import { Container, TitleRow } from './components/CreditNoteModalLayout';
import { CreditNoteSetupSection } from './components/CreditNoteSetupSection';
import { ProductsTab } from './components/ProductsTab';
import { RelatedNotesTab } from './components/RelatedNotesTab';
import { ResponsiveContainer } from './components/ResponsiveContainer';
import { useCreditNoteColumns } from './hooks/useCreditNoteColumns';
import { useCreditNoteSelection } from './hooks/useCreditNoteSelection';
import { getCreditNoteLineKey } from './hooks/useCreditNoteSelection.helpers';
import {
  CREDIT_NOTE_TEXT_CORRECTION_AMOUNT_MESSAGE,
  isCreditNoteTextCorrectionWithAmount,
} from './utils/modificationCode';
import {
  applyCreditNoteLineQuantity,
  resolveCreditNoteLineQuantity,
} from './utils/quantity';

import type { CreditNoteRecord } from '@/types/creditNote';
import type {
  InvoiceBusinessInfo,
  InvoiceClient,
  InvoiceData,
  InvoiceProduct,
} from '@/types/invoice';
import type { TaxReceiptDocument } from '@/types/taxReceipt';
import type { UserIdentity } from '@/types/users';
import type { DatePickerRangeValue } from '@/components/common/DatePicker';
import type { TimestampLike } from '@/utils/date/types';

const { useBreakpoint } = Grid;

type CreditNoteModalState = ReturnType<typeof selectCreditNoteModal>;
type CreditNoteModalRootState = Parameters<typeof selectCreditNoteModal>[0];
type UserRootState = Parameters<typeof selectUser>[0];
type BusinessRootState = Parameters<typeof selectBusinessData>[0];
type TaxReceiptRootState = Parameters<typeof selectTaxReceiptEnabled>[0];
type CartTaxationRootState = Parameters<typeof selectCartTaxationEnabled>[0];

type CreditNoteModalTypedState = Omit<
  CreditNoteModalState,
  'selectedInvoice' | 'selectedClient' | 'creditNoteData'
> & {
  selectedInvoice: InvoiceWithNcf | null;
  selectedClient: InvoiceClient | null;
  creditNoteData: CreditNoteRecord | null;
};

type ClientWrapper = {
  client: InvoiceClient & { id?: string | number };
} & Record<string, unknown>;

type InvoiceWithNcf = InvoiceData & {
  ncf?: string;
};

type InvoiceItemWithAvailability = InvoiceProduct & {
  maxAvailableQty: number;
};

type QuantityByItem = Record<string, number>;

interface CreditNoteModalLocalState {
  loading: boolean;
  selectedClientId: string | null | undefined;
  dateRange: DatePickerRangeValue;
  selectedInvoiceId: string | null | undefined;
  reason: string | undefined;
  modificationCode: string | undefined;
  now: number;
}

type CreditNoteModalLocalStateUpdate =
  | Partial<CreditNoteModalLocalState>
  | ((state: CreditNoteModalLocalState) => Partial<CreditNoteModalLocalState>);

const initialCreditNoteModalLocalState: CreditNoteModalLocalState = {
  loading: false,
  selectedClientId: undefined,
  dateRange: [DateTime.now().startOf('month'), DateTime.now().endOf('month')],
  selectedInvoiceId: undefined,
  reason: undefined,
  modificationCode: undefined,
  now: Date.now(),
};

const creditNoteModalLocalStateReducer = (
  state: CreditNoteModalLocalState,
  update: CreditNoteModalLocalStateUpdate,
): CreditNoteModalLocalState => ({
  ...state,
  ...(typeof update === 'function' ? update(state) : update),
});

const resolveDate = (value: TimestampLike | null | undefined): Date | null => {
  if (!value) return null;
  if (
    typeof value === 'object' &&
    'seconds' in value &&
    typeof value.seconds === 'number'
  ) {
    return new Date(value.seconds * 1000);
  }
  if (value instanceof Date) return value;
  if (typeof value === 'number' || typeof value === 'string') {
    return new Date(value);
  }
  if (typeof value === 'object' && typeof value.toMillis === 'function') {
    return new Date(value.toMillis());
  }
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate();
  }
  return null;
};

const resolveInvoiceTotalAmount = (
  invoice: InvoiceWithNcf | null | undefined,
): number | undefined => {
  const total = Number(
    invoice?.totalPurchase?.value ??
      invoice?.total ??
      invoice?.payment?.value ??
      0,
  );
  return Number.isFinite(total) && total > 0 ? total : undefined;
};

export const CreditNoteModal = () => {
  const dispatch = useDispatch();
  const { isOpen, selectedInvoice, selectedClient, mode, creditNoteData } =
    useSelector<CreditNoteModalRootState, CreditNoteModalState>(
      selectCreditNoteModal,
    ) as CreditNoteModalTypedState;
  const user = useSelector<UserRootState, UserIdentity | null>(selectUser);
  const business = useSelector<
    BusinessRootState,
    Record<string, unknown> | null
  >(selectBusinessData);
  const electronicModelEnabled =
    resolveBusinessFiscalRollout(business).electronicModelEnabled;
  const { clients: fetchedClients, loading: clientsLoading } =
    useFbGetClientsOnOpen({ isOpen }) as {
      clients: ClientWrapper[];
      loading: boolean;
    };
  const { taxReceipt } = useFbGetTaxReceipt() as {
    taxReceipt: TaxReceiptDocument[];
  };
  const taxReceiptEnabled = useSelector<TaxReceiptRootState, boolean>(
    selectTaxReceiptEnabled,
  );
  const taxationEnabled = useSelector<CartTaxationRootState, boolean>(
    selectCartTaxationEnabled,
  );

  const clients = fetchedClients.map((c) => c.client);

  const [localState, setLocalState] = useReducer(
    creditNoteModalLocalStateReducer,
    initialCreditNoteModalLocalState,
  );
  const {
    loading,
    selectedClientId,
    dateRange,
    selectedInvoiceId,
    reason,
    modificationCode,
    now,
  } = localState;
  const initialSelectedClientId =
    mode !== 'create'
      ? creditNoteData?.client?.id || null
      : selectedClient?.id || null;
  const effectiveSelectedClientId =
    selectedClientId === undefined ? initialSelectedClientId : selectedClientId;
  const normalizedClientId =
    effectiveSelectedClientId !== null &&
    effectiveSelectedClientId !== undefined
      ? String(effectiveSelectedClientId)
      : null;
  const { invoices, loading: invoicesLoading } = useFbGetInvoicesByClient(
    normalizedClientId,
    dateRange,
  ) as { invoices: InvoiceWithNcf[]; loading: boolean };
  const initialSelectedInvoiceId =
    mode !== 'create'
      ? creditNoteData?.invoiceId || null
      : selectedInvoice?.id || null;
  const effectiveSelectedInvoiceId =
    selectedInvoiceId === undefined
      ? initialSelectedInvoiceId
      : selectedInvoiceId;
  const { creditNotes: invoiceCreditNotes } = useFbGetCreditNotesByInvoice(
    effectiveSelectedInvoiceId,
  );
  const initialReason = mode !== 'create' ? creditNoteData?.reason || '' : '';
  const creditNoteReason = reason === undefined ? initialReason : reason;
  const initialModificationCode =
    mode !== 'create' ? creditNoteData?.modificationCode || '3' : '3';
  const creditNoteModificationCode =
    modificationCode === undefined ? initialModificationCode : modificationCode;

  // Obtener aplicaciones de la nota de crédito actual
  const { applications: creditNoteApplications, loading: applicationsLoading } =
    useFbGetCreditNoteApplications({
      creditNoteId: creditNoteData?.id,
    });

  const creditNoteReceipt = taxReceipt?.find(
    (receipt) =>
      (receipt.data?.name?.toLowerCase().includes('nota') &&
        receipt.data?.name?.toLowerCase().includes('crédito')) ||
      receipt.data?.serie === '04',
  );

  const isCreditNoteReceiptConfigured = Boolean(
    creditNoteReceipt && !creditNoteReceipt.data?.disabled,
  );

  // Verificar si se pueden crear/editar notas de crédito
  const canUseCreditNotes =
    electronicModelEnabled ||
    (taxReceiptEnabled && isCreditNoteReceiptConfigured);

  const otherCreditNotes = useMemo(
    () => invoiceCreditNotes.filter((cn) => cn.id !== creditNoteData?.id),
    [invoiceCreditNotes, creditNoteData],
  );

  const creditedQuantities = useMemo(() => {
    const map: QuantityByItem = {};
    otherCreditNotes.forEach((cn) => {
      (cn.items || []).forEach((it) => {
        const itemId = String(getCreditNoteLineKey(it));
        const qty = resolveCreditNoteLineQuantity(it);
        map[itemId] = (map[itemId] || 0) + qty;
      });
    });
    return map;
  }, [otherCreditNotes]);

  const existingItemQuantities = useMemo(() => {
    const map: QuantityByItem = {};
    (creditNoteData?.items || []).forEach((it) => {
      const itemId = String(getCreditNoteLineKey(it));
      map[itemId] = resolveCreditNoteLineQuantity(it);
    });
    return map;
  }, [creditNoteData]);

  const currentInvoice = invoices.find(
    (inv) => inv.id === effectiveSelectedInvoiceId,
  );

  const availableInvoiceItems = useMemo<InvoiceItemWithAvailability[]>(() => {
    if (!currentInvoice || !Array.isArray(currentInvoice.products)) return [];

    return (
      currentInvoice.products
        .map((item) => {
          const itemId = String(getCreditNoteLineKey(item));
          const totalQty = resolveCreditNoteLineQuantity(item); // Cantidad original en la factura
          const creditedByOthers = creditedQuantities[itemId] || 0; // Ya acreditado por otras NC (excluye esta)

          // La máxima cantidad que se puede acreditar para este item.
          // Es simplemente lo que queda en la factura después de restar otras NC.
          const maxAvailableQty = totalQty - creditedByOthers;

          return { ...item, maxAvailableQty };
        })
        // Un producto se muestra si todavía se puede acreditar (maxAvailableQty > 0)
        // o si está en la nota de crédito actual que se está editando.
        .filter(
          (item) =>
            item.maxAvailableQty > 0 ||
            (mode === 'edit' &&
              (existingItemQuantities[String(getCreditNoteLineKey(item))] ||
                0) > 0),
        )
    );
  }, [currentInvoice, creditedQuantities, existingItemQuantities, mode]);

  const currentClient = clients.find(
    (client) => client.id === effectiveSelectedClientId,
  );
  const relatedCreditNotes = invoiceCreditNotes.filter(
    (cn) =>
      cn.invoiceId === effectiveSelectedInvoiceId &&
      cn.id !== creditNoteData?.id,
  );

  const pageSize = 5;

  const ALLOWED_EDIT_MS = 2 * 24 * 60 * 60 * 1000; // 2 días
  const createdAtDate = useMemo(
    () => resolveDate(creditNoteData?.createdAt),
    [creditNoteData?.createdAt],
  );
  const hasApplications = creditNoteApplications?.length > 0; // Usar las aplicaciones de la nueva colección
  useEffect(() => {
    const timer = setInterval(() => setLocalState({ now: Date.now() }), 60000);
    return () => clearInterval(timer);
  }, []);

  const isTimeAllowed = useMemo(() => {
    if (mode !== 'edit' || !createdAtDate) return mode === 'edit';
    return now - createdAtDate.getTime() <= ALLOWED_EDIT_MS;
  }, [mode, createdAtDate, now, ALLOWED_EDIT_MS]);
  const isEditAllowed = isTimeAllowed && !hasApplications; // No se puede editar si ya se aplicó
  const effectiveIsView =
    mode === 'view' || (mode === 'edit' && !isEditAllowed);
  const effectiveIsEdit = mode === 'edit' && isEditAllowed;

  const hasAvailableProducts = availableInvoiceItems.length > 0;

  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [creditNotePrintTarget, setCreditNotePrintTarget] =
    useState<CreditNoteRecord | null>(null);
  const [creditNotePrintLoading, setCreditNotePrintLoading] = useState(false);
  const creditNotePrintData = useMemo(
    () =>
      creditNotePrintTarget
        ? creditNoteToInvoicePrintData(creditNotePrintTarget)
        : null,
    [creditNotePrintTarget],
  );
  const handleCreditNotePrinted = useCallback(() => {
    setCreditNotePrintLoading(false);
    setCreditNotePrintTarget(null);
  }, []);

  const handleCreditNotePrintBlocked = useCallback((reason: string) => {
    console.warn('[CreditNoteModal] paginated print blocked', reason);
    message.error(
      `No se pudo imprimir la nota de crédito. Diagnóstico: ${reason}`,
    );
    setCreditNotePrintLoading(false);
    setCreditNotePrintTarget(null);
  }, []);

  const memoizedFormatPrice = useMemo(() => formatPrice, []);

  const {
    selectedItems,
    itemQuantities,
    selectAll,
    searchText,
    filteredProducts,
    currentPage,
    setCurrentPage,
    handleSearchTextChange,
    handleSelectAll,
    handleItemChange,
    resetSelection,
    setItemQuantities,
  } = useCreditNoteSelection({
    isOpen,
    mode,
    creditNoteData,
    selectedInvoiceId: effectiveSelectedInvoiceId,
    availableInvoiceItems,
    existingItemQuantities,
    clientsLoading,
    invoicesLoading,
  });

  const handleClose = () => {
    dispatch(closeCreditNoteModal());
    resetSelection();
    setLocalState({
      selectedClientId: undefined,
      selectedInvoiceId: undefined,
      reason: undefined,
      modificationCode: undefined,
    });
  };

  const handlePrintCreditNote = (note: CreditNoteRecord | null | undefined) => {
    if (!note) {
      message.error('No hay datos de la nota de crédito.');
      return;
    }

    setCreditNotePrintLoading(true);
    setCreditNotePrintTarget(note);
  };

  const handleClientChange = (client: InvoiceClient | null) => {
    setLocalState({
      selectedClientId: client?.id != null ? String(client.id) : null,
    });
    resetSelection();
    setLocalState({ selectedInvoiceId: null });
  };

  const handleInvoiceChange = (invoice: InvoiceWithNcf | null) => {
    setLocalState({ selectedInvoiceId: invoice?.id || null });
    resetSelection();
  };

  const handleDateRangeChange = (range: DatePickerRangeValue) => {
    setLocalState({ dateRange: range });
  };

  const handleSubmit = async () => {
    setLocalState({ loading: true });
    const finishSubmit = () => {
      setLocalState({ loading: false });
    };

    const selectedProducts = availableInvoiceItems
      .filter((item) => selectedItems.includes(getCreditNoteLineKey(item)))
      .map((item) =>
        applyCreditNoteLineQuantity(
          item,
          itemQuantities[String(getCreditNoteLineKey(item))] || 1,
        ),
      );

    // Validación final: verificar que ninguna cantidad exceda lo disponible
    const invalidItems = selectedProducts.filter((item) => {
      const availableItem = availableInvoiceItems.find(
        (ai) => getCreditNoteLineKey(ai) === getCreditNoteLineKey(item),
      );
      return (
        availableItem &&
        resolveCreditNoteLineQuantity(item) > availableItem.maxAvailableQty
      );
    });

    if (invalidItems.length > 0) {
      const itemNames = invalidItems.map((item) => item.name).join(', ');
      message.error(
        `Las siguientes cantidades exceden lo disponible: ${itemNames}`,
      );
      finishSubmit();
      return;
    }
    if (
      isCreditNoteTextCorrectionWithAmount({
        modificationCode: creditNoteModificationCode,
        totalAmount,
      })
    ) {
      message.error(CREDIT_NOTE_TEXT_CORRECTION_AMOUNT_MESSAGE);
      finishSubmit();
      return;
    }
    const cleanReason = creditNoteReason.trim();
    if (!cleanReason) {
      message.error('Indica el motivo de la nota de crédito');
      finishSubmit();
      return;
    }

    const payload = {
      client: currentClient,
      invoiceId: effectiveSelectedInvoiceId,
      invoiceNcf: currentInvoice?.ncf || currentInvoice?.NCF,
      invoiceDate:
        currentInvoice?.date ??
        (currentInvoice?.createdAt as TimestampLike | undefined),
      invoiceTotalAmount: resolveInvoiceTotalAmount(currentInvoice),
      reason: cleanReason,
      modificationCode: creditNoteModificationCode,
      items: selectedProducts,
      totalAmount,
    } satisfies Partial<CreditNoteRecord>;

    const saveResult = effectiveIsEdit
      ? await fbUpdateCreditNote(user, creditNoteData?.id ?? '', payload)
          .then(() => ({
            note: { ...creditNoteData, ...payload } as CreditNoteRecord,
            error: null,
          }))
          .catch((error) => ({
            note: null,
            error,
          }))
      : await fbAddCreditNote(user, payload)
          .then((note) => ({
            note,
            error: null,
          }))
          .catch((error) => ({
            note: null,
            error,
          }));

    if (saveResult.error || !saveResult.note) {
      console.error('Error al procesar la nota de crédito:', saveResult.error);
      message.error('Ocurrió un error al guardar la nota de crédito');
      finishSubmit();
      return;
    }

    message.success(
      effectiveIsEdit
        ? 'Nota de crédito actualizada exitosamente'
        : 'Nota de crédito creada exitosamente',
    );

    if (!effectiveIsEdit) {
      setTimeout(() => {
        handlePrintCreditNote(saveResult.note);
      }, 500);
    }

    handleClose();
    finishSubmit();
  };

  const totalAmount = selectedItems.reduce((sum, id) => {
    const item = availableInvoiceItems.find(
      (it) => getCreditNoteLineKey(it) === id,
    );
    if (!item) return sum;
    const qty = itemQuantities[String(id)] || 1;
    const itemCopy = applyCreditNoteLineQuantity(item, qty);
    return sum + getTotalPrice(itemCopy, taxationEnabled);
  }, 0);

  // Calcular ITBIS total correctamente
  const totalItbis = selectedItems.reduce((sum, id) => {
    const item = availableInvoiceItems.find(
      (it) => getCreditNoteLineKey(it) === id,
    );
    if (!item) return sum;
    const qty = itemQuantities[String(id)] || 1;
    const itemCopy = applyCreditNoteLineQuantity(item, qty);
    return sum + getTax(itemCopy, taxationEnabled);
  }, 0);

  // Calcular subtotal (total sin impuestos)
  const subtotal = totalAmount - totalItbis;
  const hasTextCorrectionAmountConflict = isCreditNoteTextCorrectionWithAmount({
    modificationCode: creditNoteModificationCode,
    totalAmount,
  });

  const handleNavigateNote = (
    note: CreditNoteRecord | null | undefined,
    e?: React.MouseEvent<HTMLElement>,
  ) => {
    if (e) e.stopPropagation();
    if (!note) return;
    dispatch(openCreditNoteModal({ mode: 'view', creditNoteData: note }));
  };

  const handleQuantityChange = (
    itemId: string | undefined,
    value: number | null,
  ) => {
    if (!value || value <= 0) return;

    // Verificar que no exceda la cantidad máxima disponible
    const item = availableInvoiceItems.find(
      (it) => getCreditNoteLineKey(it) === itemId,
    );
    if (item && value > item.maxAvailableQty) {
      const originalQty = resolveCreditNoteLineQuantity(item);
      const creditedByOthers = creditedQuantities[String(itemId)] || 0;

      message.warning({
        content: (
          <div>
            <div>
              <strong>Cantidad excede el máximo disponible</strong>
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Factura original: {originalQty}
              <br /> Otras notas de crédito: {creditedByOthers}
              <br />
              <strong>Máximo permitido: {item.maxAvailableQty}</strong>
            </div>
          </div>
        ),
        duration: 4,
      });
      return;
    }

    setItemQuantities((prev) => ({ ...prev, [String(itemId)]: value }));
  };

  const columns = useCreditNoteColumns({
    isMobile,
    selectedItems,
    itemQuantities,
    existingItemQuantities,
    creditedQuantities,
    effectiveIsView,
    handleItemChange,
    handleQuantityChange,
    formatPrice: memoizedFormatPrice,
  });

  if (clientsLoading && isOpen) {
    return (
      <ResponsiveContainer
        isMobile={isMobile}
        isOpen={isOpen}
        onClose={handleClose}
        title="Cargando..."
      >
        <Container isMobile={isMobile}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Container>
      </ResponsiveContainer>
    );
  }

  return (
    <>
      <ResponsiveContainer
        isMobile={isMobile}
        isOpen={isOpen}
        onClose={handleClose}
        title={
          <TitleRow>
            {effectiveIsView
              ? 'Detalle Nota de Crédito'
              : effectiveIsEdit
                ? 'Editar Nota de Crédito'
                : 'Crear Nueva Nota de Crédito'}
          </TitleRow>
        }
      >
        <Container isMobile={isMobile}>
          <CreditNoteSetupSection
            canUseCreditNotes={canUseCreditNotes}
            taxReceiptEnabled={taxReceiptEnabled}
            effectiveIsView={effectiveIsView}
            effectiveIsEdit={effectiveIsEdit}
            creditNoteData={creditNoteData}
            mode={mode}
            clients={clients}
            currentClient={currentClient}
            onSelectClient={handleClientChange}
            clientsLoading={clientsLoading}
            invoices={invoices}
            currentInvoice={currentInvoice}
            onSelectInvoice={handleInvoiceChange}
            invoicesLoading={invoicesLoading}
            selectedClientId={effectiveSelectedClientId}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            reason={creditNoteReason}
            modificationCode={creditNoteModificationCode}
            totalAmount={totalAmount}
            onReasonChange={(value) => setLocalState({ reason: value })}
            onModificationCodeChange={(value) =>
              setLocalState({ modificationCode: value })
            }
          />

          {canUseCreditNotes && (
            <Tabs
              defaultActiveKey="productos"
              type="card"
              size={isMobile ? 'small' : 'middle'}
              items={[
                {
                  key: 'productos',
                  label: 'Productos',
                  children: (
                    <ProductsTab
                      currentInvoice={currentInvoice}
                      hasAvailableProducts={hasAvailableProducts}
                      selectAll={selectAll}
                      effectiveIsView={effectiveIsView}
                      onSelectAll={handleSelectAll}
                      searchText={searchText}
                      onSearchTextChange={handleSearchTextChange}
                      isMobile={isMobile}
                      filteredProducts={filteredProducts}
                      columns={columns}
                      selectedInvoiceId={effectiveSelectedInvoiceId}
                      selectedItems={selectedItems}
                      itemQuantities={itemQuantities}
                      existingItemQuantities={existingItemQuantities}
                      creditedQuantities={creditedQuantities}
                      currentPage={currentPage}
                      pageSize={pageSize}
                      onPageChange={(page) => setCurrentPage(page)}
                      onItemChange={handleItemChange}
                      onQuantityChange={handleQuantityChange}
                      subtotal={subtotal}
                      totalItbis={totalItbis}
                      totalAmount={totalAmount}
                      formatPrice={memoizedFormatPrice}
                    />
                  ),
                },
                ...((effectiveIsView || effectiveIsEdit) &&
                creditNoteApplications?.length > 0
                  ? [
                      {
                        key: 'historial',
                        label: `Historial (${creditNoteApplications?.length || 0})`,
                        children: (
                          <ApplicationHistoryTab
                            creditNoteApplications={creditNoteApplications}
                            applicationsLoading={applicationsLoading}
                            formatPrice={memoizedFormatPrice}
                            creditNoteData={creditNoteData}
                          />
                        ),
                      },
                    ]
                  : []),
                {
                  key: 'relacionadas',
                  label: `Notas Relacionadas (${relatedCreditNotes.length})`,
                  children: (
                    <RelatedNotesTab
                      relatedCreditNotes={relatedCreditNotes}
                      onNavigateNote={handleNavigateNote}
                      isMobile={isMobile}
                    />
                  ),
                },
              ]}
            />
          )}

          <CreditNoteActions
            onClose={handleClose}
            effectiveIsView={effectiveIsView}
            effectiveIsEdit={effectiveIsEdit}
            canUseCreditNotes={canUseCreditNotes}
            onPrint={handlePrintCreditNote}
            pdfLoading={creditNotePrintLoading}
            creditNoteData={creditNoteData}
            onSubmit={handleSubmit}
            selectedInvoiceId={effectiveSelectedInvoiceId}
            selectedItems={selectedItems}
            submitBlocked={hasTextCorrectionAmountConflict}
            loading={loading}
            isTimeAllowed={isTimeAllowed}
            hasApplications={hasApplications}
            createdAtDate={createdAtDate}
            allowedEditMs={ALLOWED_EDIT_MS}
          />
        </Container>
      </ResponsiveContainer>
      <FiscalDocumentPaginatedPrintHost
        business={business as InvoiceBusinessInfo | null}
        invoice={creditNotePrintData}
        pending={creditNotePrintLoading}
        onPrintBlocked={handleCreditNotePrintBlocked}
        onPrinted={handleCreditNotePrinted}
      />
    </>
  );
};

export default CreditNoteModal;
