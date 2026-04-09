import { ReloadOutlined } from '@/constants/icons/antd';
import { Modal, Select } from 'antd';
import styled from 'styled-components';
import { formatLocaleDate } from '@/utils/date/dateUtils';
import { formatInvoicePrice } from '@/utils/invoice/documentCurrency';
import type { InvoiceData } from '@/types/invoice';

export type PreorderData = InvoiceData;

export type StatusTone = {
  text: string;
  background: string;
};

export type PreorderEntry = {
  key: string;
  id?: string;
  raw: PreorderData;
  number: string | number;
  client: string;
  total: number;
  status: string;
  createdAt: Date | null;
};

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

const IconButton = styled.button<{ disabled?: boolean; type?: string }>`
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1d4ed8;
  cursor: ${({ disabled }: { disabled?: boolean }) =>
    disabled ? 'not-allowed' : 'pointer'};
  background: #fff;
  border: 1px solid #cbd5f5;
  border-radius: 999px;
  opacity: ${({ disabled }: { disabled?: boolean }) => (disabled ? 0.6 : 1)};
  transition: all 0.18s ease;

  &:hover {
    background: ${({ disabled }: { disabled?: boolean }) =>
      disabled ? '#fff' : '#eff6ff'};
    border-color: ${({ disabled }: { disabled?: boolean }) =>
      disabled ? '#cbd5f5' : '#93c5fd'};
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
  color: ${({ $tone }: { $tone?: StatusTone }) => $tone?.text || '#0f172a'};
  text-transform: capitalize;
  background: ${({ $tone }: { $tone?: StatusTone }) =>
    $tone?.background || '#e2e8f0'};
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

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

interface PreorderModalProps {
  isOpen: boolean;
  isLoading: boolean;
  lastUpdatedAt: number | null;
  entries: PreorderEntry[];
  selectedPreorderKey: string | null;
  selectorOptions: any[];
  selectedEntry: PreorderEntry | null;
  onClose: () => void;
  onRetry: () => void;
  onSelect: (key: string) => void;
  onLoadPreorder: (preorder: PreorderData) => void;
}

export const PreorderModal = ({
  isOpen,
  isLoading,
  lastUpdatedAt,
  entries,
  selectedPreorderKey,
  selectorOptions,
  selectedEntry,
  onClose,
  onRetry,
  onSelect,
  onLoadPreorder,
}: PreorderModalProps) => {
  return (
    <Modal
      open={isOpen}
      title={null}
      footer={null}
      onCancel={onClose}
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
                  onClick={onRetry}
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
                  onChange={(value) => onSelect(String(value))}
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
                            {formatInvoicePrice(data.total, data.raw)}
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
                    <Amount>
                      {formatInvoicePrice(
                        selectedEntry.total,
                        selectedEntry.raw,
                      )}
                    </Amount>
                  </SummaryRow>
                </SelectedSummary>
              )}

              <PrimaryAction
                type="button"
                onClick={() =>
                  selectedEntry && onLoadPreorder(selectedEntry.raw)
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
  );
};
