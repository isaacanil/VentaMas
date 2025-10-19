import { ReloadOutlined } from '@ant-design/icons';
import { Modal, Select, App } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '../../../../features/auth/userSlice';
import { SelectSettingCart, loadCart, selectCart, setCartId } from '../../../../features/cart/cartSlice';
import { selectTaxReceiptType } from '../../../../features/taxReceipt/taxReceiptSlice';
import { selectClientWithAuth } from '../../../../features/clientCart/clientCartSlice';
import { fbGetPreorders } from '../../../../firebase/invoices/fbGetPreorders';
import { useFormatPrice } from '../../../../hooks/useFormatPrice';
import { validateInvoiceCart } from '../../../../utils/invoiceValidation';

const resolvePreorderTaxReceiptType = (preorder) =>
  preorder?.selectedTaxReceiptType ??
  preorder?.preorderDetails?.selectedTaxReceiptType ??
  preorder?.preorderDetails?.taxReceipt?.type ??
  null;

const FloatingButton = styled.button`
  position: fixed;
  bottom: 24px;
  left: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #1f2937, #111827);
  color: #f5f7ff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.45);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  z-index: 1600;

  &:hover {
    transform: translateY(-2px) scale(1.04);
    box-shadow: 0 18px 36px rgba(15, 23, 42, 0.55);
  }

  &:active {
    transform: scale(0.96);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
    box-shadow: 0 8px 16px rgba(15, 23, 42, 0.35);
  }
`;

const ModalCard = styled.div`
  display: grid;
  gap: 18px;
`;

const ModalHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HeaderNote = styled.span`
  font-size: 0.75rem;
  color: #64748b;
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid #cbd5f5;
  background: #fff;
  color: #1d4ed8;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  transition: all 0.18s ease;

  &:hover {
    background: ${({ disabled }) => (disabled ? '#fff' : '#eff6ff')};
    border-color: ${({ disabled }) => (disabled ? '#cbd5f5' : '#93c5fd')};
  }
`;

const ModalBody = styled.div`
  display: grid;
  gap: 14px;
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 4px;
`;

const EmptyState = styled.div`
  margin: 40px 0 28px;
  display: grid;
  gap: 6px;
  text-align: center;
  color: #64748b;
`;

const SelectorRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  min-width: 0;
`;

const SelectedSummary = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  background: #f8fafc;
  display: grid;
  gap: 10px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const SummaryLabel = styled.span`
  font-size: 0.8rem;
  color: #64748b;
`;

const ItemTitle = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
`;

const ItemSubtitle = styled.span`
  font-size: 0.85rem;
  color: #64748b;
`;

const TimestampLabel = styled.span`
  font-size: 0.75rem;
  color: #94a3b8;
`;

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  color: ${({ $tone }) => $tone?.text || '#0f172a'};
  background: ${({ $tone }) => $tone?.background || '#e2e8f0'};
`;

const Amount = styled.span`
  font-weight: 600;
  color: #0f172a;
`;

const PrimaryAction = styled.button`
  width: 100%;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px) scale(1.01);
    box-shadow: 0 12px 22px rgba(37, 99, 235, 0.2);
  }
`;

const LoadingState = styled.div`
  display: grid;
  gap: 12px;
  justify-items: center;
  padding: 40px 0;
  color: #475569;
  font-size: 0.9rem;
`;

const Spinner = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 4px solid #bfdbfe;
  border-top-color: #1d4ed8;
  animation: spin 0.9s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const EmptyTitle = styled.span`
  font-weight: 600;
`;

const EmptyDescription = styled.span`
  font-size: 0.85rem;
`;

const STATUS_TONES = {
  pending: { text: '#b45309', background: '#fef3c7' },
  completed: { text: '#166534', background: '#dcfce7' },
  cancelled: { text: '#b91c1c', background: '#fee2e2' },
};

const STATUS_LABELS = {
  pending: 'Pendiente',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export const usePreorderModal = () => {
  const { notification } = App.useApp();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const cart = useSelector(selectCart);
  const cartSettings = useSelector(SelectSettingCart);
  const formatPrice = useFormatPrice;
  const businessID = user?.businessID;
  const navigate = useNavigate();
  const location = useLocation();
  const isDeferredBillingEnabled = cartSettings?.billing?.billingMode === 'deferred';

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preorders, setPreorders] = useState([]);
  const [selectedPreorderKey, setSelectedPreorderKey] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!isOpen || !businessID) {
      return undefined;
    }

    let isSubscribed = true;
    let unsubscribe = () => {};
    const payload = { businessID };

    const subscribe = async () => {
      try {
        setIsLoading(true);
        unsubscribe = await fbGetPreorders(payload, (docs) => {
          if (!isSubscribed) return;
          setPreorders(docs || []);
          setIsLoading(false);
          setLastUpdatedAt(Date.now());
        });
      } catch (error) {
        setIsLoading(false);
        notification.error({
          message: 'No se pudieron cargar las preventas',
          description: error?.message || 'Verifica tu conexión e intenta de nuevo.'
        });
      }
    };

    subscribe();

    return () => {
      isSubscribed = false;
      unsubscribe?.();
    };
  }, [isOpen, businessID, reloadToken]);

  const handleOpen = () => {
    if (!isDeferredBillingEnabled) {
      return;
    }
    if (!businessID) {
      notification.warning({
        message: 'Acción no disponible',
        description: 'Debes seleccionar un negocio válido antes de cargar preventas.'
      });
      return;
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleRetry = () => {
    if (!isOpen) return;
    setLastUpdatedAt(null);
    setPreorders([]);
    setIsLoading(true);
    setReloadToken((token) => token + 1);
  };

  const entries = useMemo(() => {
    const mappedEntries = preorders.map((preorder, index) => {
      const data = preorder?.data || {};
      return {
        key: data.id || data?.preorderDetails?.numberID || `preorder-${index}`,
        id: data.id,
        raw: data,
        number: data?.preorderDetails?.numberID || '—',
        client: data?.client?.name || 'Cliente sin nombre',
        total: Number(data?.totalPurchase?.value || 0),
        status: data?.status || 'pending',
        createdAt: (() => {
          const date = data?.preorderDetails?.date;
          if (!date) return null;
          // Handle Firestore Timestamp (with seconds)
          if (date.seconds !== undefined) {
            return new Date(date.seconds * 1000);
          }
          // Handle already converted milliseconds
          if (typeof date === 'number') {
            return new Date(date);
          }
          return null;
        })(),
      };
    });

    // Sort entries to show the most recent ones first
    mappedEntries.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      if (a.createdAt) return -1;
      if (b.createdAt) return 1;
      return 0;
    });

    return mappedEntries;
  }, [preorders]);

  useEffect(() => {
    if (entries.length === 0) {
      setSelectedPreorderKey((current) => (current === null ? current : null));
      return;
    }

    setSelectedPreorderKey((current) => {
      if (current && entries.some((entry) => entry.key === current)) {
        return current;
      }
      return entries[0].key;
    });
  }, [entries]);

  const selectorOptions = useMemo(() => (
    entries.map((item) => ({
      value: item.key,
      label: `#${item.number} · ${item.client} · ${formatPrice(item.total)}`,
      data: item,
    }))
  ), [entries, formatPrice]);

  const selectedEntry = useMemo(() => (
    entries.find((entry) => entry.key === selectedPreorderKey) || null
  ), [entries, selectedPreorderKey]);

  const convertTimestampsToMillis = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => convertTimestampsToMillis(item));
    }
    
    const converted = {};
    for (const key in obj) {
      const value = obj[key];
      
      // Check if it's a Firestore Timestamp
      if (value && typeof value === 'object' && value.seconds !== undefined && value.nanoseconds !== undefined) {
        converted[key] = value.seconds * 1000 + Math.floor(value.nanoseconds / 1000000);
      } else if (value && typeof value === 'object') {
        converted[key] = convertTimestampsToMillis(value);
      } else {
        converted[key] = value;
      }
    }
    return converted;
  };

  const handleLoadPreorder = (preorder) => {
    if (!preorder) {
      return;
    }
    const { isValid, message } = validateInvoiceCart(preorder);
    if (!isValid) {
      notification.warning({
        message: 'No se pudo cargar la preventa',
        description: message || 'Verifica el contenido antes de continuar.'
      });
      return;
    }

    // Convert all Firestore Timestamps to milliseconds before dispatching to Redux
    const serializedPreorder = convertTimestampsToMillis(preorder);

    dispatch(loadCart(serializedPreorder));
    dispatch(setCartId());
    const storedTaxReceiptType = resolvePreorderTaxReceiptType(serializedPreorder);
    if (storedTaxReceiptType) {
      dispatch(selectTaxReceiptType(storedTaxReceiptType));
    }
    if (serializedPreorder?.client) {
      dispatch(selectClientWithAuth(serializedPreorder.client));
    }

    const params = new URLSearchParams(location.search);
    params.set('mode', 'preorder');
    if (serializedPreorder?.id) {
      params.set('preorderId', serializedPreorder.id);
    } else {
      params.delete('preorderId');
    }
    params.set('preserveCart', '1');
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });

    notification.success({
      message: 'Preventa cargada',
      description: `Se cargó la preventa ${serializedPreorder?.preorderDetails?.numberID || ''} del cliente ${serializedPreorder?.client?.name || 'sin nombre'}.`
    });
    setIsOpen(false);
  };

  useEffect(() => {
    if (location.pathname !== '/sales') return;
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    const preorderIdParam = params.get('preorderId');

    if (mode === 'preorder' && preorderIdParam && cart?.data?.type !== 'preorder') {
      params.delete('preorderId');
      navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
    }
  }, [cart?.data?.type, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!isDeferredBillingEnabled && isOpen) {
      setIsOpen(false);
    }
  }, [isDeferredBillingEnabled, isOpen]);

  return {
    openModal: handleOpen,
    isDeferredBillingEnabled,
    Modal: !isDeferredBillingEnabled ? null : (
      <Modal
        open={isOpen}
        title={null}
        footer={null}
        onCancel={handleClose}
        destroyOnClose
        maskClosable
        width={520}
      >
        <ModalCard>
          <ModalHeader>
            <ModalTitle>Cargar Preventa</ModalTitle>
          </ModalHeader>

          <ModalBody>
            {isLoading ? (
              <LoadingState>
                <Spinner />
                <span>Cargando preventas...</span>
              </LoadingState>
            ) : entries.length === 0 ? (
              <EmptyState>
                <EmptyTitle>Sin preventas pendientes</EmptyTitle>
                <EmptyDescription>Cuando tengas preventas activas aparecerán aquí.</EmptyDescription>
              </EmptyState>
            ) : (
              <>
                <SelectorRow>
                  {lastUpdatedAt && (
                    <HeaderNote>
                      Actualizado {new Date(lastUpdatedAt).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
                    </HeaderNote>
                  )}
                  <IconButton type="button" onClick={handleRetry} disabled={isLoading}>
                    <ReloadOutlined />
                    Actualizar
                  </IconButton>
                </SelectorRow>

                <SelectorRow>
                  <Select
                    showSearch
                    size="large"
                    placeholder="Selecciona una preventa"
                    style={{ width: '100%', minWidth: 0 }}
                    optionFilterProp="label"
                    value={selectedPreorderKey}
                    onChange={(value) => setSelectedPreorderKey(value)}
                    options={selectorOptions}
                    filterOption={(input, option) =>
                      (option?.label || '').toLowerCase().includes(input.toLowerCase())
                    }
                    optionRender={(option) => {
                      const data = option.data?.data;
                      if (!data) return option.label;
                      return (
                        <div style={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          minWidth: 0
                        }}>
                          <div style={{ 
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '8px',
                            alignItems: 'center'
                          }}>
                            <span style={{ 
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              minWidth: 0
                            }}>
                              Preventa #{data.number}
                            </span>
                            <span style={{ 
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              color: '#0f172a',
                              flexShrink: 0
                            }}>
                              {formatPrice(data.total)}
                            </span>
                          </div>
                          <div style={{ 
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '8px',
                            alignItems: 'center',
                            minWidth: 0
                          }}>
                            <span style={{ 
                              fontSize: '0.8rem',
                              color: '#64748b',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              minWidth: 0
                            }}>
                              {data.client}
                            </span>
                            {data.createdAt && (
                              <span style={{ 
                                fontSize: '0.75rem',
                                color: '#94a3b8',
                                flexShrink: 0
                              }}>
                                {data.createdAt.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }}
                  />
                </SelectorRow>

                {selectedEntry && (
                  <SelectedSummary>
                    <SummaryRow>
                      <ItemTitle>Preventa #{selectedEntry.number}</ItemTitle>
                      <StatusPill $tone={STATUS_TONES[selectedEntry.status]}>
                        {STATUS_LABELS[selectedEntry.status] || selectedEntry.status}
                      </StatusPill>
                    </SummaryRow>
                    <SummaryRow>
                      <ItemSubtitle>{selectedEntry.client}</ItemSubtitle>
                    </SummaryRow>
                    <SummaryRow>
                      {selectedEntry.createdAt ? (
                        <TimestampLabel>
                          {selectedEntry.createdAt.toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' })}
                        </TimestampLabel>
                      ) : (
                        <span />
                      )}
                      <Amount>{formatPrice(selectedEntry.total)}</Amount>
                    </SummaryRow>
                  </SelectedSummary>
                )}

                <PrimaryAction
                  type="button"
                  onClick={() => selectedEntry && handleLoadPreorder(selectedEntry.raw)}
                  disabled={!selectedEntry}
                >
                  Cargar
                </PrimaryAction>
              </>
            )}
          </ModalBody>
        </ModalCard>
      </Modal>
    )
  };
};

export const PreorderQuickActions = () => {
  const { Modal } = usePreorderModal();
  return Modal;
};

export default PreorderQuickActions;
