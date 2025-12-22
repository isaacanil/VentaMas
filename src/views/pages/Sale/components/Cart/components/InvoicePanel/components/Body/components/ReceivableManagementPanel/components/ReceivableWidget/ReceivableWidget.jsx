import { SettingOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  CalendarOutlined,
  DollarOutlined,
  NumberOutlined,
} from '@ant-design/icons';
import { Button, notification } from 'antd';
import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';

import {
  selectAR,
  resetAR,
} from '../../../../../../../../../../../../../features/accountsReceivable/accountsReceivableSlice';
import { toggleReceivableStatus } from '../../../../../../../../../../../../../features/cart/cartSlice';
import { SelectCartData } from '../../../../../../../../../../../../../features/cart/cartSlice';
import DateUtils from '../../../../../../../../../../../../../utils/date/dateUtils';
import { calculateInvoiceChange } from '../../../../../../../../../../../../../utils/invoice';


const getPositive = (value) => (value < 0 ? -value : value);

export const ReceivableWidget = ({
  receivableStatus,
  isChangeNegative,
  onOpenConfig,
}) => {
  const dispatch = useDispatch();

  const {
    paymentFrequency,
    totalInstallments,
    installmentAmount,
    currentBalance,
    paymentDate,
  } = useSelector(selectAR);

  const cartData = useSelector(SelectCartData);
  const change = useMemo(() => calculateInvoiceChange(cartData), [cartData]);

  // No mostrar el widget si no está agregado a receivables o no hay cambio negativo
  if (!receivableStatus || !isChangeNegative) {
    return null;
  }

  const handleRemoveFromReceivable = () => {
    if (isChangeNegative) {
      dispatch(toggleReceivableStatus());
    }
    dispatch(resetAR());
    notification.success({
      message: 'Éxito',
      description: 'Removido de Cuentas por Cobrar',
    });
  };

  const handleOpenConfig = () => {
    if (onOpenConfig) {
      onOpenConfig();
    }
  };

  const formatFrequency = (frequency) => {
    return frequency === 'monthly' ? 'Mensual' : 'Semanal';
  };

  const getNextPaymentText = () => {
    if (!paymentDate) return 'No configurado';
    return DateUtils.convertMillisToDayjs(paymentDate).toFormat('dd/MM/yyyy');
  };

  return (
    <WidgetContainer>
      <WidgetHeader>
        <WidgetTitle>Cuenta por Cobrar</WidgetTitle>{' '}
        <BalanceBadge>
          <BalanceLabel>Monto Pendiente</BalanceLabel>
          <BalanceValue>
            {formatPrice(getPositive(currentBalance))}
          </BalanceValue>
        </BalanceBadge>
      </WidgetHeader>

      <WidgetContent>
        <InfoRow>
          <InfoItem>
            <InfoIcon>
              <DollarOutlined />
            </InfoIcon>
            <InfoDetails>
              <InfoLabel>Total a Crédito</InfoLabel>
              <InfoValue>{formatPrice(getPositive(change))}</InfoValue>
            </InfoDetails>
          </InfoItem>

          <InfoItem>
            <InfoIcon>
              <NumberOutlined />
            </InfoIcon>
            <InfoDetails>
              <InfoLabel>Cuotas</InfoLabel>
              <InfoValue>
                {totalInstallments || 1} {formatFrequency(paymentFrequency)}
              </InfoValue>
            </InfoDetails>
          </InfoItem>
        </InfoRow>

        <InfoRow>
          <InfoItem>
            <InfoIcon>
              <DollarOutlined />
            </InfoIcon>
            <InfoDetails>
              <InfoLabel>Monto/Cuota</InfoLabel>
              <InfoValue>{formatPrice(installmentAmount || 0)}</InfoValue>
            </InfoDetails>
          </InfoItem>
          <InfoItem>
            <InfoIcon>
              <CalendarOutlined />
            </InfoIcon>
            <InfoDetails>
              <InfoLabel>Primer Pago</InfoLabel>
              <InfoValue>{getNextPaymentText()}</InfoValue>
            </InfoDetails>
          </InfoItem>{' '}
        </InfoRow>

        {/* Botones de acción */}
        <ActionButtonsRow>
          <Button
            type="default"
            icon={<SettingOutlined />}
            onClick={handleOpenConfig}
            style={{ flex: 1 }}
          >
            Configurar
          </Button>
          <Button
            type="default"
            danger
            icon={<DeleteOutlined />}
            onClick={handleRemoveFromReceivable}
          >
            Quitar
          </Button>
        </ActionButtonsRow>
      </WidgetContent>
    </WidgetContainer>
  );
};

const WidgetContainer = styled.div`
  padding: 16px;
  margin-top: 8px;
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
  transition: all 0.3s ease;
`;

const WidgetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid #e9ecef;
`;

const WidgetTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  letter-spacing: 0.3px;
`;

const BalanceBadge = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
`;

const BalanceLabel = styled.span`
  margin-bottom: 2px;
  font-size: 10px;
  font-weight: 500;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const BalanceValue = styled.span`
  padding: 2px 6px;
  font-size: 12px;
  font-weight: 600;
  color: #856404;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
`;

const WidgetContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InfoRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const ActionButtonsRow = styled.div`
  display: flex;
  gap: 8px;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid #e9ecef;
`;

const InfoItem = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
`;

const InfoIcon = styled.div`
  flex-shrink: 0;
  font-size: 14px;
  color: #6c757d;
`;

const InfoDetails = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
`;

const InfoLabel = styled.span`
  margin-bottom: 2px;
  font-size: 10px;
  font-weight: 500;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $highlighted }) => ($highlighted ? '#856404' : '#212529')};
  white-space: nowrap;
`;

export default ReceivableWidget;
