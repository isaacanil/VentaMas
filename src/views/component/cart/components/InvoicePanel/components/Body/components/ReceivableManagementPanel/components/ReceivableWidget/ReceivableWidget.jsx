import { SettingOutlined, DeleteOutlined } from '@ant-design/icons';
import { CalendarOutlined, DollarOutlined, NumberOutlined } from '@ant-design/icons';
import { Button, notification } from 'antd';
import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

import { selectAR, resetAR } from '../../../../../../../../../../../features/accountsReceivable/accountsReceivableSlice';
import { toggleReceivableStatus } from '../../../../../../../../../../../features/cart/cartSlice';
import { SelectCartData } from '../../../../../../../../../../../features/cart/cartSlice';
import { useFormatPrice } from '../../../../../../../../../../../hooks/useFormatPrice';
import DateUtils from '../../../../../../../../../../../utils/date/dateUtils';
import { calculateInvoiceChange } from '../../../../../../../../../../../utils/invoice';


const getPositive = (value) => (value < 0 ? -value : value);

export const ReceivableWidget = ({ 
  receivableStatus, 
  isChangeNegative, 
  onOpenConfig,
  creditLimit 
}) => {
  const dispatch = useDispatch();
  
  const {
    paymentFrequency,
    totalInstallments,
    installmentAmount,
    currentBalance,
    paymentDate,
    totalReceivable
  } = useSelector(selectAR);

  const cartData = useSelector(SelectCartData);
  const change = useMemo(() => calculateInvoiceChange(cartData), [cartData]);
  const generalBalance = useMemo(() => getPositive(change) + currentBalance, [change, currentBalance]);

  // No mostrar el widget si no está agregado a receivables o no hay cambio negativo
  if (!receivableStatus || !isChangeNegative) {
    return null;
  }

  const handleRemoveFromReceivable = () => {
    if (isChangeNegative) {
      dispatch(toggleReceivableStatus())
    }
    dispatch(resetAR())
    notification.success({
      message: 'Éxito',
      description: 'Removido de Cuentas por Cobrar'
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
    return DateUtils.convertMillisToDayjs(paymentDate).format('DD/MM/YYYY');
  };

  return (    <WidgetContainer>
      <WidgetHeader>
        <WidgetTitle>Cuenta por Cobrar</WidgetTitle>        <BalanceBadge>
          <BalanceLabel>Monto Pendiente</BalanceLabel>
          <BalanceValue>{useFormatPrice(getPositive(currentBalance))}</BalanceValue>
        </BalanceBadge>
      </WidgetHeader>
      
      <WidgetContent>
        <InfoRow>
          <InfoItem>
            <InfoIcon><DollarOutlined /></InfoIcon>
            <InfoDetails>
              <InfoLabel>Total a Crédito</InfoLabel>
              <InfoValue>{useFormatPrice(getPositive(change))}</InfoValue>
            </InfoDetails>
          </InfoItem>
          
          <InfoItem>
            <InfoIcon><NumberOutlined /></InfoIcon>
            <InfoDetails>
              <InfoLabel>Cuotas</InfoLabel>
              <InfoValue>{totalInstallments || 1} {formatFrequency(paymentFrequency)}</InfoValue>
            </InfoDetails>
          </InfoItem>
        </InfoRow>

        <InfoRow>
          <InfoItem>
            <InfoIcon><DollarOutlined /></InfoIcon>
            <InfoDetails>
              <InfoLabel>Monto/Cuota</InfoLabel>
              <InfoValue>{useFormatPrice(installmentAmount || 0)}</InfoValue>
            </InfoDetails>
          </InfoItem>
          
          <InfoItem>
            <InfoIcon><CalendarOutlined /></InfoIcon>
            <InfoDetails>
              <InfoLabel>Primer Pago</InfoLabel>
              <InfoValue>{getNextPaymentText()}</InfoValue>
            </InfoDetails>
          </InfoItem>        </InfoRow>

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
  background-color: white;
  border: 1px solid #dee2e6;
  border-radius: 12px;
  padding: 16px;
  margin-top: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;


`;

const WidgetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e9ecef;
`;

const WidgetTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  letter-spacing: 0.3px;
`;

const StatusBadge = styled.span`
  background: #d4edda;
  color: #155724;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const BalanceBadge = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
`;

const BalanceLabel = styled.span`
  font-size: 10px;
  color: #6c757d;
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
`;

const BalanceValue = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #856404;
  padding: 2px 6px;
  background: #fff3cd;
  border-radius: 6px;
  border: 1px solid #ffeaa7;
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

const BalanceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #fff3cd;
  border-radius: 8px;
  border-left: 3px solid #ffc107;
`;

const ActionButtonsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const InfoIcon = styled.div`
  color: #6c757d;
  font-size: 14px;
  flex-shrink: 0;
`;

const InfoDetails = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
`;

const InfoLabel = styled.span`
  font-size: 10px;
  color: #6c757d;
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
`;

const InfoValue = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.highlighted ? '#856404' : '#212529'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export default ReceivableWidget;
