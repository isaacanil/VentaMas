import { CreditCardOutlined, InfoCircleOutlined } from '@/constants/icons/antd';
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
import { DateTime } from 'luxon';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { useFbGetAvailableCreditNotes } from '@/hooks/creditNote/useFbGetAvailableCreditNotes';
import { formatPrice } from '@/utils/format';
import type { CreditNoteRecord, CreditNoteSelection } from '@/types/creditNote';

const { Title, Text } = Typography;

type CreditNoteSelectorProps = {
  clientId?: string | null;
  onCreditNoteSelect: (selections: CreditNoteSelection[]) => void;
  selectedCreditNotes?: CreditNoteSelection[];
  disabled?: boolean;
  totalPurchase?: number;
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
  if (typeof (value as any)?.toDate === 'function') {
    return DateTime.fromJSDate((value as any).toDate());
  }
  return null;
};

const CreditNoteSelector = ({
  clientId,
  onCreditNoteSelect,
  selectedCreditNotes = [],
  disabled = false,
  totalPurchase = 0,
}: CreditNoteSelectorProps) => {
  const { creditNotes, loading, totalAvailable } =
    useFbGetAvailableCreditNotes(clientId) as {
      creditNotes: CreditNoteRecord[];
      loading: boolean;
      totalAvailable: number;
    };

  // Derivar selecciones locales directamente del prop
  const localSelections = useMemo<Record<string, number>>(() => {
    const newSelections: Record<string, number> = {};
    selectedCreditNotes.forEach((selection) => {
      if (!selection.id) return;
      newSelections[String(selection.id)] = selection.amountToUse;
    });
    return newSelections;
  }, [selectedCreditNotes]);

  // Calcular el total seleccionado
  const totalSelected = Object.values(localSelections).reduce(
    (sum, amount) => sum + (amount || 0),
    0,
  );

  const handleAmountChange = (creditNoteId: string, amount?: number | null) => {
    const creditNote = creditNotes.find((cn) => cn.id === creditNoteId);
    if (!creditNote) return;

    const maxAmount = Math.min(
      (creditNote.availableAmount as number) ?? 0,
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

    // Notificar al componente padre directamente
    const updatedSelections = Object.entries(newSelections).map(
      ([id, amountToUse]) => {
        const note = creditNotes.find((cn) => cn.id === id);
        return {
          id,
          creditNote: note,
          amountToUse: Number(amountToUse),
        };
      },
    );

    onCreditNoteSelect(updatedSelections);
  };

  const handleQuickSelect = (creditNoteId: string, amount: number) => {
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
          const selectedAmount = localSelections[creditNote.id as string] || 0;
          const maxUsable = Math.min(
            (creditNote.availableAmount as number) || 0,
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
                      {toDateTime(creditNote.createdAt)?.toFormat('dd/MM/yyyy')}
                    </Text>
                  </ItemTitle>
                  <Text strong style={{ color: '#1890ff' }}>
                    {formatPrice((creditNote.availableAmount as number) || 0)}
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
                          handleAmountChange(creditNote.id as string, value)
                        }
                        style={{ width: '100px' }}
                        placeholder="0.00"
                      />
                      <Button
                        size="small"
                        type="link"
                        onClick={() =>
                          handleQuickSelect(creditNote.id as string, maxUsable)
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
                          onClick={() => handleQuickSelect(creditNote.id as string, 0)}
                        >
                          Limpiar
                        </Button>
                      )}
                    </Space>
                    {maxUsable < (creditNote.availableAmount as number) && (
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

const CreditNoteItem = styled(List.Item) <{ $isSelected?: boolean }>`
  padding: 12px !important;
  margin-bottom: 8px !important;
  background-color: ${({ $isSelected }) => ($isSelected ? '#f6ffed' : 'white')};
  border: 1px solid ${({ $isSelected }) => ($isSelected ? '#52c41a' : '#f0f0f0')} !important;
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
