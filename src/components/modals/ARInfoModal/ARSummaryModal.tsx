// ARSummaryModal.js
import {
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
} from '@/constants/icons/antd';
import { Alert, Badge, Modal, Spin } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { setAccountPayment } from '@/features/accountsReceivable/accountsReceivablePaymentSlice';
import {
  fetchAccountReceivableDetails,
  resetAR,
  selectARDetailsModal,
  selectARError,
  selectARInfo,
  selectARLoading,
  setARDetailsModal,
} from '@/features/accountsReceivable/accountsReceivableSlice';
import { selectUser } from '@/features/auth/userSlice';
import type {
  AccountsReceivableDoc,
  AccountsReceivableSummaryData,
  AccountsReceivableSummaryView,
  ReceivableClient,
  ReceivableInvoiceData,
} from '@/utils/accountsReceivable/types';
import type { UserIdentity } from '@/types/users';
import { toNumber } from '@/utils/number/toNumber';

import ActionButtons from './components/ActionButtons';
import ContextPanels from './components/ContextPanels';
import HeroKPIs from './components/HeroKPIs';
import InstallmentSchedule from './components/InstallmentSchedule';
import PaymentHistory from './components/PaymentHistory';
import Timeline from './components/Timeline';
import { StyledDivider } from './styles';
import { formatCurrency, formatDate, getNextPaymentInfo } from './utils';

// --- Styled Components ---

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    sans-serif;
  background: #ffffff;
  padding: 8px;
`;

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 4px 4px 12px;
  border-bottom: 1px solid #e8edf2;

  .title-block {
    display: flex;
    flex-direction: column;
    gap: 6px;

    h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: #1f1f1f;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 13px;
      color: #6b778c;
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const StatusPill = styled.span<{ $bg?: string; $color?: string; $border?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 99px;
  background: ${({ $bg }) => $bg || '#f5f5f5'};
  color: ${({ $color }) => $color || '#595959'};
  font-weight: 500;
  font-size: 12px;
  border: 1px solid ${({ $border }) => $border || 'transparent'};
`;

// Styled components moved to styles.js

// --- Main Component ---

export default function ARSummaryModal() {
  const dispatch = useDispatch();
  const rawData = useSelector(selectARInfo) as any;
  const { isOpen, arId } = useSelector(selectARDetailsModal) as {
    isOpen: boolean;
    arId?: string;
  };
  const loading = useSelector(selectARLoading) as boolean;
  const error = useSelector(selectARError) as string | null;
  const user = useSelector(selectUser) as UserIdentity | null;

  const data = useMemo<AccountsReceivableSummaryView>(() => {
    const clientSource = rawData?.client as
      | ReceivableClient
      | { client?: ReceivableClient; data?: ReceivableClient }
      | null
      | undefined;
    const client =
      (clientSource && typeof clientSource === 'object' && ('client' in clientSource || 'data' in clientSource)
        ? (clientSource as { client?: ReceivableClient; data?: ReceivableClient }).client ??
        (clientSource as { client?: ReceivableClient; data?: ReceivableClient }).data ??
        null
        : clientSource ?? null) as ReceivableClient | null;

    const invoiceSource = rawData?.invoice as
      | ReceivableInvoiceData
      | { data?: ReceivableInvoiceData; invoice?: ReceivableInvoiceData }
      | null
      | undefined;
    const invoice =
      (invoiceSource && typeof invoiceSource === 'object' && ('data' in invoiceSource || 'invoice' in invoiceSource)
        ? (invoiceSource as { data?: ReceivableInvoiceData; invoice?: ReceivableInvoiceData }).data ??
        (invoiceSource as { data?: ReceivableInvoiceData; invoice?: ReceivableInvoiceData }).invoice ??
        null
        : invoiceSource ?? null) as ReceivableInvoiceData | null;

    const ar = (rawData?.ar?.ar || rawData?.ar || null) as AccountsReceivableDoc | null;
    return {
      ...rawData,
      client: client ?? null,
      invoice: invoice ?? null,
      ar: ar ?? null,
      installments: rawData?.installments || [],
      payments: rawData?.payments || [],
    } as AccountsReceivableSummaryView;
  }, [rawData]);

  useEffect(() => {
    if (user?.businessID && arId) {
      dispatch(
        fetchAccountReceivableDetails({ arId, businessID: user.businessID }),
      );
    }
  }, [arId, user, dispatch]);

  useEffect(() => {
    if (!isOpen) return;
    // Debug: estructura completa del payload para revisar shape
    console.log('ARSummaryModal data snapshot', {
      arId,
      ar: data.ar,
      client: data.client,
      invoice: data.invoice,
      installments: data.installments,
      payments: data.payments,
    });
  }, [data, isOpen, arId]);

  const handleCloseModal = () => {
    dispatch(setARDetailsModal({ isOpen: false, arId: arId || '' }));
    setTimeout(() => {
      dispatch(resetAR());
    }, 300);
  };

  const balance = toNumber(
    data.ar?.arBalance ??
    data.ar?.currentBalance ??
    data.ar?.balance ??
    data.ar?.totalReceivable,
  );
  const totalAmount = toNumber(
    data.ar?.totalReceivable ??
    data.ar?.totalAmount ??
    (typeof data.invoice?.totalPurchase === 'object' && data.invoice?.totalPurchase !== null
      ? data.invoice.totalPurchase.value
      : data.invoice?.totalPurchase),
  );

  const invoiceNumber =
    data.invoice?.numberID ||
    data.invoice?.number ||
    data.ar?.numberId ||
    'N/A';
  const invoiceDate = data.invoice?.date || data.ar?.createdAt;
  const emissionDate = data.invoice?.emissionDate || invoiceDate; // Handle specific emission date if available
  const clientName = data?.client?.name || 'Cliente Desconocido';


  const nextPaymentInfo = useMemo(
    () => getNextPaymentInfo(data),
    [data],
  );

  const arStatus = data.ar?.isActive
    ? { label: 'Activa', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' }
    : { label: 'Cerrada', color: '#8c8c8c', bg: '#f5f5f5', border: '#d9d9d9' };

  const handleOpenPayment = () => {
    if (!data?.ar) return;

    const installmentAmount =
      toNumber(
        data.ar?.installmentAmount ??
        nextPaymentInfo?.amount ??
        data.installments?.[0]?.installmentAmount,
      ) || balance;

    dispatch(
      setAccountPayment({
        isOpen: true,
        paymentDetails: {
          clientId: data.ar?.clientId,
          arId: data.ar?.id || arId,
          paymentScope: 'account',
          paymentOption: 'installment',
          totalAmount: balance,
        },
        extra: {
          ...data.ar,
          arBalance: balance,
          installmentAmount,
        },
      }),
    );
  };

  // paymentMethodsText moved to PaymentHistory component

  return (
    <Modal
      title="Resumen de Cuenta por Cobrar"
      open={isOpen}
      onCancel={handleCloseModal}
      footer={null}
      width={1080}
      centered
      styles={{ body: { padding: '24px', background: '#ffffff' } }}
    >
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '64px 0',
          }}
        >
          <Spin size="large" tip="Cargando información...">
            <div style={{ width: 200, height: 140 }} />
          </Spin>
        </div>
      ) : error ? (
        <Alert
          message="Error al cargar"
          description={error}
          type="error"
          showIcon
        />
      ) : (
        <ModalContent>
          <HeaderBar>
            <div className="title-block">
              <h2>
                {clientName}
                <StatusPill
                  $bg={arStatus.bg}
                  $color={arStatus.color}
                  $border={arStatus.border}
                >
                  <Badge color={arStatus.color} dot />
                  {arStatus.label}
                </StatusPill>
              </h2>
              <div className="meta">
                <span>
                  <FileTextOutlined /> Factura #{invoiceNumber}
                </span>
                <span>
                  <CalendarOutlined /> Emisión: {formatDate(emissionDate)}
                </span>
                <span>
                  <DollarOutlined /> Total {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
            <div className="actions">
              <ActionButtons data={data} onPay={handleOpenPayment} />
            </div>
          </HeaderBar>

          <HeroKPIs data={data} />
          <ContextPanels data={data} />
          <Timeline data={data} />

          <StyledDivider />

          <InstallmentSchedule data={data} />

          <PaymentHistory data={data} />
        </ModalContent>
      )}
    </Modal>
  );
}
