// @ts-nocheck
import { message, Grid, Skeleton, Tabs } from 'antd';
import { DateTime } from 'luxon';
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';


import { selectUser } from '@/features/auth/userSlice';
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
import { useCreditNotePDF } from '@/hooks/creditNote/useCreditNotePDF';
import { useFbGetCreditNoteApplications } from '@/hooks/creditNote/useFbGetCreditNoteApplications';
import { formatPrice } from '@/utils/format';
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


const { useBreakpoint } = Grid;

export const CreditNoteModal = () => {
  const dispatch = useDispatch();
  const { isOpen, selectedInvoice, selectedClient, mode, creditNoteData } =
    useSelector(selectCreditNoteModal);
  const user = useSelector(selectUser);
  const { clients: fetchedClients, loading: clientsLoading } =
    useFbGetClientsOnOpen({ isOpen });
  const { pdfLoading, handlePrintPdf } = useCreditNotePDF();
  const { taxReceipt } = useFbGetTaxReceipt();
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);

  const clients = fetchedClients.map((c) => c.client);

  const [loading, setLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(
    selectedClient?.id || null,
  );
  const [dateRange, setDateRange] = useState([
    DateTime.now().startOf('month'),
    DateTime.now().endOf('month'),
  ]);
  const { invoices, loading: invoicesLoading } = useFbGetInvoicesByClient(
    selectedClientId,
    dateRange,
  );

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(
    selectedInvoice?.id || null,
  );
  const { creditNotes: invoiceCreditNotes } =
    useFbGetCreditNotesByInvoice(selectedInvoiceId);

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
  const canUseCreditNotes = taxReceiptEnabled && isCreditNoteReceiptConfigured;

  const otherCreditNotes = useMemo(
    () => invoiceCreditNotes.filter((cn) => cn.id !== creditNoteData?.id),
    [invoiceCreditNotes, creditNoteData],
  );

  const creditedQuantities = useMemo(() => {
    const map = {};
    otherCreditNotes.forEach((cn) => {
      (cn.items || []).forEach((it) => {
        const qty = it.amountToBuy || 1;
        map[it.id] = (map[it.id] || 0) + qty;
      });
    });
    return map;
  }, [otherCreditNotes]);

  const existingItemQuantities = useMemo(() => {
    const map = {};
    (creditNoteData?.items || []).forEach((it) => {
      map[it.id] = it.amountToBuy || 1;
    });
    return map;
  }, [creditNoteData]);

  const currentInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  const availableInvoiceItems = useMemo(() => {
    if (!currentInvoice || !Array.isArray(currentInvoice.products)) return [];

    return (
      currentInvoice.products
        .map((item) => {
          const totalQty = item.amountToBuy || 1; // Cantidad original en la factura
          const creditedByOthers = creditedQuantities[item.id] || 0; // Ya acreditado por otras NC (excluye esta)

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
            (mode === 'edit' && (existingItemQuantities[item.id] || 0) > 0),
        )
    );
  }, [currentInvoice, creditedQuantities, existingItemQuantities, mode]);

  const currentClient = clients.find(
    (client) => client.id === selectedClientId,
  );
  const relatedCreditNotes = invoiceCreditNotes.filter(
    (cn) => cn.invoiceId === selectedInvoiceId && cn.id !== creditNoteData?.id,
  );

  const pageSize = 5;

  const ALLOWED_EDIT_MS = 2 * 24 * 60 * 60 * 1000; // 2 días
  const createdAtDate = useMemo(() => {
    if (!creditNoteData?.createdAt) return null;
    return creditNoteData.createdAt.seconds
      ? new Date(creditNoteData.createdAt.seconds * 1000)
      : new Date(creditNoteData.createdAt);
  }, [creditNoteData?.createdAt]);
  const hasApplications = creditNoteApplications?.length > 0; // Usar las aplicaciones de la nueva colección
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
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

  const memoizedFormatPrice = useMemo(() => formatPrice, []);

  useEffect(() => {
    if (!isOpen) return;
    if (mode !== 'create' && creditNoteData) {
      setSelectedClientId(creditNoteData.client?.id || null);
      setSelectedInvoiceId(creditNoteData.invoiceId || null);
    } else {
      setSelectedClientId(selectedClient?.id || null);
      setSelectedInvoiceId(selectedInvoice?.id || null);
    }
  }, [isOpen, mode, creditNoteData, selectedClient, selectedInvoice]);

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
    selectedInvoiceId,
    availableInvoiceItems,
    existingItemQuantities,
    clientsLoading,
    invoicesLoading,
  });

  const handleClose = () => {
    dispatch(closeCreditNoteModal());
    resetSelection();
    setSelectedClientId(null);
    setSelectedInvoiceId(null);
  };

  const handleClientChange = (client) => {
    setSelectedClientId(client?.id || null);
    resetSelection();
    setSelectedInvoiceId(null);
  };

  const handleInvoiceChange = (invoice) => {
    setSelectedInvoiceId(invoice?.id || null);
    resetSelection();
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const selectedProducts = availableInvoiceItems
        .filter((item) => selectedItems.includes(item.id))
        .map((item) => ({
          ...item,
          amountToBuy: itemQuantities[item.id] || 1,
        }));

      // Validación final: verificar que ninguna cantidad exceda lo disponible
      const invalidItems = selectedProducts.filter((item) => {
        const availableItem = availableInvoiceItems.find(
          (ai) => ai.id === item.id,
        );
        return (
          availableItem && item.amountToBuy > availableItem.maxAvailableQty
        );
      });

      if (invalidItems.length > 0) {
        const itemNames = invalidItems.map((item) => item.name).join(', ');
        message.error(`Las siguientes cantidades exceden lo disponible: ${itemNames}`);
        setLoading(false);
        return;
      }

      const payload = {
        client: currentClient,
        invoiceId: selectedInvoiceId,
        invoiceNcf: currentInvoice?.ncf || currentInvoice?.NCF,
        items: selectedProducts,
        totalAmount,
      };

      let savedCreditNote;
      if (effectiveIsEdit) {
        await fbUpdateCreditNote(user, creditNoteData.id, payload);
        message.success('Nota de crédito actualizada exitosamente');
        savedCreditNote = { ...creditNoteData, ...payload };
      } else {
        savedCreditNote = await fbAddCreditNote(user, payload);
        message.success('Nota de crédito creada exitosamente');

        // Imprimir automáticamente después de crear
        setTimeout(() => {
          handlePrintPdf(savedCreditNote);
        }, 500); // Pequeño delay para asegurar que el mensaje se muestre
      }

      handleClose();
    } catch (error) {
      console.error('Error al procesar la nota de crédito:', error);
      message.error('Ocurrió un error al guardar la nota de crédito');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = selectedItems.reduce((sum, id) => {
    const item = availableInvoiceItems.find((it) => it.id === id);
    if (!item) return sum;
    const qty = itemQuantities[id] || 1;
    const itemCopy = { ...item, amountToBuy: qty };
    return sum + getTotalPrice(itemCopy, taxReceiptEnabled);
  }, 0);

  // Calcular ITBIS total correctamente
  const totalItbis = selectedItems.reduce((sum, id) => {
    const item = availableInvoiceItems.find((it) => it.id === id);
    if (!item) return sum;
    const qty = itemQuantities[id] || 1;
    const itemCopy = { ...item, amountToBuy: qty };
    return sum + getTax(itemCopy, taxReceiptEnabled);
  }, 0);

  // Calcular subtotal (total sin impuestos)
  const subtotal = totalAmount - totalItbis;


  const handleNavigateNote = (note, e) => {
    if (e) e.stopPropagation();
    if (!note) return;
    dispatch(openCreditNoteModal({ mode: 'view', creditNoteData: note }));
  };

  const handleQuantityChange = (itemId, value) => {
    if (!value || value < 1) return;

    // Verificar que no exceda la cantidad máxima disponible
    const item = availableInvoiceItems.find((it) => it.id === itemId);
    if (item && value > item.maxAvailableQty) {
      const originalQty = item.amountToBuy || 1;
      const creditedByOthers = creditedQuantities[itemId] || 0;

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

    setItemQuantities((prev) => ({ ...prev, [itemId]: value }));
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
          selectedClientId={selectedClientId}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
        />

        {canUseCreditNotes && (
          <Tabs
            defaultActiveKey="productos"
            type="card"
            size={isMobile ? 'small' : 'middle'}
          >
            {/* TAB: Productos */}
            <Tabs.TabPane tab="Productos" key="productos">
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
                selectedInvoiceId={selectedInvoiceId}
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
            </Tabs.TabPane>

            {/* TAB: Historial de Aplicaciones */}
            {(effectiveIsView || effectiveIsEdit) &&
              creditNoteApplications?.length > 0 && (
                <Tabs.TabPane
                  tab={`Historial (${creditNoteApplications?.length || 0})`}
                  key="historial"
                >
                  <ApplicationHistoryTab
                    creditNoteApplications={creditNoteApplications}
                    applicationsLoading={applicationsLoading}
                    formatPrice={memoizedFormatPrice}
                    creditNoteData={creditNoteData}
                  />
                </Tabs.TabPane>
              )}

            {/* TAB: Notas Relacionadas */}
            <Tabs.TabPane
              tab={`Notas Relacionadas (${relatedCreditNotes.length})`}
              key="relacionadas"
            >
              <RelatedNotesTab
                relatedCreditNotes={relatedCreditNotes}
                onNavigateNote={handleNavigateNote}
                isMobile={isMobile}
              />
            </Tabs.TabPane>
          </Tabs>
        )}

        <CreditNoteActions
          onClose={handleClose}
          effectiveIsView={effectiveIsView}
          effectiveIsEdit={effectiveIsEdit}
          canUseCreditNotes={canUseCreditNotes}
          onPrint={handlePrintPdf}
          pdfLoading={pdfLoading}
          creditNoteData={creditNoteData}
          onSubmit={handleSubmit}
          selectedInvoiceId={selectedInvoiceId}
          selectedItems={selectedItems}
          loading={loading}
          isTimeAllowed={isTimeAllowed}
          hasApplications={hasApplications}
          createdAtDate={createdAtDate}
          allowedEditMs={ALLOWED_EDIT_MS}
        />
      </Container>
    </ResponsiveContainer>
  );
};

export default CreditNoteModal;
