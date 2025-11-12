import { SearchOutlined, PrinterOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Checkbox, Alert, message, Input, InputNumber, Grid, Skeleton, Tooltip, Tabs } from 'antd';
import dayjs from 'dayjs';
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../features/auth/userSlice';
import { closeCreditNoteModal, selectCreditNoteModal, openCreditNoteModal } from '../../../../features/creditNote/creditNoteModalSlice';
import { selectTaxReceiptEnabled } from '../../../../features/taxReceipt/taxReceiptSlice';
import { useFbGetClientsOnOpen } from '../../../../firebase/client/useFbGetClientsOnOpen';
import { fbAddCreditNote } from '../../../../firebase/creditNotes/fbAddCreditNote';
import { fbUpdateCreditNote } from '../../../../firebase/creditNotes/fbUpdateCreditNote';
import { useFbGetCreditNotesByInvoice } from '../../../../firebase/creditNotes/useFbGetCreditNotesByInvoice';
import { useFbGetInvoicesByClient } from '../../../../firebase/invoices/useFbGetInvoicesByClient';
import { fbGetTaxReceipt } from '../../../../firebase/taxReceipt/fbGetTaxReceipt';
import { useCreditNotePDF } from '../../../../hooks/creditNote/useCreditNotePDF';
import { useFbGetCreditNoteApplications } from '../../../../hooks/creditNote/useFbGetCreditNoteApplications';
import { formatPrice } from '../../../../utils/formatPrice';
import { getTotalPrice, getTax } from '../../../../utils/pricing';

import ClientSelector from './components/ClientSelector';
import { CreditNotePanel } from './components/CreditNotePanel';
import InvoiceSelector from './components/InvoiceSelector';
import { ProductList } from './components/ProductList';
import { ResponsiveContainer } from './components/ResponsiveContainer';

const { useBreakpoint } = Grid;

export const CreditNoteModal = () => {
  const dispatch = useDispatch();
  const { isOpen, selectedInvoice, selectedClient, mode, creditNoteData } = useSelector(selectCreditNoteModal);
  const user = useSelector(selectUser);
  const { clients: fetchedClients, loading: clientsLoading } = useFbGetClientsOnOpen({ isOpen });
  const { pdfLoading, handlePrintPdf } = useCreditNotePDF();
  const { taxReceipt } = fbGetTaxReceipt();
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);

  const clients = fetchedClients.map(c => c.client);
  
  const [selectedItems, setSelectedItems] = useState([]);
  const [itemQuantities, setItemQuantities] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(selectedClient?.id || null);
  const [dateRange, setDateRange] = useState([dayjs().startOf('month'), dayjs().endOf('month')]);
  const { invoices, loading: invoicesLoading } = useFbGetInvoicesByClient(selectedClientId, dateRange);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(selectedInvoice?.id || null);
  const { creditNotes: invoiceCreditNotes } = useFbGetCreditNotesByInvoice(selectedInvoiceId);
  
  // Obtener aplicaciones de la nota de crédito actual
  const { applications: creditNoteApplications, loading: applicationsLoading } = useFbGetCreditNoteApplications({
    creditNoteId: creditNoteData?.id
  });

  const creditNoteReceipt = taxReceipt?.find(receipt => 
    (receipt.data?.name?.toLowerCase().includes('nota') && 
    receipt.data?.name?.toLowerCase().includes('crédito')) ||
    receipt.data?.serie === '04'
  );

  const isCreditNoteReceiptConfigured = Boolean(creditNoteReceipt && !creditNoteReceipt.data?.disabled);

  // Verificar si se pueden crear/editar notas de crédito
  const canUseCreditNotes = taxReceiptEnabled && isCreditNoteReceiptConfigured;

  const otherCreditNotes = useMemo(() =>
    invoiceCreditNotes.filter(cn => cn.id !== creditNoteData?.id),
    [invoiceCreditNotes, creditNoteData]
  );

  const creditedQuantities = useMemo(() => {
    const map = {};
    otherCreditNotes.forEach(cn => {
      (cn.items || []).forEach(it => {
        const qty = it.amountToBuy || 1;
        map[it.id] = (map[it.id] || 0) + qty;
      });
    });
    return map;
  }, [otherCreditNotes]);

  const existingItemQuantities = useMemo(() => {
    const map = {};
    (creditNoteData?.items || []).forEach(it => {
      map[it.id] = it.amountToBuy || 1;
    });
    return map;
  }, [creditNoteData]);

  const currentInvoice = invoices.find(inv => inv.id === selectedInvoiceId);

  const availableInvoiceItems = useMemo(() => {
    if (!currentInvoice || !Array.isArray(currentInvoice.products)) return [];

    return currentInvoice.products
      .map(item => {
        const totalQty = item.amountToBuy || 1; // Cantidad original en la factura
        const creditedByOthers = creditedQuantities[item.id] || 0; // Ya acreditado por otras NC (excluye esta)
        
        // La máxima cantidad que se puede acreditar para este item.
        // Es simplemente lo que queda en la factura después de restar otras NC.
        const maxAvailableQty = totalQty - creditedByOthers;
        
        return { ...item, maxAvailableQty };
      })
      // Un producto se muestra si todavía se puede acreditar (maxAvailableQty > 0)
      // o si está en la nota de crédito actual que se está editando.
      .filter(item => item.maxAvailableQty > 0 || (mode === 'edit' && (existingItemQuantities[item.id] || 0) > 0));
  }, [currentInvoice, creditedQuantities, existingItemQuantities, mode]);
  
  const currentClient = clients.find(client => client.id === selectedClientId);
  const relatedCreditNotes = invoiceCreditNotes.filter(
    cn => cn.invoiceId === selectedInvoiceId && cn.id !== creditNoteData?.id
  );

  const [searchText, setSearchText] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const ALLOWED_EDIT_MS = 2 * 24 * 60 * 60 * 1000; // 2 días
  const createdAtDate = creditNoteData?.createdAt ? (creditNoteData.createdAt.seconds ? new Date(creditNoteData.createdAt.seconds * 1000) : new Date(creditNoteData.createdAt)) : null;
  const hasApplications = creditNoteApplications?.length > 0; // Usar las aplicaciones de la nueva colección
  const isTimeAllowed = mode === 'edit' && createdAtDate ? (Date.now() - createdAtDate.getTime() <= ALLOWED_EDIT_MS) : mode === 'edit';
  const isEditAllowed = isTimeAllowed && !hasApplications; // No se puede editar si ya se aplicó
  const effectiveIsView = mode === 'view' || (mode === 'edit' && !isEditAllowed);
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
      const ids = creditNoteData.items?.map(i => i.id) || [];
      setSelectedItems(ids);
      const qtyMap = {};
      (creditNoteData.items || []).forEach(it => {
        qtyMap[it.id] = it.amountToBuy || 1;
      });
      setItemQuantities(qtyMap);
      setSelectAll(false);
    } else {
      setSelectedClientId(null);
      setSelectedInvoiceId(null);
      setSelectedItems([]);
      setItemQuantities({});
      setSelectAll(false);
    }
  }, [isOpen, mode, creditNoteData]);

  useEffect(() => {
    if (!selectedInvoiceId || clientsLoading || invoicesLoading) {
      setSelectedItems([]);
      setItemQuantities({});
      setSelectAll(false);
      setFilteredProducts([]);
      return;
    }

    const initialSelection = availableInvoiceItems.map(item => item.id);
    setSelectedItems(initialSelection);
    const qtyMap = {};
    availableInvoiceItems.forEach(it => {
      qtyMap[it.id] = existingItemQuantities[it.id] || it.maxAvailableQty;
    });
    setItemQuantities(qtyMap);
    setSelectAll(initialSelection.length > 0 && initialSelection.length === availableInvoiceItems.length);
    setFilteredProducts(availableInvoiceItems);
    setSearchText('');
    setCurrentPage(1);

  }, [selectedInvoiceId, creditedQuantities, existingItemQuantities, clientsLoading, invoicesLoading]);

  useEffect(() => {
    const baseList = availableInvoiceItems;

    if (!searchText.trim()) {
      setFilteredProducts(baseList);
      return;
    }

    const searchLower = searchText.toLowerCase().trim();
    const filtered = baseList.filter(item =>
      item.name?.toLowerCase().includes(searchLower)
    );
    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchText, availableInvoiceItems]);

  const handleClose = () => {
    dispatch(closeCreditNoteModal());
    setSelectedItems([]);
    setItemQuantities({});
    setSelectAll(false);
    setSelectedClientId(null);
    setSelectedInvoiceId(null);
  };

  const handleClientChange = (clientId) => {
    setSelectedClientId(clientId);
    setSelectedItems([]);
    setItemQuantities({});
    setSelectAll(false);
    setSelectedInvoiceId(null);
  };

  const handleInvoiceChange = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setSelectedItems([]);
    setItemQuantities({});
    setSelectAll(false);
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      const ids = filteredProducts.map(item => item.id);
      setSelectedItems(ids);
      const qtyMap = {};
      filteredProducts.forEach(item => {
        qtyMap[item.id] = existingItemQuantities[item.id] || item.maxAvailableQty;
      });
      setItemQuantities(qtyMap);
    } else {
      setSelectedItems([]);
      setItemQuantities({});
    }
  };

  const handleItemChange = (itemId, checked) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
      const item = availableInvoiceItems.find(it => it.id === itemId);
      const defaultQty = existingItemQuantities[itemId] || item?.maxAvailableQty || 1;
      setItemQuantities(prev => ({ ...prev, [itemId]: defaultQty }));
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
      setItemQuantities(prev => {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      });
      setSelectAll(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const selectedProducts = availableInvoiceItems
        .filter(item => selectedItems.includes(item.id))
        .map(item => ({
          ...item,
          amountToBuy: itemQuantities[item.id] || 1,
        }));
      
      // Validación final: verificar que ninguna cantidad exceda lo disponible
      const invalidItems = selectedProducts.filter(item => {
        const availableItem = availableInvoiceItems.find(ai => ai.id === item.id);
        return availableItem && item.amountToBuy > availableItem.maxAvailableQty;
      });
      
      if (invalidItems.length > 0) {
        const itemNames = invalidItems.map(item => item.name).join(', ');
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
    const item = availableInvoiceItems.find(it => it.id === id);
    if (!item) return sum;
    const qty = itemQuantities[id] || 1;
    const itemCopy = { ...item, amountToBuy: qty };
    return sum + getTotalPrice(itemCopy);
  }, 0);

  // Calcular ITBIS total correctamente
  const totalItbis = selectedItems.reduce((sum, id) => {
    const item = availableInvoiceItems.find(it => it.id === id);
    if (!item) return sum;
    const qty = itemQuantities[id] || 1;
    const itemCopy = { ...item, amountToBuy: qty };
    return sum + getTax(itemCopy, true);
  }, 0);

  // Calcular subtotal (total sin impuestos)
  const subtotal = totalAmount - totalItbis;

  const columns = [
    {
      title: '',
      dataIndex: 'select',
      width: '50px',
      render: (_, record) => (
        <Checkbox
          checked={selectedItems.includes(record.id)}
          disabled={effectiveIsView}
          onChange={(e) => handleItemChange(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: 'Producto',
      dataIndex: 'name',
      key: 'name',
      width: isMobile ? "30px" : '35%',
      ellipsis: isMobile ? { showTitle: true } : false,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Cantidad',
      dataIndex: 'creditQty',
      key: 'creditQty',
      width: isMobile ? '90px' : '110px',
      render: (_, record) => {
        const maxQty = record.maxAvailableQty < 0 ? 0 : record.maxAvailableQty;
        const originalQty = (record.amountToBuy || 1);
        const creditedByOthers = (creditedQuantities[record.id] || 0);
        const selected = selectedItems.includes(record.id);
        const value = itemQuantities[record.id] || existingItemQuantities[record.id] || 1;

        const qtyDisplay = (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontWeight: '500' }}>{value}</span>
            <span style={{ fontSize: '11px', color: '#999' }}>/{maxQty}</span>
          </div>
        );

        if (effectiveIsView || !selected) {
          return qtyDisplay;
        }

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <InputNumber
              min={1}
              max={maxQty}
              value={value}
              onChange={(val) => handleQuantityChange(record.id, val)}
              size="small"
              style={{ width: '60px' }}
            />
            <Tooltip 
              title={
                <div>
                  <div><strong>Cálculo de Cantidad Máxima</strong></div>
                  <div style={{ marginBottom: '4px' }}>• Factura Original: {originalQty}</div>
                  <div style={{ marginBottom: '4px' }}>• Acreditado en otras NC: {creditedByOthers}</div>
                  <div style={{ borderTop: '1px solid #ddd', paddingTop: '4px', marginTop: '4px' }}>
                    <strong>Máximo disponible: {maxQty}</strong>
                  </div>
                  <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                    Fórmula: {originalQty} - {creditedByOthers} = {maxQty}
                  </div>
                </div>
              }
              placement="topLeft"
            >
              <span style={{ fontSize: '11px', color: '#999', cursor: 'help' }}>
                /{maxQty} <InfoCircleOutlined />
              </span>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: 'Precio',
      dataIndex: 'pricing',
      key: 'price',
      width: '120px',
      align: 'right',
      responsive: ['md'],
      render: (_, record) => {
        const unitPrice = getTotalPrice(record, true, false);
        return memoizedFormatPrice(unitPrice);
      },
      sorter: (a, b) => getTotalPrice(a, true, false) - getTotalPrice(b, true, false),
    },
    {
      title: 'ITBIS',
      dataIndex: 'itbis',
      key: 'itbis',
      width: '120px',
      align: 'right',
      responsive: ['lg'],
      render: (_, record) => {
        const qty = itemQuantities[record.id] || existingItemQuantities[record.id] || record.amountToBuy || 1;
        const tempItem = { ...record, amountToBuy: qty };
        const itbis = getTax(tempItem, true);
        return memoizedFormatPrice(itbis);
      },
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: '120px',
      align: 'right',
      responsive: ['sm'],
      render: (_, record) => {
        const qty = itemQuantities[record.id] || existingItemQuantities[record.id] || record.amountToBuy || 1;
        const tempItem = { ...record, amountToBuy: qty };
        return memoizedFormatPrice(getTotalPrice(tempItem));
      },
      sorter: (a, b) => {
        const qtyA = itemQuantities[a.id] || existingItemQuantities[a.id] || a.amountToBuy || 1;
        const qtyB = itemQuantities[b.id] || existingItemQuantities[b.id] || b.amountToBuy || 1;
        return getTotalPrice({ ...a, amountToBuy: qtyA }) - getTotalPrice({ ...b, amountToBuy: qtyB });
      },
    },
  ];

  const handleNavigateNote = (note, e) => {
    if (e) e.stopPropagation();
    if (!note) return;
    dispatch(openCreditNoteModal({ mode, creditNoteData: note }));
  };

  const handleQuantityChange = (itemId, value) => {
    if (!value || value < 1) return;
    
    // Verificar que no exceda la cantidad máxima disponible
    const item = availableInvoiceItems.find(it => it.id === itemId);
    if (item && value > item.maxAvailableQty) {
      const originalQty = item.amountToBuy || 1;
      const creditedByOthers = creditedQuantities[itemId] || 0;
      
      message.warning({
        content: (
          <div>
            <div><strong>Cantidad excede el máximo disponible</strong></div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              • Factura original: {originalQty}<br/>
              • Otras notas de crédito: {creditedByOthers}<br/>
              <strong>Máximo permitido: {item.maxAvailableQty}</strong>
            </div>
          </div>
        ),
        duration: 4
      });
      return;
    }
    
    setItemQuantities(prev => ({ ...prev, [itemId]: value }));
  };

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
      title={<TitleRow>{effectiveIsView ? 'Detalle Nota de Crédito' : effectiveIsEdit ? 'Editar Nota de Crédito' : 'Crear Nueva Nota de Crédito'}</TitleRow>}
    >
      <Container isMobile={isMobile}>
        {!canUseCreditNotes && (
          <Alert
            message={!taxReceiptEnabled ? "Comprobantes Fiscales Deshabilitados" : "Comprobante de Notas de Crédito no configurado"}
            description={!taxReceiptEnabled ? 
              "Los comprobantes fiscales están deshabilitados en la configuración. Para crear o editar notas de crédito, debe habilitar los comprobantes fiscales y configurar el comprobante correspondiente (serie 04 - NOTAS DE CRÉDITO)." :
              "Para crear o editar notas de crédito, debe configurar el comprobante fiscal correspondiente (serie 04 - NOTAS DE CRÉDITO)."
            }
            type="warning"
            showIcon
            style={{ marginBottom: '1rem' }}
          />
        )}

        {(effectiveIsView || effectiveIsEdit) && creditNoteData && (
          <NCFContainer>
            <NCFLabel>NCF</NCFLabel>
            <NCFValue>{creditNoteData.ncf || 'N/A'}</NCFValue>
          </NCFContainer>
        )}
        {mode === 'create' && (
          <Description>Complete los detalles para generar una nueva nota de crédito.</Description>
        )}

        {canUseCreditNotes && (
          <FormSection>
            <FormRow>
              <FormField>
                <ClientSelector
                  clients={clients}
                  selectedClient={currentClient}
                  onSelectClient={(client) => handleClientChange(client?.id || null)}
                  loading={clientsLoading}
                  disabled={effectiveIsView}
                />
              </FormField>

              <FormField>
                <InvoiceSelector
                  invoices={invoices}
                  selectedInvoice={currentInvoice}
                  onSelectInvoice={(invoice) => handleInvoiceChange(invoice?.id || null)}
                  loading={invoicesLoading}
                  disabled={!selectedClientId || effectiveIsView}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              </FormField>
            </FormRow>
          </FormSection>
        )}

        {canUseCreditNotes && (
          <Tabs
            defaultActiveKey="productos"
            type="card"
            size={isMobile ? 'small' : 'middle'}
          >
            {/* TAB: Productos */}
            <Tabs.TabPane tab="Productos" key="productos">
              {currentInvoice && hasAvailableProducts && (
          <ProductsSection>
            <SectionHeader>
              <div>
                <SectionTitle>Productos a Acreditar</SectionTitle>
                <SelectAllContainer>
                  <Checkbox
                    checked={selectAll}
                    disabled={effectiveIsView}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  >
                    Seleccionar todos los productos
                  </Checkbox>
                </SelectAllContainer>
              </div>
              <SearchContainer>
                <Input
                  placeholder="Buscar producto..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: isMobile ? '100%' : 200 }}
                  disabled={effectiveIsView}
                />
              </SearchContainer>
            </SectionHeader>

            <ProductList
              key={selectedInvoiceId}
              products={filteredProducts}
              columns={columns}
              selectedItems={selectedItems}
              itemQuantities={itemQuantities}
              existingItemQuantities={existingItemQuantities}
              creditedQuantities={creditedQuantities}
              isMobile={isMobile}
              effectiveIsView={effectiveIsView}
              currentPage={currentPage}
              pageSize={isMobile ? 3 : pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onItemChange={handleItemChange}
              onQuantityChange={handleQuantityChange}
            />

            {selectedItems.length > 0 && (
              <>
                <TotalSection>
                  <TotalInfo>
                    <InfoRow>
                      <InfoLabel>Items Seleccionados:</InfoLabel>
                      <InfoValue>{selectedItems.length} productos</InfoValue>
                    </InfoRow>
                    <InfoRow>
                      <InfoLabel>Subtotal:</InfoLabel>
                      <InfoValue>{memoizedFormatPrice(subtotal)}</InfoValue>
                    </InfoRow>
                    <InfoRow>
                      <InfoLabel>ITBIS:</InfoLabel>
                      <InfoValue>{memoizedFormatPrice(totalItbis)}</InfoValue>
                    </InfoRow>
                    <InfoRow className="total">
                      <InfoLabel>Total a Acreditar:</InfoLabel>
                      <InfoValue>{memoizedFormatPrice(totalAmount)}</InfoValue>
                    </InfoRow>
                  </TotalInfo>
                </TotalSection>
              </>
            )}
          </ProductsSection>
        )}

              {currentInvoice && !hasAvailableProducts && (
          <NoProductsMessage>
            <Alert
              type="info"
              showIcon
              message="Sin productos disponibles"
              description="Todos los productos de esta factura ya han sido acreditados en otras notas de crédito." />
          </NoProductsMessage>
              )}
            </Tabs.TabPane>

            {/* TAB: Historial de Aplicaciones */}
            {(effectiveIsView || effectiveIsEdit) && creditNoteApplications?.length > 0 && (
              <Tabs.TabPane tab={`Historial (${creditNoteApplications.length})`} key="historial">
                <ApplicationHistorySection>
                  <ApplicationHistoryTitle>Historial de Aplicaciones</ApplicationHistoryTitle>
                  {applicationsLoading ? (
                    <div>Cargando historial...</div>
                  ) : (
                    <>
                      <ApplicationHistoryList>
                        {creditNoteApplications.map((app, index) => (
                          <ApplicationHistoryItem key={app.id || index}>
                            <ApplicationHistoryHeader>
                              <ApplicationHistoryDate>
                                {app.appliedAt?.seconds 
                                  ? dayjs(new Date(app.appliedAt.seconds * 1000)).format('DD/MM/YYYY HH:mm')
                                  : dayjs(app.appliedAt).format('DD/MM/YYYY HH:mm')
                                }
                              </ApplicationHistoryDate>
                              <ApplicationHistoryAmount>
                                {memoizedFormatPrice(app.amountApplied)}
                              </ApplicationHistoryAmount>
                            </ApplicationHistoryHeader>
                            <ApplicationHistoryDetails>
                              <ApplicationHistoryDetail>
                                <strong>Factura Aplicada:</strong> {app.invoiceNcf || app.invoiceId}
                              </ApplicationHistoryDetail>
                              {app.invoiceNumber && (
                                <ApplicationHistoryDetail>
                                  <strong>Número:</strong> {app.invoiceNumber}
                                </ApplicationHistoryDetail>
                              )}
                              <ApplicationHistoryDetail>
                                <strong>Saldo Anterior:</strong> {memoizedFormatPrice(app.previousBalance)}
                                {' → '}
                                <strong>Saldo Nuevo:</strong> {memoizedFormatPrice(app.newBalance)}
                              </ApplicationHistoryDetail>
                              {app.appliedBy && (
                                <ApplicationHistoryDetail>
                                  <strong>Aplicado por:</strong> {app.appliedBy.displayName || 'Usuario'}
                                </ApplicationHistoryDetail>
                              )}
                            </ApplicationHistoryDetails>
                          </ApplicationHistoryItem>
                        ))}
                      </ApplicationHistoryList>
                      <ApplicationHistorySummary>
                        <ApplicationHistorySummaryItem>
                          <strong>Total Aplicado:</strong> {memoizedFormatPrice(
                            creditNoteApplications.reduce((sum, app) => sum + (app.amountApplied || 0), 0)
                          )}
                        </ApplicationHistorySummaryItem>
                        <ApplicationHistorySummaryItem>
                          <strong>Saldo Disponible:</strong> {memoizedFormatPrice(
                            creditNoteData?.availableAmount ?? (creditNoteData?.totalAmount || 0)
                          )}
                        </ApplicationHistorySummaryItem>
                      </ApplicationHistorySummary>
                    </>
                  )}
                </ApplicationHistorySection>
              </Tabs.TabPane>
            )}

            {/* TAB: Notas Relacionadas */}
            <Tabs.TabPane tab={`Notas Relacionadas (${relatedCreditNotes.length})`} key="relacionadas">
              {relatedCreditNotes.length > 0 ? (
                <RelatedNCSection>
                  {relatedCreditNotes.map(cn => (
                    <CreditNotePanel
                      key={cn.id}
                      creditNote={cn}
                      onNavigateNote={handleNavigateNote}
                      isExpanded={false}
                      isMobile={isMobile}
                    />
                  ))}
                </RelatedNCSection>
              ) : (
                <Alert
                  type="info"
                  showIcon
                  message="Sin notas de crédito relacionadas"
                  description="No existen notas de crédito asociadas a esta factura." />
              )}
            </Tabs.TabPane>
          </Tabs>
        )}

        <ActionButtons>
          <Button onClick={handleClose}>
            Cancelar
          </Button>
          {(effectiveIsView || effectiveIsEdit) && (
            <Button
              icon={<PrinterOutlined />}
              onClick={() => handlePrintPdf(creditNoteData)}
              loading={pdfLoading}
              disabled={!creditNoteData}
            >
              Imprimir
            </Button>
          )}
          {!effectiveIsView && canUseCreditNotes && (
          <Button
            type="primary"
            onClick={handleSubmit}
            disabled={!selectedInvoiceId || selectedItems.length === 0}
            loading={loading}
          >
              {effectiveIsEdit ? 'Guardar Cambios' : 'Crear Nota de Crédito'}
          </Button>
          )}
        </ActionButtons>
        {effectiveIsEdit && (
          <CountdownText>
            {isTimeAllowed && !hasApplications 
              ? `Tiempo restante para editar: ${Math.max(0, Math.floor((ALLOWED_EDIT_MS - (Date.now() - createdAtDate.getTime()))/ (60*60*1000)))}h` 
              : hasApplications 
                ? 'No se puede editar: nota ya aplicada'
                : 'Edición expirada'
            }
          </CountdownText>
        )}
      </Container>
    </ResponsiveContainer>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.isMobile ? '1rem' : '1.5rem'};
  height: ${props => props.isMobile ? '100%' : 'auto'};
`;

const Description = styled.p`
  color: ${props => props.theme?.text?.secondary || '#666'};
  margin: 0;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormRow = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const FormField = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ProductsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme?.text?.primary || '#333'};
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const SelectAllContainer = styled.div`
  margin-top: 0.5rem;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const TotalSection = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem 0;
  width: 100%;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const TotalInfo = styled.div`
  min-width: 300px;
  border: 1px solid ${props => props.theme?.border?.color || '#d9d9d9'};
  border-radius: 8px;
  padding: 1rem;
  background-color: ${props => props.theme?.background?.secondary || '#fafafa'};
  
  @media (max-width: 768px) {
    min-width: 100%;
    padding: 0.75rem;
  }
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  
  &.total {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid ${props => props.theme?.border?.color || '#d9d9d9'};
    font-weight: 600;
    font-size: 1.1rem;
  }
`;

const InfoLabel = styled.span`
  color: ${props => props.theme?.text?.secondary || '#666'};
`;

const InfoValue = styled.span`
  font-weight: 500;
  color: ${props => props.theme?.text?.primary || '#333'};
  font-family: monospace;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid ${props => props.theme?.border?.color || '#d9d9d9'};
  
  @media (max-width: 768px) {
    position: sticky;
    bottom: 0;
    background: white;
    margin: 1rem -16px -20px -16px;
    padding: 1rem 16px;
    border-top: 1px solid #f0f0f0;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
    flex-direction: column-reverse;
    gap: 0.75rem;
    
    button {
      width: 100%;
      height: 44px;
      font-size: 16px;
    }
  }
`;

const CountdownText = styled.div`
  text-align: right;
  font-size: 0.75rem;
  color: ${props => props.theme?.text?.secondary || '#888'};
  margin-top: -0.5rem;
`;

const RelatedNCSection = styled.div`
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const NoProductsMessage = styled.div`
  margin-top: 1rem;
`;

const TitleRow = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
`;

const NCFContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 12px 16px;
  border: 1px solid ${props => props.theme?.border?.color || '#d9d9d9'};
  border-radius: 8px;
  background-color: ${props => props.theme?.background?.secondary || '#fafafa'};
  max-width: 300px;
`;

const NCFLabel = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme?.text?.secondary || '#666'};
  margin-bottom: 4px;
`;

const NCFValue = styled.span`
  font-size: 1em;
  font-weight: 600;
  color: ${props => props.theme?.text?.primary || '#333'};
  word-break: break-all;
`;

// Estilos para el historial de aplicaciones
const ApplicationHistorySection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

const ApplicationHistoryTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme?.text?.primary || '#333'};
`;

const ApplicationHistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ApplicationHistoryItem = styled.div`
  border: 1px solid ${props => props.theme?.border?.color || '#d9d9d9'};
  border-radius: 8px;
  padding: 1rem;
  background-color: ${props => props.theme?.background?.secondary || '#fafafa'};
`;

const ApplicationHistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ApplicationHistoryDate = styled.span`
  font-size: 0.875rem;
  color: ${props => props.theme?.text?.secondary || '#666'};
  font-weight: 500;
`;

const ApplicationHistoryAmount = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.theme?.text?.primary || '#333'};
  font-family: monospace;
`;

const ApplicationHistoryDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ApplicationHistoryDetail = styled.div`
  font-size: 0.875rem;
  color: ${props => props.theme?.text?.secondary || '#666'};
  
  strong {
    color: ${props => props.theme?.text?.primary || '#333'};
  }
`;

const ApplicationHistorySummary = styled.div`
  border-top: 1px solid ${props => props.theme?.border?.color || '#d9d9d9'};
  padding-top: 1rem;
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ApplicationHistorySummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  
  strong {
    color: ${props => props.theme?.text?.primary || '#333'};
  }
`;

export default CreditNoteModal;
