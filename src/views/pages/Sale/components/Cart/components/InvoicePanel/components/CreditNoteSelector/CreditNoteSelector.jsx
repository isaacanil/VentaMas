import { CreditCardOutlined, InfoCircleOutlined } from '@ant-design/icons';
import {
  Card,
  List,
  Button,
  Typography,
  Tag,
  Skeleton,
  Alert,
  InputNumber,
  Space,
  Tooltip,
} from 'antd';
import dayjs from 'dayjs';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import { useFbGetAvailableCreditNotes } from '@/hooks/creditNote/useFbGetAvailableCreditNotes';
import { formatPrice } from '@/utils/formatPrice';

const { Title, Text } = Typography;

const CreditNoteSelector = ({
  clientId,
  onCreditNoteSelect,
  selectedCreditNotes = [],
  disabled = false,
  totalPurchase = 0,
}) => {
  const { creditNotes, loading, totalAvailable } =
    useFbGetAvailableCreditNotes(clientId);
  const [localSelections, setLocalSelections] = useState({});

  // Sincronizar selecciones locales con las selecciones externas
  useEffect(() => {
    const newSelections = {};
    selectedCreditNotes.forEach((selection) => {
      newSelections[selection.id] = selection.amountToUse;
    });
    setLocalSelections(newSelections);
  }, [selectedCreditNotes]);

  // Calcular el total seleccionado
  const totalSelected = Object.values(localSelections).reduce(
    (sum, amount) => sum + (amount || 0),
    0,
  );

  const handleAmountChange = (creditNoteId, amount) => {
    const creditNote = creditNotes.find((cn) => cn.id === creditNoteId);
    if (!creditNote) return;

    const maxAmount = Math.min(
      creditNote.availableAmount,
      totalPurchase - totalSelected + (localSelections[creditNoteId] || 0),
    );
    const validAmount = Math.max(0, Math.min(amount || 0, maxAmount));

    const newSelections = {
      ...localSelections,
      [creditNoteId]: validAmount,
    };

    // Si el monto es 0, eliminar la selección
    if (validAmount === 0) {
      delete newSelections[creditNoteId];
    }

    setLocalSelections(newSelections);

    // Notificar al componente padre
    const updatedSelections = Object.entries(newSelections).map(
      ([id, amountToUse]) => {
        const note = creditNotes.find((cn) => cn.id === id);
        return {
          id,
          creditNote: note,
          amountToUse,
        };
      },
    );

    onCreditNoteSelect(updatedSelections);
  };

  const handleQuickSelect = (creditNoteId, amount) => {
    handleAmountChange(creditNoteId, amount);
  };

  if (!clientId) {
    return (
      <StyledCard>
        <Alert
          message="Seleccione un cliente"
          description="Para ver las notas de crédito disponibles, primero debe seleccionar un cliente."
          type="info"
          showIcon
        />
      </StyledCard>
    );
  }

  if (loading) {
    return (
      <StyledCard>
        <Skeleton active paragraph={{ rows: 3 }} />
      </StyledCard>
    );
  }

  if (!creditNotes.length) {
    return (
      <StyledCard>
        <Alert
          message="Sin notas de crédito disponibles"
          description="Este cliente no tiene notas de crédito disponibles para aplicar."
          type="info"
          showIcon
        />
      </StyledCard>
    );
  }

  return (
    <StyledCard>
      <CardHeader>
        <HeaderLeft>
          <CreditCardOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
          <Title level={5} style={{ margin: 0 }}>
            Notas de Crédito Disponibles
          </Title>
        </HeaderLeft>
        <HeaderRight>
          <Tag color="blue">Total: {formatPrice(totalAvailable)}</Tag>
          {totalSelected > 0 && (
            <Tag color="green">Seleccionado: {formatPrice(totalSelected)}</Tag>
          )}
        </HeaderRight>
      </CardHeader>

      <List
        dataSource={creditNotes}
        renderItem={(creditNote) => {
          const selectedAmount = localSelections[creditNote.id] || 0;
          const maxUsable = Math.min(
            creditNote.availableAmount,
            totalPurchase - totalSelected + selectedAmount,
          );
          const isSelected = selectedAmount > 0;

          return (
            <CreditNoteItem key={creditNote.id} $isSelected={isSelected}>
              <ItemContent>
                <ItemHeader>
                  <ItemTitle>
                    <Text strong>{creditNote.ncf || creditNote.number}</Text>
                    <Text
                      type="secondary"
                      style={{ fontSize: '12px', marginLeft: '8px' }}
                    >
                      {dayjs(
                        creditNote.createdAt?.seconds
                          ? new Date(creditNote.createdAt.seconds * 1000)
                          : creditNote.createdAt,
                      ).format('DD/MM/YYYY')}
                    </Text>
                  </ItemTitle>
                  <Text strong style={{ color: '#1890ff' }}>
                    {formatPrice(creditNote.availableAmount)}
                  </Text>
                </ItemHeader>

                {!disabled && maxUsable > 0 && (
                  <ItemActions>
                    <Space>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Usar:
                      </Text>
                      <InputNumber
                        size="small"
                        min={0}
                        max={maxUsable}
                        step={0.01}
                        value={selectedAmount}
                        onChange={(value) =>
                          handleAmountChange(creditNote.id, value)
                        }
                        style={{ width: '100px' }}
                        placeholder="0.00"
                      />
                      <Button
                        size="small"
                        type="link"
                        onClick={() =>
                          handleQuickSelect(creditNote.id, maxUsable)
                        }
                        disabled={maxUsable === 0}
                      >
                        Máximo
                      </Button>
                      {selectedAmount > 0 && (
                        <Button
                          size="small"
                          type="link"
                          danger
                          onClick={() => handleQuickSelect(creditNote.id, 0)}
                        >
                          Limpiar
                        </Button>
                      )}
                    </Space>
                    {maxUsable < creditNote.availableAmount && (
                      <Tooltip title="El monto máximo está limitado por el total de la compra">
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          <InfoCircleOutlined /> Máximo disponible:{' '}
                          {formatPrice(maxUsable)}
                        </Text>
                      </Tooltip>
                    )}
                  </ItemActions>
                )}

                {disabled && selectedAmount > 0 && (
                  <ItemActions>
                    <Tag color="green">
                      Aplicando: {formatPrice(selectedAmount)}
                    </Tag>
                  </ItemActions>
                )}
              </ItemContent>
            </CreditNoteItem>
          );
        }}
      />

      {totalSelected > 0 && (
        <SummarySection>
          <Text type="secondary">
            Total a aplicar:{' '}
            <Text strong style={{ color: '#52c41a' }}>
              {formatPrice(totalSelected)}
            </Text>
          </Text>
        </SummarySection>
      )}
    </StyledCard>
  );
};

const StyledCard = styled(Card)`
  .ant-card-body {
    padding: 16px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const HeaderLeft = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const HeaderRight = styled.div`
  display: flex;
  gap: 8px;
`;

const CreditNoteItem = styled(List.Item)`
  padding: 12px !important;
  margin-bottom: 8px !important;
  background-color: ${(props) => (props.$isSelected ? '#f6ffed' : 'white')};
  border: 1px solid ${(props) => (props.$isSelected ? '#52c41a' : '#f0f0f0')} !important;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    border-color: #1890ff;
    box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
  }
`;

const ItemContent = styled.div`
  width: 100%;
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const ItemTitle = styled.div`
  display: flex;
  align-items: center;
`;

const ItemActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SummarySection = styled.div`
  padding-top: 16px;
  margin-top: 16px;
  text-align: right;
  border-top: 1px solid #f0f0f0;
`;

export default CreditNoteSelector;
