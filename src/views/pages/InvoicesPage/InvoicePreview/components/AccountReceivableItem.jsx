import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tag, Collapse } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import styled from 'styled-components';

import { useFbGetAccountReceivablePayments } from '../../../../../firebase/accountsReceivable/useFbGetAccountReceivablePayments';
import { Payment } from '../../../Contact/Client/components/ClientForm/components/ClientFinancialInfo/AccountCard/components/Payment';

import { formatPrice } from '@/utils/format';

const { Panel } = Collapse;

export const AccountReceivableItem = ({ ar, client }) => {
    const { payments } = useFbGetAccountReceivablePayments(ar.id);
    const paidInstallmentsCount = ar.paidInstallments?.length || 0;
    const totalInstallments = ar.totalInstallments || 0;

    return (
        <AccountItemContainer>
            <ItemHeader>
                <ItemTitle>Cuenta #{ar.numberId || 'N/A'}</ItemTitle>
                <StatusTag color={ar.arBalance === 0 ? 'green' : 'volcano'}>
                    {ar.arBalance === 0 ? 'Pagada' : 'Pendiente'}
                </StatusTag>
            </ItemHeader>
            <ItemDetails>
                <ItemDetail>
                    <DetailLabel>Cuota:</DetailLabel>
                    <DetailValue>{formatPrice(ar.installmentAmount || 0)}</DetailValue>
                </ItemDetail>
                <ItemDetail>
                    <DetailLabel>Pagadas:</DetailLabel>
                    <DetailValue>
                        {paidInstallmentsCount}/{totalInstallments}
                    </DetailValue>
                </ItemDetail>
                <ItemDetail>
                    <DetailLabel>Balance Pendiente:</DetailLabel>
                    <DetailValue highlight>{formatPrice(ar.arBalance)}</DetailValue>
                </ItemDetail>
                <ItemDetail>
                    <DetailLabel>Fecha:</DetailLabel>
                    <DetailValue>
                        {ar.createdAt?.seconds
                            ? dayjs(new Date(ar.createdAt.seconds * 1000)).format('DD/MM/YYYY')
                            : 'N/A'}
                    </DetailValue>
                </ItemDetail>
                <ItemDetail>
                    <DetailLabel>Último Pago:</DetailLabel>
                    <DetailValue>
                        {ar.lastPaymentDate?.seconds
                            ? `${formatPrice(ar.lastPayment)} - ${dayjs(
                                new Date(ar.lastPaymentDate.seconds * 1000),
                            ).format('DD/MM/YYYY')}`
                            : 'N/A'}
                    </DetailValue>
                </ItemDetail>
            </ItemDetails>

            <ActionBar>
                <Payment
                    installmentAmount={ar.installmentAmount}
                    installments={totalInstallments}
                    lastPayment={ar.lastPayment}
                    lastPaymentDate={ar.lastPaymentDate}
                    isActive={ar.isActive}
                    balance={ar.arBalance}
                    account={ar}
                    client={client}
                />
            </ActionBar>

            {payments.length > 0 && (
                <PaymentHistory>
                    <Collapse ghost size="small">
                        <Panel
                            header={
                                <HistoryHeader>
                                    <FontAwesomeIcon icon={faHistory} />
                                    Historial de Pagos ({payments.length})
                                </HistoryHeader>
                            }
                            key="1"
                        >
                            <HistoryList>
                                {payments.map((payment) => {
                                    const paymentDate = payment.date || payment.createdAt;
                                    const amount =
                                        payment.amount ??
                                        payment.totalPaid ??
                                        payment.paymentAmount ??
                                        0;
                                    const methods =
                                        payment.paymentMethod ||
                                        payment.paymentMethods ||
                                        [];
                                    const activeMethods = methods
                                        .filter((pm) => pm?.status && Number(pm?.value) > 0)
                                        .map((pm) => `${pm.method}: ${formatPrice(pm.value)}`);
                                    const methodLabel =
                                        activeMethods.length > 0
                                            ? activeMethods.join(', ')
                                            : 'N/A';
                                    return (
                                        <HistoryItem key={payment.id}>
                                            <HistoryDate>
                                                {paymentDate?.seconds
                                                    ? dayjs(new Date(paymentDate.seconds * 1000)).format('DD/MM/YYYY HH:mm')
                                                    : 'N/A'}
                                            </HistoryDate>
                                            <HistoryAmount>{formatPrice(amount)}</HistoryAmount>
                                            <HistoryMethod>{methodLabel}</HistoryMethod>
                                        </HistoryItem>
                                    );
                                })}
                            </HistoryList>
                        </Panel>
                    </Collapse>
                </PaymentHistory>
            )}
        </AccountItemContainer>
    );
};

const AccountItemContainer = styled.div`
  padding: 0.75rem;
  background: #f8f9fa;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
`;

const ItemTitle = styled.span`
  font-weight: 600;
  color: #333;
`;

const StatusTag = styled(Tag)`
  margin: 0;
`;

const ItemDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem 1rem;
`;

const ItemDetail = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const DetailLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: #666;
`;

const DetailValue = styled.span`
  font-size: 0.75rem;
  font-weight: ${props => props.highlight ? '700' : '500'};
  color: ${props => props.highlight ? '#cf1322' : '#333'};
`;

const ActionBar = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #e8e8e8;
`;

const PaymentHistory = styled.div`
  margin-top: 0.5rem;
  
  .ant-collapse-header {
    padding: 4px 0 !important;
  }
`;

const HistoryHeader = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const HistoryItem = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 0.5rem;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
`;

const HistoryDate = styled.span`
  font-size: 0.75rem;
  color: #666;
`;

const HistoryAmount = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: #2e7d32;
  text-align: right;
`;

const HistoryMethod = styled.span`
  font-size: 0.75rem;
  color: #666;
  text-align: right;
`;
