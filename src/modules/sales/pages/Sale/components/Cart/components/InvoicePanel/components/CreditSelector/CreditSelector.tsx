import {
  CreditCardOutlined,
  InfoCircleOutlined,
  CheckOutlined,
} from '@/constants/icons/antd';
import { Modal, Skeleton, Alert } from 'antd';
import { DateTime } from 'luxon';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { useFbGetAvailableCreditNotes } from '@/hooks/creditNote/useFbGetAvailableCreditNotes';
import { formatPrice } from '@/utils/format';
import type { TimestampLike } from '@/utils/date/types';
import type { CreditNoteRecord, CreditNoteSelection } from '@/types/creditNote';


type PaymentMethod = {
  status?: boolean;
  method?: string;
  value?: number | string;
};

type CreditSelectorProps = {
  clientId?: string | null;
  onCreditNoteSelect: (selections: CreditNoteSelection[]) => void;
  selectedCreditNotes?: CreditNoteSelection[];
  totalPurchase?: number;
  paymentMethods?: PaymentMethod[];
  disabled?: boolean;
};

const toDateTime = (value?: CreditNoteRecord['createdAt']) => {
  if (!value) return null;
  if (DateTime.isDateTime(value)) return value;
  if (typeof value === 'object' && 'seconds' in value && value.seconds) {
    return DateTime.fromSeconds(value.seconds);
  }
  if (value instanceof Date) return DateTime.fromJSDate(value);
  if (typeof value === 'number') return DateTime.fromMillis(value);
  if (typeof value === 'string') {
    const iso = DateTime.fromISO(value);
    return iso.isValid ? iso : DateTime.fromJSDate(new Date(value));
  }
  if (typeof value?.toDate === 'function') {
    return DateTime.fromJSDate(value.toDate());
  }
  return null;
};

/**
 * CreditSelector component
 * Compact widget that shows a summary of available credit notes and the amount selected.
 * Clicking the widget opens a Modal where the user can choose which credit notes to apply.
 */
const CreditSelector = ({
  clientId,
  onCreditNoteSelect,
  selectedCreditNotes = [],
  totalPurchase = 0,
  paymentMethods = [],
  disabled = false,
}: CreditSelectorProps) => {
  const { creditNotes, loading, totalAvailable } =
    useFbGetAvailableCreditNotes(clientId) as {
      creditNotes: CreditNoteRecord[];
      loading: boolean;
      totalAvailable: number;
    };

  // Local state
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  // Derivar selecciones locales directamente del prop
  const localSelections = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    selectedCreditNotes.forEach((sel) => {
      if (!sel.id) return;
      map[String(sel.id)] = sel.amountUsed ?? sel.amountToUse ?? 0;
    });
    return map;
  }, [selectedCreditNotes]);

  // Focus search input when modal opens
  useEffect(() => {
    if (visible && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 120);
    }
  }, [visible]);

  // Derived values
  const totalSelected = Object.values(localSelections).reduce(
    (sum, v) => sum + (v || 0),
    0,
  );

  // Calculate remaining amount considering other payment methods
  const totalOtherPayments = paymentMethods
    .filter((method) => method.status && method.method !== 'creditNote')
    .reduce((sum, method) => sum + (Number(method.value) || 0), 0);

  const remainingToPay = Math.max(0, totalPurchase - totalOtherPayments);

  // Filtered credit notes list
  const filteredNotes = search
    ? creditNotes.filter((note) => {
      const term = search.toLowerCase();
      return (
        (note.ncf || '').toLowerCase().includes(term) ||
        String(note.number || '').toLowerCase().includes(term)
      );
    })
    : creditNotes;

  // Handlers
  const handleWidgetClick = () => {
    if (disabled || !clientId) return;
    setVisible(true);
  };

  const handleClose = () => {
    setVisible(false);
    setSearch('');
  };

  const propagate = (newSelections: Record<string, number>) => {
    const mapped = Object.entries(newSelections).map(([id, amountToUse]) => {
      const note = creditNotes.find((cn) => cn.id === id);
      return {
        id,
        creditNote: note,
        amountToUse: Number(amountToUse),
      };
    });
    onCreditNoteSelect(mapped);
  };

  const handleAmountChange = (noteId: string, value?: number) => {
    const note = creditNotes.find((n) => n.id === noteId);
    if (!note) return;
    const prev = localSelections[noteId] || 0;
    const remaining = remainingToPay - totalSelected + prev;
    const maxAllowed = Math.min(note.availableAmount ?? 0, remaining);
    const valid = Math.max(0, Math.min(value || 0, maxAllowed));

    const newSel = { ...localSelections, [noteId]: valid };
    if (valid === 0) delete newSel[noteId];
    propagate(newSel);
  };

  const handleCheckboxChange = (noteId: string, checked: boolean) => {
    if (checked) {
      const note = creditNotes.find((n) => n.id === noteId);
      if (!note) return;
      const remaining = remainingToPay - totalSelected;
      const defaultVal = Math.min(note.availableAmount ?? 0, remaining);
      handleAmountChange(noteId, defaultVal);
    } else {
      handleAmountChange(noteId, 0);
    }
  };

  // UI components
  const renderWidgetContent = () => {
    if (!clientId) return <Placeholder>Seleccione un cliente</Placeholder>;

    if (loading) return <Skeleton active paragraph={false} />;

    if (!creditNotes.length)
      return <Placeholder>Sin notas de crédito</Placeholder>;

    if (remainingToPay <= 0 && totalOtherPayments > 0) {
      return <Placeholder>Compra totalmente pagada</Placeholder>;
    }

    return (
      <WidgetInfo>
        <RowTop>
          <LeftSection>
            <CreditCardOutlined />
            <span>Notas de Crédito</span>
          </LeftSection>
          <CountBadge>{creditNotes.length}</CountBadge>
        </RowTop>
        <RowBottom>
          <span>
            Disponible: {formatPrice(Math.min(totalAvailable, remainingToPay))}
          </span>
          {totalSelected > 0 && (
            <SelectedBadge>{formatPrice(totalSelected)}</SelectedBadge>
          )}
        </RowBottom>
      </WidgetInfo>
    );
  };

  return (
    <>
      <WidgetCard onClick={handleWidgetClick} $disabled={disabled}>
        {renderWidgetContent()}
      </WidgetCard>

      <Modal
        title="Notas de Crédito"
        open={visible}
        onOk={handleClose}
        onCancel={handleClose}
        width={600}
        okText="Aceptar"
        cancelText="Cerrar"
        destroyOnHidden
        styles={{ body: { padding: '1em' } }}
      >
        {!clientId ? (
          <Alert message="Seleccione un cliente" type="info" showIcon />
        ) : loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : !creditNotes.length ? (
          <Alert
            message="Sin notas de crédito disponibles"
            type="info"
            showIcon
          />
        ) : remainingToPay <= 0 ? (
          <Alert
            message="No se pueden aplicar notas de crédito"
            description="La compra ya está totalmente pagada con otros métodos de pago."
            type="warning"
            showIcon
          />
        ) : (
          <>
            <SearchInput
              ref={searchInputRef}
              placeholder="Buscar NCF o número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <NotesList>
              {filteredNotes.length === 0 ? (
                <EmptyMessage>No se encontraron notas</EmptyMessage>
              ) : (
                filteredNotes.map((note) => {
                  const selectedAmount = localSelections[note.id] || 0;
                  const prev = localSelections[note.id] || 0;
                  const remaining = remainingToPay - totalSelected + prev;
                  const maxAllowed = Math.min(note.availableAmount, remaining);

                  return (
                    <ListItem key={note.id} $selected={selectedAmount > 0}>
                      <CustomCheckbox
                        $checked={selectedAmount > 0}
                        onClick={() =>
                          handleCheckboxChange(note.id, !(selectedAmount > 0))
                        }
                        $disabled={maxAllowed === 0}
                      >
                        {selectedAmount > 0 && <CheckOutlined />}
                      </CustomCheckbox>
                      <ItemContent>
                        <div className="info">
                          <div className="ncf">{note.ncf || note.number}</div>
                          <div className="date">
                            {toDateTime(note.createdAt)?.toFormat('dd/MM/yyyy')}
                          </div>
                        </div>
                      </ItemContent>
                      <RightSection>
                        <div className="amount-section">
                          <AmountLabel>Disponible:</AmountLabel>
                          <AmountValue>
                            {formatPrice(note.availableAmount)}
                          </AmountValue>
                        </div>
                        {selectedAmount > 0 && (
                          <div className="input-section">
                            <InputLabel>Usar:</InputLabel>
                            <InputContainer>
                              <NumberInput
                                type="number"
                                min={0}
                                max={maxAllowed}
                                step={0.01}
                                value={selectedAmount}
                                onChange={(e) =>
                                  handleAmountChange(
                                    note.id,
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                              />
                              <InfoIcon
                                title={`Máximo disponible: ${formatPrice(maxAllowed)}`}
                              >
                                <InfoCircleOutlined />
                              </InfoIcon>
                            </InputContainer>
                          </div>
                        )}
                      </RightSection>
                    </ListItem>
                  );
                })
              )}
            </NotesList>
          </>
        )}
      </Modal>
    </>
  );
};

/* ---------------------------- styled components --------------------------- */
const WidgetCard = styled.div`
  padding: 16px;
  cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
  user-select: none;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  transition: all 0.2s ease;

  &&:hover {
    box-shadow: ${(props) =>
    props.$disabled ? 'none' : '0 2px 8px rgba(0,0,0,0.08)'};
  }
`;

const WidgetInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Placeholder = styled.div`
  color: #8c8c8c;
`;

const ListItem = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  border: 1px solid ${(props) => (props.$selected ? '#495057' : '#f0f0f0')};
  border-radius: 6px;

  &&:hover {
    border-color: #6c757d;
  }
`;

const ItemContent = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  min-width: 0;

  .info {
    flex: 1;
    min-width: 0;

    .ncf {
      font-weight: 500;
    }

    .date {
      font-size: 12px;
      color: #8c8c8c;
    }
  }

  .amount {
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    align-items: flex-start;
    min-width: 100px;
    font-family: monospace;
    font-weight: 500;
    text-align: left;
  }
`;

const RowTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
`;

const RowBottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LeftSection = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const CountBadge = styled.span`
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  background: #6c757d;
  border-radius: 12px;
`;

const SelectedBadge = styled.span`
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  background: #495057;
  border-radius: 12px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 1em;
  outline: none;
  border: 1px solid #d9d9d9;
  border-radius: 6px;

  &&:focus {
    border-color: #495057;
  }
`;

const NotesList = styled.div`
  margin-top: 1em;
`;

const EmptyMessage = styled.div`
  padding: 2em;
  color: #8c8c8c;
  text-align: center;
`;

const CustomCheckbox = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: white;
  cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
  background: ${(props) => (props.$checked ? '#495057' : 'white')};
  border: 1px solid
    ${(props) =>
    props.$disabled ? '#d9d9d9' : props.$checked ? '#495057' : '#d9d9d9'};
  border-radius: 4px;

  &&:hover {
    border-color: ${(props) => (props.$disabled ? '#d9d9d9' : '#495057')};
  }
`;

const InfoIcon = styled.div`
  margin-left: 8px;
  color: ${(props) => (props.$disabled ? '#d9d9d9' : '#8c8c8c')};
  cursor: pointer;

  &&:hover {
    color: ${(props) => (props.$disabled ? '#d9d9d9' : '#495057')};
  }
`;

const InputContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
`;

const NumberInput = styled.input`
  width: 90px;
  padding: 8px;
  font-family: monospace;
  text-align: right;
  outline: none;
  border: 1px solid #d9d9d9;
  border-radius: 4px;

  &&:focus {
    border-color: #495057;
  }
`;

const AmountLabel = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: #6c757d;
  text-transform: uppercase;
`;

const AmountValue = styled.span`
  font-family: monospace;
  font-size: 13px;
  font-weight: 600;
  color: #262626;
`;

const InputLabel = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: #6c757d;
  text-transform: uppercase;
  white-space: nowrap;
`;

const RightSection = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-direction: row;
  gap: 16px;
  align-items: flex-start;
  min-width: 240px;

  .amount-section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 100px;
  }

  .input-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
    min-width: 120px;
  }
`;

export default CreditSelector;
