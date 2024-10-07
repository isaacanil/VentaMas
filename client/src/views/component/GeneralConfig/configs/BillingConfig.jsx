// src/components/BillingConfig.jsx
import React, { useState } from 'react';
import * as antd from 'antd';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../features/auth/userSlice';
import { setBillingSettings } from '../../../../firebase/billing/billingSetting';
import { SelectSettingCart } from '../../../../features/cart/cartSlice';
const { Card, Radio, message } = antd;

// Estilos personalizados para el componente
const StyledCard = styled.div`
  margin-top: 16px;
`;

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

const BillingConfig = () => {

    const { billing: { billingMode } } = useSelector(SelectSettingCart)
    // const [billingMode, setBillingMode] = useState('direct');
    const user = useSelector(selectUser);

    const handleCardClick = async (value) => {
        // setBillingMode(value);
        try {
            await setBillingSettings(user, { billingMode: value }); // Llamada a la función de Firebase

        } catch (error) {

        }
    };

    return (
        <StyledCard title="Configuración de Ventas y Facturación" bordered={false}>
            <Radio.Group value={billingMode} style={{ width: '100%' }}>
                <InnerCard
                    type="inner"
                    selected={billingMode === 'direct'}
                    onClick={() => handleCardClick('direct')}
                    hoverable
                >
                    <Radio value="direct">
                        <strong> Facturación Directa </strong> (Predeterminada)
                    </Radio>
                    <p>
                    Crea y emite la factura en el momento en que seleccionas los productos. 
                    </p>
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
                    <p>
                        Registra las ventas como órdenes preliminares que puedes revisar, completar o cancelar antes de generar la factura final.
                    </p>
                </InnerCard>

            </Radio.Group>
        </StyledCard>
    );
};

export default BillingConfig;
