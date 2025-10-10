import { CreditCardOutlined, InfoCircleOutlined, CheckOutlined } from '@ant-design/icons';
import { Modal, Skeleton, Alert } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { useFbGetAvailableCreditNotes } from '../../../../../../../hooks/creditNote/useFbGetAvailableCreditNotes';
import { formatPrice } from '../../../../../../../utils/formatPrice';


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
}) => {
  const { creditNotes, loading, totalAvailable } = useFbGetAvailableCreditNotes(clientId);

  // Local state
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [localSelections, setLocalSelections] = useState({});
  const searchInputRef = useRef(null);

  // Initialise local selections from parent
  useEffect(() => {
    const map = {};
    selectedCreditNotes.forEach(sel => {
      map[sel.id] = sel.amountUsed;
    });
    setLocalSelections(map);
  }, [selectedCreditNotes]);

  // Focus search input when modal opens
  useEffect(() => {
    if (visible && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 120);
    }
  }, [visible]);

  // Derived values
  const totalSelected = Object.values(localSelections).reduce((sum, v) => sum + (v || 0), 0);

  // Calculate remaining amount considering other payment methods
  const totalOtherPayments = paymentMethods
    .filter(method => method.status && method.method !== 'creditNote')
    .reduce((sum, method) => sum + (Number(method.value) || 0), 0);
  
  const remainingToPay = Math.max(0, totalPurchase - totalOtherPayments);

  // Filtered credit notes list
  const filteredNotes = search
    ? creditNotes.filter(note => {
        const term = search.toLowerCase();
        return (
          (note.ncf || '').toLowerCase().includes(term) ||
          (note.number || '').toLowerCase().includes(term)
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

  const propagate = newSelections => {
    const mapped = Object.entries(newSelections).map(([id, amountToUse]) => {
      const note = creditNotes.find(cn => cn.id === id);
      return { 
        id, 
        creditNote: note, 
        amountToUse: amountToUse 
      };
    });
    onCreditNoteSelect(mapped);
  };

  const handleAmountChange = (noteId, value) => {
    const note = creditNotes.find(n => n.id === noteId);
    if (!note) return;
    const prev = localSelections[noteId] || 0;
    const remaining = remainingToPay - totalSelected + prev;
    const maxAllowed = Math.min(note.availableAmount, remaining);
    const valid = Math.max(0, Math.min(value || 0, maxAllowed));

    const newSel = { ...localSelections, [noteId]: valid };
    if (valid === 0) delete newSel[noteId];
    setLocalSelections(newSel);
    propagate(newSel);
  };

  const handleCheckboxChange = (noteId, checked) => {
    if (checked) {
      const note = creditNotes.find(n => n.id === noteId);
      const remaining = remainingToPay - totalSelected;
      const defaultVal = Math.min(note.availableAmount, remaining);
      handleAmountChange(noteId, defaultVal);
    } else {
      handleAmountChange(noteId, 0);
    }
  };

  // UI components
  const renderWidgetContent = () => {
    if (!clientId) return <Placeholder>Seleccione un cliente</Placeholder>;

    if (loading) return <Skeleton active paragraph={false} />;

    if (!creditNotes.length) return <Placeholder>Sin notas de crédito</Placeholder>;

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
          <span>Disponible: {formatPrice(Math.min(totalAvailable, remainingToPay))}</span>
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
        destroyOnClose
        styles={{ body: { padding: '1em' } }}
      >
        {!clientId ? (
          <Alert message="Seleccione un cliente" type="info" showIcon />
        ) : loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : !creditNotes.length ? (
          <Alert message="Sin notas de crédito disponibles" type="info" showIcon />
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
              onChange={e => setSearch(e.target.value)}
            />
            <NotesList>
              {filteredNotes.length === 0 ? (
                <EmptyMessage>No se encontraron notas</EmptyMessage>
              ) : (
                filteredNotes.map(note => {
                const selectedAmount = localSelections[note.id] || 0;
                const prev = localSelections[note.id] || 0;
                const remaining = remainingToPay - totalSelected + prev;
                const maxAllowed = Math.min(note.availableAmount, remaining);

                return (
                  <ListItem key={note.id} $selected={selectedAmount > 0}>
                    <CustomCheckbox
                      $checked={selectedAmount > 0}
                      onClick={() => handleCheckboxChange(note.id, !(selectedAmount > 0))}
                      $disabled={maxAllowed === 0}
                    >
                      {selectedAmount > 0 && <CheckOutlined />}
                    </CustomCheckbox>
                    <ItemContent>
                      <div className="info">
                        <div className="ncf">{note.ncf || note.number}</div>
                        <div className="date">
                          {dayjs(
                            note.createdAt?.seconds
                              ? new Date(note.createdAt.seconds * 1000)
                              : note.createdAt,
                          ).format('DD/MM/YYYY')}
                        </div>
                      </div>
                    </ItemContent>
                    <RightSection>
                      <div className="amount-section">
                        <AmountLabel>Disponible:</AmountLabel>
                        <AmountValue>{formatPrice(note.availableAmount)}</AmountValue>
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
                              onChange={e => handleAmountChange(note.id, parseFloat(e.target.value) || 0)}
                            />
                            <InfoIcon title={`Máximo disponible: ${formatPrice(maxAllowed)}`}>
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
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 16px;
  background: white;
  cursor: ${props => (props.$disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    box-shadow: ${props => (props.$disabled ? 'none' : '0 2px 8px rgba(0,0,0,0.08)')};
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

const SelectedTag = styled.span`
  margin-left: auto;
  background: #495057;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const ListItem = styled.div`
  padding: 8px 12px;
  border: 1px solid ${props => (props.$selected ? '#495057' : '#f0f0f0')};
  border-radius: 6px;
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
  align-items: center;

  &:hover {
    border-color: #6c757d;
  }
`;

const ItemContent = styled.div`
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
    flex-shrink: 0;
    min-width: 100px;
    font-family: monospace;
    font-weight: 500;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }
`;

const QuantityBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 120px;
  flex-shrink: 0;
`;

const RowTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
`;

const RowBottom = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CountBadge = styled.span`
  background: #6c757d;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const SelectedBadge = styled.span`
  background: #495057;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  outline: none;
  margin-bottom: 1em;

  &:focus {
    border-color: #495057;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
`;

const NotesList = styled.div`
  margin-top: 1em;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: #8c8c8c;
  padding: 2em;
`;

const CustomCheckbox = styled.div`
  width: 20px;
  height: 20px;
  border: 1px solid ${props => (props.$disabled ? '#d9d9d9' : props.$checked ? '#495057' : '#d9d9d9')};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => (props.$disabled ? 'not-allowed' : 'pointer')};
  background: ${props => (props.$checked ? '#495057' : 'white')};
  color: white;
  flex-shrink: 0;

  &:hover {
    border-color: ${props => (props.$disabled ? '#d9d9d9' : '#495057')};
  }
`;

const InfoIcon = styled.div`
  margin-left: 8px;
  cursor: pointer;
  color: ${props => (props.$disabled ? '#d9d9d9' : '#8c8c8c')};

  &:hover {
    color: ${props => (props.$disabled ? '#d9d9d9' : '#495057')};
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
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  outline: none;
  text-align: right;
  font-family: monospace;

  &:focus {
    border-color: #495057;
  }
`;

const AmountLabel = styled.span`
  font-size: 11px;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
`;

const AmountValue = styled.span`
  font-size: 13px;
  color: #262626;
  font-weight: 600;
  font-family: monospace;
`;

const InputLabel = styled.span`
  font-size: 11px;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  white-space: nowrap;
`;

const RightSection = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;
  flex-shrink: 0;
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
    align-items: flex-start;
    gap: 4px;
    min-width: 120px;
  }
`;

export default CreditSelector; 