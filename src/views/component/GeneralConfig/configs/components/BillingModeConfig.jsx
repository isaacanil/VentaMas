
import { Radio, message, Card } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../features/auth/userSlice';
import { setBillingSettings } from '../../../../../firebase/billing/billingSetting';

const InnerCard = styled(Card)`
  margin-bottom: 16px;
  cursor: pointer;
  border: ${(props) => (props.selected ? '2px solid #1890ff' : '1px solid #f0f0f0')};
  background-color: ${(props) => (props.selected ? '#e6f7ff' : '#ffffff')};

  &:hover {
    border-color: #1890ff;
    background-color: #e6f7ff;
  }
`;

const ConfigItem = styled.div`
  padding-left: ${(props) => (props.level || 0) * 16}px;
  margin-bottom: 8px;
`;

const BillingModeConfig = ({ billingMode }) => {
  const user = useSelector(selectUser);

  const handleCardClick = async (value) => {
    try {
      await setBillingSettings(user, { billingMode: value }); 
    } catch {
      message.error('Error al guardar la configuración');
    }
  };

  return (
    <ConfigItem level={0}>
      <Radio.Group value={billingMode} style={{ width: '100%' }}>
        <InnerCard
          type="inner"
          selected={billingMode === 'direct'}
          onClick={() => handleCardClick('direct')}
          hoverable
        >
          <Radio value="direct">
            <strong>Facturación Directa</strong> (Predeterminada)
          </Radio>
          <p>Crea y emite la factura en el momento en que seleccionas los productos.</p>
        </InnerCard>
        <InnerCard
          type="inner"
          selected={billingMode === 'deferred'}
          onClick={() => handleCardClick('deferred')}
          hoverable
        >
          <Radio value="deferred">
            <strong>Facturación Diferida</strong>
          </Radio>
          <p>Registra las ventas como órdenes preliminares que puedes revisar, completar o cancelar antes de generar la factura final.</p>
        </InnerCard>
      </Radio.Group>
    </ConfigItem>
  );
};

export default BillingModeConfig;