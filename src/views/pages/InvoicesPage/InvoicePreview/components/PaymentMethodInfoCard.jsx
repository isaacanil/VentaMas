import React from 'react';
import styled from 'styled-components';
import { Card, Divider, Tag } from 'antd';
import { formatPrice } from '../../../../../utils/formatPrice';
import dayjs from 'dayjs';

const paymentmethodLabel = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    creditNote: 'Nota de Crédito'
};

export const PaymentMethodInfoCard = ({ paymentMethod, creditNoteApplications = [] }) => {
  const activePaymentMethods = paymentMethod.filter(method => method.status);
  
  return (
    <StyledCard>
      <CardHeader>
        <CardTitle>Método de Pago</CardTitle>
      </CardHeader>
      
      <CardContent>
        {activePaymentMethods.map((method, index) => (
          <PaymentMethodSection key={index}>
            <MethodHeader>
              <MethodName>{paymentmethodLabel[method.method] || method.method}</MethodName>
              <MethodAmount>{formatPrice(method.value || 0)}</MethodAmount>
            </MethodHeader>
            
            {/* Mostrar detalles adicionales para métodos que lo requieran */}
            {method.reference && (
              <MethodDetail>
                <DetailLabel>Referencia:</DetailLabel>
                <DetailValue>{method.reference}</DetailValue>
              </MethodDetail>
            )}
          </PaymentMethodSection>
        ))}
        
        {/* Sección detallada para notas de crédito */}
        {creditNoteApplications.length > 0 && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <SectionTitle>Notas de Crédito Aplicadas</SectionTitle>
            {creditNoteApplications.map((app, index) => (
              <CreditNoteSection key={app.id || index}>
                <CreditNoteHeader>
                  <CreditNoteNCF>{app.creditNoteNcf || 'N/A'}</CreditNoteNCF>
                  <CreditNoteAmount>{formatPrice(app.amountApplied || 0)}</CreditNoteAmount>
                </CreditNoteHeader>
                
                <CreditNoteDetails>
                  <CreditNoteDetail>
                    <DetailLabel>Aplicado:</DetailLabel>
                    <DetailValue>
                      {app.appliedAt?.seconds 
                        ? dayjs(new Date(app.appliedAt.seconds * 1000)).format('DD/MM/YYYY HH:mm')
                        : dayjs(app.appliedAt).format('DD/MM/YYYY HH:mm')
                      }
                    </DetailValue>
                  </CreditNoteDetail>
                  
                  {app.appliedBy?.displayName && (
                    <CreditNoteDetail>
                      <DetailLabel>Por:</DetailLabel>
                      <DetailValue>{app.appliedBy.displayName}</DetailValue>
                    </CreditNoteDetail>
                  )}
                  
                  <CreditNoteDetail>
                    <DetailLabel>Saldo:</DetailLabel>
                    <DetailValue>
                      {formatPrice(app.previousBalance)} → {formatPrice(app.newBalance)}
                    </DetailValue>
                  </CreditNoteDetail>
                </CreditNoteDetails>
              </CreditNoteSection>
            ))}
          </>
        )}
      </CardContent>
    </StyledCard>
  );
};

const StyledCard = styled(Card)`
  .ant-card-body {
    padding: 0;
  }
`;

const CardHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
`;

const CardContent = styled.div`
  padding: 1rem;
`;

const PaymentMethodSection = styled.div`
  border-radius: 6px;

`;

const MethodHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const MethodName = styled.span`
  font-weight: 600;
  color: #333;
  font-size: 0.800rem;
`;

const MethodAmount = styled.span`
  font-weight: 600;
  font-family: monospace;
  font-size: 0.800rem;
`;

const MethodDetail = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.25rem;
`;

const SectionTitle = styled.h4`
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
`;

const CreditNoteSection = styled.div`
  margin-bottom: 1rem;
  padding: 0.75rem;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #f8f9fa;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const CreditNoteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const CreditNoteNCF = styled.span`
  font-weight: 600;
  color: #333;
  font-family: monospace;
  font-size: 0.875rem;
`;

const CreditNoteAmount = styled.span`
  font-weight: 600;
  color: #1890ff;
  font-family: monospace;
  font-size: 0.875rem;
`;

const CreditNoteDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const CreditNoteDetail = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const DetailLabel = styled.span`
  font-size: 0.75rem;
  color: #666;
  min-width: 60px;
`;

const DetailValue = styled.span`
  font-size: 0.75rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;


