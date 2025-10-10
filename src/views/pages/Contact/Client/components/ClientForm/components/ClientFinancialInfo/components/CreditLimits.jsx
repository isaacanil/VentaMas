import { 
    faFileInvoice, 
    faCreditCard,
    faExclamationTriangle,
    faCheckCircle,
    faTimesCircle,
    faEdit
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as antd from 'antd';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../../../../features/auth/userSlice';
import { fbGetCreditLimit } from '../../../../../../../../../firebase/accountsReceivable/fbGetCreditLimit';
import {formatPrice} from '../../../../../../../../../utils/formatPrice';

import CreditLimitModal from './CreditLimitModal';


const { Alert, Button } = antd;

export const CreditLimits = ({ creditLimitForm, arBalance = 800, client }) => {
    const [invoiceStatus, setInvoiceStatus] = useState(false);
    const [creditLimitStatus, setCreditLimitStatus] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const user = useSelector(selectUser);
    const clientId = client.id;
    const queryClient = useQueryClient();
    
    const { data: creditLimitState, error, isLoading } = useQuery({
        queryKey: ['creditLimit', user, clientId],
        queryFn: () => fbGetCreditLimit({ user, clientId }),
        enabled: !!user && !!clientId,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (creditLimitState) {
            creditLimitForm.setFieldsValue(creditLimitState);
            setInvoiceStatus(creditLimitState?.invoice?.status);
            setCreditLimitStatus(creditLimitState?.creditLimit?.status);
        }
    }, [creditLimitState]);

    const handleEditLimits = () => {
        setModalVisible(true);
    };

    const handleModalSave = async (values) => {
        try {
            // Actualizar el formulario padre
            creditLimitForm.setFieldsValue(values);
            setInvoiceStatus(values.invoice?.status);
            setCreditLimitStatus(values.creditLimit?.status);
            
            // Invalidar la query para refrescar los datos
            queryClient.invalidateQueries(['creditLimit', user, clientId]);
        } catch (error) {
            console.error('Error updating form:', error);
        }
    };

    const handleModalClose = () => {
        setModalVisible(false);
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }
    
    if (error) {
        return <div>Error loading credit limit</div>;
    }

    // Función para obtener el ícono del crédito disponible
    const getCreditIcon = (availableCredit) => {
        if (availableCredit < 0) return faTimesCircle;
        if (availableCredit === 0) return faExclamationTriangle;
        return faCheckCircle;
    };
    
    return (
        <div>
            <Container>
                <Header>
                    <Title>Configuración de límites</Title>
                </Header>
                
                <SummaryGrid>
                    <SummaryCard>
                        <SummaryIcon>
                            <FontAwesomeIcon icon={faFileInvoice} />
                        </SummaryIcon>
                        <SummaryContent>
                            <SummaryLabel>Límite de facturas</SummaryLabel>
                            <SummaryValue>
                                {creditLimitState?.invoice?.status && creditLimitState?.invoice?.value 
                                    ? creditLimitState.invoice.value 
                                    : 'No configurado'
                                }
                            </SummaryValue>
                        </SummaryContent>
                        <EditButton onClick={handleEditLimits}>
                            <FontAwesomeIcon icon={faEdit} />
                        </EditButton>
                    </SummaryCard>

                    <SummaryCard>
                        <SummaryIcon>
                            <FontAwesomeIcon icon={faCreditCard} />
                        </SummaryIcon>
                        <SummaryContent>
                            <SummaryLabel>Límite de crédito</SummaryLabel>
                            <SummaryValue>
                                {creditLimitState?.creditLimit?.status && creditLimitState?.creditLimit?.value 
                                    ? formatPrice(creditLimitState.creditLimit.value)
                                    : 'No configurado'
                                }
                            </SummaryValue>
                        </SummaryContent>
                        <EditButton onClick={handleEditLimits}>
                            <FontAwesomeIcon icon={faEdit} />
                        </EditButton>
                    </SummaryCard>

                    {creditLimitState?.creditLimit?.status && creditLimitState?.creditLimit?.value && (
                        <SummaryCard>
                            <SummaryIcon creditValue={creditLimitState.creditLimit.value - arBalance}>
                                <FontAwesomeIcon 
                                    icon={getCreditIcon(creditLimitState.creditLimit.value - arBalance)} 
                                />
                            </SummaryIcon>
                            <SummaryContent>
                                <SummaryLabel>
                                    Crédito disponible
                                    {(() => {
                                        const availableCredit = creditLimitState.creditLimit.value - arBalance;
                                        if (availableCredit < 0) return ' (Sobregiro)';
                                        if (availableCredit === 0) return ' (Límite alcanzado)';
                                        return '';
                                    })()}
                                </SummaryLabel>
                                <SummaryValue creditValue={creditLimitState.creditLimit.value - arBalance}>
                                    {formatPrice(creditLimitState.creditLimit.value - arBalance || 0)}
                                </SummaryValue>
                            </SummaryContent>
                        </SummaryCard>
                    )}
                </SummaryGrid>
            </Container>

            <CreditLimitModal
                visible={modalVisible}
                onClose={handleModalClose}
                onSave={handleModalSave}
                initialValues={creditLimitState}
                client={client}
                arBalance={arBalance}
            />

            {/* Alerts */}
            {creditLimitState?.creditLimit?.status && (creditLimitState?.creditLimit?.value < arBalance) && (
                <Alert
                    message="Advertencia"
                    description="El límite de crédito es menor que el balance disponible."
                    type="warning"
                    showIcon
                    style={{ marginTop: 16 }}
                />
            )}
            
            {!creditLimitStatus && (
                <Alert
                    message="Advertencia"
                    description={`El límite de crédito no está activado para el cliente ${client.name}. No podrás usar las funcionalidades de cuentas por cobrar hasta que actives el límite de crédito.`}
                    type="warning"
                    showIcon
                    style={{ marginTop: 16 }}
                />
            )}
        </div>
    );
};

// Estilos con Styled Components
const Container = styled.div`
    border-radius: 6px;
    padding: 0px 12px 8px;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
`;

const Title = styled.h2`
    font-size: 1rem;
    font-weight: 500;
    color: ${({ theme }) => theme.text?.primary || 'rgba(0, 0, 0, 0.87)'};
    line-height: 1.4;
    margin: 0;
`;

const SummaryGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
`;

const SummaryCard = styled.div`
    display: flex;
    align-items: center;
    padding: 12px;
    background: ${({ theme }) => theme.bg?.light || '#ffffff'};
    border: 1px solid ${({ theme }) => theme.border?.light || '#e8e8e8'};
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
`;

const SummaryIcon = styled.div`
    font-size: 1rem;
    margin-right: 10px;
    line-height: 1;
    color: ${props => {
        if (props.creditValue !== undefined) {
            if (props.creditValue < 0) return '#ff4d4f';
            if (props.creditValue === 0) return '#faad14';
            return '#2e7d32';
        }
        return '#1890ff';
    }};
`;

const SummaryContent = styled.div`
    flex: 1;
`;

const SummaryLabel = styled.div`
    font-size: 0.75rem;
    color: ${({ theme }) => theme.text?.secondary || 'rgba(0, 0, 0, 0.54)'};
    font-weight: 500;
    line-height: 1.5;
    margin-bottom: 4px;
`;

const SummaryValue = styled.div`
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.4;
    color: ${props => {
        if (props.creditValue !== undefined) {
            // Para crédito disponible
            if (props.creditValue < 0) return '#d32f2f'; // Rojo más oscuro para negativo (sobregiro)
            if (props.creditValue === 0) return '#f57c00'; // Naranja más oscuro para cero
            return '#2e7d32'; // Verde más oscuro para positivo
        }
        return props.theme?.text?.primary || 'rgba(0, 0, 0, 0.87)'; // Color por defecto
    }};
`;

const EditButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px;
    margin-left: 8px;
    color: #666;
    font-size: 0.875rem;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
        color: #1890ff;
        background-color: #f0f0f0;
    }
    
    &:active {
        transform: scale(0.95);
    }
`;

