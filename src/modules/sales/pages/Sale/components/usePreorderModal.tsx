import { ReloadOutlined } from '@/constants/icons/antd';
import { Modal, Select, App } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';


import { selectUser } from '@/features/auth/userSlice';
import {
  SelectSettingCart,
  loadCart,
  selectCart,
  setCartId,
} from '@/features/cart/cartSlice';
import { selectClientWithAuth } from '@/features/clientCart/clientCartSlice';
import { selectTaxReceiptType } from '@/features/taxReceipt/taxReceiptSlice';
import { fbGetPreorders } from '@/firebase/invoices/fbGetPreorders';
import { formatPrice } from '@/utils/format';
import { formatLocaleDate } from '@/utils/date/dateUtils';
import { validateInvoiceCart } from '@/utils/invoiceValidation';
import type { InvoiceData } from '@/types/invoice';

type UserIdentity = {
  businessID?: string;
  uid?: string;
};

type CartSettings = {
  billing?: {
    billingMode?: string;
  };
};

type CartState = {
  data?: {
    type?: string;
  };
};

type FirestoreTimestamp = {
  seconds?: number;
  nanoseconds?: number;
};

type PreorderData = InvoiceData;

type PreorderDoc = { data?: PreorderData } | PreorderData;

type PreorderEntry = {
  key: string;
  id?: string;
  raw: PreorderData;
  number: string | number;
  client: string;
  total: number;
  status: string;
  createdAt: Date | null;
};

type StatusTone = {
  text: string;
  background: string;
};


const resolvePreorderTaxReceiptType = (preorder?: PreorderData | null) =>
  preorder?.selectedTaxReceiptType ??
  preorder?.preorderDetails?.selectedTaxReceiptType ??
  preorder?.preorderDetails?.taxReceipt?.type ??
  null;

const ModalCard = styled.div`
  display: grid;
  gap: 18px;
`;

const ModalHeader = styled.header`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
`;

const HeaderNote = styled.span`
  font-size: 0.75rem;
  color: #64748b;
`;

const IconButton = styled.button`
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1d4ed8;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  background: #fff;
  border: 1px solid #cbd5f5;
  border-radius: 999px;
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
  padding-right: 4px;
  overflow-y: auto;
`;

const EmptyState = styled.div`
  display: grid;
  gap: 6px;
  margin: 40px 0 28px;
  color: #64748b;
  text-align: center;
`;

const SelectorRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
  min-width: 0;
`;

const SelectedSummary = styled.div`
  display: grid;
  gap: 10px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
`;

const SummaryRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
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

const StatusPill = styled.span<{ $tone?: StatusTone }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $tone }) => $tone?.text || '#0f172a'};
  text-transform: capitalize;
  background: ${({ $tone }) => $tone?.background || '#e2e8f0'};
  border-radius: 999px;
`;

const Amount = styled.span`
  font-weight: 600;
  color: #0f172a;
`;

const PrimaryAction = styled.button`
  width: 100%;
  padding: 10px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border: none;
  border-radius: 8px;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    box-shadow: 0 12px 22px rgb(37 99 235 / 20%);
    transform: translateY(-1px) scale(1.01);
  }
`;

const LoadingState = styled.div`
  display: grid;
  gap: 12px;
  justify-items: center;
  padding: 40px 0;
  font-size: 0.9rem;
  color: #475569;
`;

const Spinner = styled.div`
  width: 36px;
  height: 36px;
  border: 4px solid #bfdbfe;
  border-top-color: #1d4ed8;
  border-radius: 50%;
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

const STATUS_TONES: Record<string, StatusTone> = {
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
  const dispatch = useDispatch<any>();
  const user = useSelector(selectUser) as UserIdentity | null;
  const cart = useSelector(selectCart) as CartState | null;
  const cartSettings = useSelector(SelectSettingCart) as CartSettings | null;
  const businessID = user?.businessID;
  const navigate = useNavigate();
  const location = useLocation();
  const isDeferredBillingEnabled =
    cartSettings?.billing?.billingMode === 'deferred';

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preorders, setPreorders] = useState<PreorderDoc[]>([]);
  const [userSelectedKey, setUserSelectedKey] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const isModalOpen = isDeferredBillingEnabled && isOpen;

  useEffect(() => {
    if (!isModalOpen || !businessID) {
      return undefined;
    }

    let isSubscribed = true;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let unsubscribe = () => {};
    const payload = { businessID };

    const subscribe = async () => {
      try {
        setIsLoading(true);
        unsubscribe = await fbGetPreorders(payload, (docs) => {
          if (!isSubscribed) return;
          setPreorders((docs as PreorderDoc[]) || []);
          setIsLoading(false);
          setLastUpdatedAt(Date.now());
        });
      } catch (error) {
        setIsLoading(false);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Verifica tu conexión e intenta de nuevo.';
        notification.error({
          message: 'No se pudieron cargar las preventas',
          description: errorMessage,
        });
      }
    };

    subscribe();

    return () => {
      isSubscribed = false;
      unsubscribe?.();
    };
  }, [isModalOpen, businessID, reloadToken, notification]);

  const handleOpen = () => {
    if (!isDeferredBillingEnabled) {
      return;
    }
    if (!businessID) {
      notification.warning({
        message: 'Acción no disponible',
        description:
          'Debes seleccionar un negocio válido antes de cargar preventas.',
      });
      return;
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleRetry = () => {
    if (!isModalOpen) return;
    setLastUpdatedAt(null);
    setPreorders([]);
    setIsLoading(true);
    setReloadToken((token) => token + 1);
  };

  const entries = useMemo<PreorderEntry[]>(() => {
    const mappedEntries = preorders.map((preorder, index) => {
      const data =
        (preorder &&
        typeof preorder === 'object' &&
        'data' in preorder
          ? preorder.data
          : preorder) ?? {};
      const normalizedData = data as PreorderData;
      const keySource =
        normalizedData.id ||
        normalizedData?.preorderDetails?.numberID ||
        `preorder-${index}`;
      return {
        key: String(keySource),
        id: normalizedData.id,
        raw: normalizedData,
        number: normalizedData?.preorderDetails?.numberID || '—',
        client: normalizedData?.client?.name || 'Cliente sin nombre',
        total: Number(normalizedData?.totalPurchase?.value || 0),
        status: normalizedData?.status || 'pending',
        createdAt: (() => {
          const date = normalizedData?.preorderDetails?.date;
          if (!date) return null;
          if (
            typeof date === 'object' &&
            'seconds' in date &&
            typeof date.seconds === 'number'
          ) {
            return new Date(date.seconds * 1000);
          }
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

  const selectedPreorderKey = useMemo(() => {
    if (entries.length === 0) {
      return null;
    }
    if (
      userSelectedKey &&
      entries.some((entry) => entry.key === userSelectedKey)
    ) {
      return userSelectedKey;
    }
    return entries[0].key;
  }, [entries, userSelectedKey]);

  const selectorOptions = useMemo(
    () =>
      entries.map((item) => ({
        value: item.key,
        label: `#${item.number} · ${item.client} · ${formatPrice(item.total)}`,
        data: item,
      })),
    [entries],
  );

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.key === selectedPreorderKey) || null,
    [entries, selectedPreorderKey],
  );

  const convertTimestampsToMillis = (obj: unknown): unknown => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => convertTimestampsToMillis(item));
    }

    const converted: Record<string, unknown> = {};
    const record = obj as Record<string, unknown>;
    for (const key in record) {
      const value = record[key];

      if (
        value &&
        typeof value === 'object' &&
        'seconds' in value &&
        'nanoseconds' in value
      ) {
        const timestamp = value as FirestoreTimestamp;
        converted[key] =
          (timestamp.seconds ?? 0) * 1000 +
          Math.floor((timestamp.nanoseconds ?? 0) / 1000000);
      } else if (value && typeof value === 'object') {
        converted[key] = convertTimestampsToMillis(value);
      } else {
        converted[key] = value;
      }
    }
    return converted;
  };

  const handleLoadPreorder = (preorder?: PreorderData | null) => {
    if (!preorder) {
      return;
    }
    const { isValid, message } = validateInvoiceCart(preorder);
    if (!isValid) {
      notification.warning({
        message: 'No se pudo cargar la preventa',
        description: message || 'Verifica el contenido antes de continuar.',
      });
      return;
    }

    // Convert all Firestore Timestamps to milliseconds before dispatching to Redux
    const serializedPreorder = convertTimestampsToMillis(preorder) as PreorderData;

    dispatch(loadCart(serializedPreorder));
    dispatch(setCartId());
    const storedTaxReceiptType =
      resolvePreorderTaxReceiptType(serializedPreorder);
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
    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : '',
      },
      { replace: true },
    );

    notification.success({
      message: 'Preventa cargada',
      description: `Se cargó la preventa ${serializedPreorder?.preorderDetails?.numberID || ''} del cliente ${serializedPreorder?.client?.name || 'sin nombre'}.`,
    });
    setIsOpen(false);
  };

  useEffect(() => {
    if (location.pathname !== '/sales') return;
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    const preorderIdParam = params.get('preorderId');

    if (
      mode === 'preorder' &&
      preorderIdParam &&
      cart?.data?.type !== 'preorder'
    ) {
      params.delete('preorderId');
      navigate(
        {
          pathname: location.pathname,
          search: params.toString() ? `?${params.toString()}` : '',
        },
        { replace: true },
      );
    }
  }, [cart?.data?.type, location.pathname, location.search, navigate, notification]);

  return {
    openModal: handleOpen,
    isDeferredBillingEnabled,
    Modal: !isDeferredBillingEnabled ? null : (
      <Modal
        open={isModalOpen}
        title={null}
        footer={null}
        onCancel={handleClose}
        destroyOnHidden
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
                <EmptyDescription>
                  Cuando tengas preventas activas aparecerán aquí.
                </EmptyDescription>
              </EmptyState>
            ) : (
              <>
                <SelectorRow>
                  {lastUpdatedAt && (
                    <HeaderNote>
                      Actualizado{' '}
                      {new Date(lastUpdatedAt).toLocaleTimeString('es-DO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </HeaderNote>
                  )}
                  <IconButton
                    type="button"
                    onClick={handleRetry}
                    disabled={isLoading}
                  >
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
                    onChange={(value) => setUserSelectedKey(String(value))}
                    options={selectorOptions}
                    filterOption={(input, option) =>
                      (option?.label || '')
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    optionRender={(option) => {
                      const data = option.data?.data;
                      if (!data) return option.label;
                      return (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '8px',
                              alignItems: 'center',
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              Preventa #{data.number}
                            </span>
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                color: '#0f172a',
                                flexShrink: 0,
                              }}
                            >
                              {formatPrice(data.total)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '8px',
                              alignItems: 'center',
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: '0.8rem',
                                color: '#64748b',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              {data.client}
                            </span>
                            {data.createdAt && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  color: '#94a3b8',
                                  flexShrink: 0,
                                }}
                              >
                                {formatLocaleDate(data.createdAt)}
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
                        {STATUS_LABELS[selectedEntry.status] ||
                          selectedEntry.status}
                      </StatusPill>
                    </SummaryRow>
                    <SummaryRow>
                      <ItemSubtitle>{selectedEntry.client}</ItemSubtitle>
                    </SummaryRow>
                    <SummaryRow>
                      {selectedEntry.createdAt ? (
                        <TimestampLabel>
                          {selectedEntry.createdAt.toLocaleString('es-DO', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
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
                  onClick={() =>
                    selectedEntry && handleLoadPreorder(selectedEntry.raw)
                  }
                  disabled={!selectedEntry}
                >
                  Cargar
                </PrimaryAction>
              </>
            )}
          </ModalBody>
        </ModalCard>
      </Modal>
    ),
  };
};
