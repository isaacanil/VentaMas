// ARSummaryModal.js

import { Alert, Badge, Modal, Spin } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { useAccountingRolloutEnabled } from '@/hooks/useAccountingRolloutEnabled';
import { useOpenAccountingEntry } from '@/modules/accounting/hooks/useOpenAccountingEntry';
import type {
  AccountsReceivableDoc,
  AccountsReceivableSummaryView,
  ReceivableClient,
  ReceivableInvoiceData,
} from '@/utils/accountsReceivable/types';
import type { UserIdentity } from '@/types/users';
import { toNumber } from '@/utils/number/toNumber';
import { isPreorderDocument } from '@/utils/invoice/documentIdentity';
import {
  ACCOUNT_RECEIVABLE_DETAIL_QUERY_PARAM,
  buildAccountReceivableListUrl,
} from '@/modules/accountsReceivable/utils/accountReceivableNavigation';

import ActionButtons from './components/ActionButtons';
import ContextPanels from './components/ContextPanels';
import HeroKPIs from './components/HeroKPIs';
import InstallmentSchedule from './components/InstallmentSchedule';
import PaymentHistory from './components/PaymentHistory';
import Timeline from './components/Timeline';
import { getNextPaymentInfo } from './utils';

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  background: #fff;
 
`;

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
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

const StatusPill = styled.span<{
  $bg?: string;
  $color?: string;
  $border?: string;
}>`
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
  const openAccountingEntry = useOpenAccountingEntry();
  const businessID = user?.businessID;
  const isAccountingRolloutEnabled = useAccountingRolloutEnabled(businessID);
  const location = useLocation();
  const navigate = useNavigate();

  const data = useMemo<AccountsReceivableSummaryView>(() => {
    const clientSource = rawData?.client as
      | ReceivableClient
      | { client?: ReceivableClient; data?: ReceivableClient }
      | null
      | undefined;
    const client = (
      clientSource &&
      typeof clientSource === 'object' &&
      ('client' in clientSource || 'data' in clientSource)
        ? ((
            clientSource as {
              client?: ReceivableClient;
              data?: ReceivableClient;
            }
          ).client ??
          (
            clientSource as {
              client?: ReceivableClient;
              data?: ReceivableClient;
            }
          ).data ??
          null)
        : (clientSource ?? null)
    ) as ReceivableClient | null;

    const invoiceSource = rawData?.invoice as
      | ReceivableInvoiceData
      | { data?: ReceivableInvoiceData; invoice?: ReceivableInvoiceData }
      | null
      | undefined;
    const invoice = (
      invoiceSource &&
      typeof invoiceSource === 'object' &&
      ('data' in invoiceSource || 'invoice' in invoiceSource)
        ? ((
            invoiceSource as {
              data?: ReceivableInvoiceData;
              invoice?: ReceivableInvoiceData;
            }
          ).data ??
          (
            invoiceSource as {
              data?: ReceivableInvoiceData;
              invoice?: ReceivableInvoiceData;
            }
          ).invoice ??
          null)
        : (invoiceSource ?? null)
    ) as ReceivableInvoiceData | null;

    const ar = (rawData?.ar?.ar ||
      rawData?.ar ||
      null) as AccountsReceivableDoc | null;
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
    if (isOpen && businessID && arId) {
      dispatch(
        fetchAccountReceivableDetails({ arId, businessID }),
      );
    }
  }, [arId, businessID, dispatch, isOpen]);

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

    if (location.pathname === buildAccountReceivableListUrl()) {
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.has(ACCOUNT_RECEIVABLE_DETAIL_QUERY_PARAM)) {
        searchParams.delete(ACCOUNT_RECEIVABLE_DETAIL_QUERY_PARAM);
        const nextSearch = searchParams.toString();
        navigate(
          {
            pathname: location.pathname,
            search: nextSearch ? `?${nextSearch}` : '',
          },
          { replace: true },
        );
      }
    }

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
  const invoiceLike = data.invoice as Parameters<typeof isPreorderDocument>[0];
  const stillPreorder = isPreorderDocument(invoiceLike);
  const preorderNum =
    data.invoice?.preorderDetails?.numberID ??
    data.invoice?.preorderDetails?.number;
  const invoiceNum =
    data.invoice?.numberID ||
    data.invoice?.number ||
    data.ar?.numberId ||
    'N/A';
  // Si sigue siendo preventa, mostrar número de preventa; si ya es factura, mostrar número de factura
  const invoiceNumber = stillPreorder
    ? (preorderNum ?? invoiceNum)
    : invoiceNum;
  const documentLabel = stillPreorder ? 'Preventa' : 'Factura';
  const invoiceDate = data.invoice?.date || data.ar?.createdAt;
  const clientName = data?.client?.name || 'Cliente Desconocido';

  const nextPaymentInfo = useMemo(() => getNextPaymentInfo(data), [data]);

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
          clientName: data?.client?.name,
          clientCode:
            data?.client?.numberId ?? data?.client?.id ?? data?.ar?.clientId,
          documentLabel,
          documentNumber: invoiceNumber,
          preorderNumber: preorderNum,
          invoiceNumber: invoiceNum,
        },
      }),
    );
  };

  const handleOpenAccountingEntry = () => {
    const invoiceId = data.ar?.invoiceId;
    if (!invoiceId || stillPreorder || !isAccountingRolloutEnabled) return;

    openAccountingEntry({
      eventType: 'invoice.committed',
      sourceDocumentId: invoiceId,
      sourceDocumentType: 'invoice',
    });
  };

  // paymentMethodsText moved to PaymentHistory component

  return (
    <Modal
      title="Resumen de Cuenta por Cobrar"
      open={isOpen}
      onCancel={handleCloseModal}
      footer={null}
      width={900}
      centered
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

            </div>
            <div className="actions">
              <ActionButtons
                data={data}
                onOpenAccountingEntry={
                  isAccountingRolloutEnabled &&
                  !stillPreorder &&
                  Boolean(data.ar?.invoiceId)
                    ? handleOpenAccountingEntry
                    : undefined
                }
                onPay={handleOpenPayment}
              />
            </div>
          </HeaderBar>

          <HeroKPIs data={data} />
          <ContextPanels data={data} />
          <Timeline data={data} />
          <InstallmentSchedule data={data} />
          <PaymentHistory
            allowAccountingNavigation={isAccountingRolloutEnabled}
            data={data}
          />
        </ModalContent>
      )}
    </Modal>
  );
}
