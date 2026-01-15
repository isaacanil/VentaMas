import {
  faPrint,
  faEdit,
  faEye,
  faUser,
  faReceipt,
  faCreditCard,
  faShoppingCart,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useRef } from 'react';
import type { InvoiceData } from '@/types/invoice';
import { useDispatch } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import styled from 'styled-components';


import { addInvoice } from '@/features/invoice/invoiceFormSlice';
import { openInvoicePreviewModal } from '@/features/invoice/invoicePreviewSlice';
import { formatPrice } from '@/utils/format';
import { formatLocaleDate } from '@/utils/date/dateUtils';
import {
  abbreviatePaymentMethods,
  getActivePaymentMethods,
  getInvoicePaymentInfo,
} from '@/utils/invoice';
import { prepareInvoiceForEdit } from '@/utils/invoice';
import { Receipt } from '@/modules/checkout/pages/checkout/Receipt';
import useInvoiceEditAuthorization from '@/modules/invoice/pages/InvoicesPage/hooks/useInvoiceEditAuthorization';
import { resolveTimestampSeconds } from '@/modules/invoice/pages/InvoicesPage/SalesAnalyticsPanel/utils';

type InvoiceItemProps = {
  data: InvoiceData;
};

export const InvoiceItem = ({ data }: InvoiceItemProps) => {
  const componentToPrintRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const paymentInfo = getInvoicePaymentInfo(data);
  const isPaidInFull = paymentInfo.isPaidInFull;

  // Data extraction
  const numberID = data?.numberID;
  const ncf = data?.NCF;
  const client = data?.client || {};
  const date = data?.date;
  const delivery = data?.delivery;
  const totalPurchaseWithoutTaxes = data?.totalPurchaseWithoutTaxes;
  const discount = data?.discount;
  const totalTaxes = data?.totalTaxes;
  const totalPurchase = data?.totalPurchase;
  const totalShoppingItems = data?.totalShoppingItems;
  const methodActive = getActivePaymentMethods(data);
  const methodActiveArray = methodActive.split(', ');
  const paymentMethods = abbreviatePaymentMethods(methodActiveArray);

  const formatDate = (seconds?: number | null) => {
    if (!seconds) return formatLocaleDate(Date.now());
    const date = new Date(seconds * 1000);
    return formatLocaleDate(date, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  const dateSeconds = resolveTimestampSeconds(date ?? null);

  const handleRePrint = useReactToPrint({
    contentRef: componentToPrintRef,
  });

  const proceedToEdit = useCallback(
    (authorization: unknown) => {
      const preparedInvoice = prepareInvoiceForEdit(data);
      if (preparedInvoice) {
        dispatch(
          addInvoice({
            invoice: preparedInvoice,
            mode: 'edit',
            authorizationRequest: authorization || null,
          }),
        );
      }
    },
    [data, dispatch],
  );

  const { handleEdit, authorizationModal, isProcessing } =
    useInvoiceEditAuthorization({
      invoice: data,
      onAuthorized: proceedToEdit,
    });

  const handleViewMore = () => {
    dispatch(openInvoicePreviewModal(data));
  };

  return (
    <>
      <Receipt ref={componentToPrintRef} data={data} />
      <Card>
        <CardHeader>
          <InvoiceInfo>
            <InvoiceNumber>
              <FontAwesomeIcon icon={faReceipt} />
              <span>#{numberID}</span>
              {ncf && <NCFNumber>NCF: {ncf}</NCFNumber>}
            </InvoiceNumber>
            <ClientName>
              <FontAwesomeIcon icon={faUser} />
              <span>{client?.name || 'Generic Client'}</span>
            </ClientName>
          </InvoiceInfo>
          <HeaderMeta>
            <DateInfo>{formatDate(dateSeconds)}</DateInfo>
            <StatusTag $isPaid={isPaidInFull}>
              {isPaidInFull ? 'Pagada' : 'Pago parcial'}
            </StatusTag>
          </HeaderMeta>
        </CardHeader>

        <FinancialDetails>
          <DetailsRow>
            <DetailItem>
              <DetailLabel>Subtotal:</DetailLabel>
              <DetailValue>
                {formatPrice(totalPurchaseWithoutTaxes?.value)}
              </DetailValue>
            </DetailItem>

            <DetailItem>
              <DetailLabel>Descuento:</DetailLabel>
              <DetailValue>{discount?.value || 0}%</DetailValue>
            </DetailItem>

            <DetailItem>
              <DetailLabel>Delivery:</DetailLabel>
              <DetailValue>{formatPrice(delivery?.value || 0)}</DetailValue>
            </DetailItem>

            <DetailItem>
              <DetailLabel>Itbis:</DetailLabel>
              <DetailValue>{formatPrice(totalTaxes?.value)}</DetailValue>
            </DetailItem>
          </DetailsRow>

          <SummaryRow>
            <SummaryInfo>
              <ItemCount>
                <FontAwesomeIcon icon={faShoppingCart} />
                <span>Items: {totalShoppingItems?.value}</span>
              </ItemCount>
              <PaymentMethod>
                <FontAwesomeIcon icon={faCreditCard} />
                <span>{paymentMethods}</span>
              </PaymentMethod>
            </SummaryInfo>
          </SummaryRow>
        </FinancialDetails>

        <ActionBar>
          <TotalsBlock>
            <TotalLabel>Total</TotalLabel>
            <TotalAmount>{formatPrice(totalPurchase?.value)}</TotalAmount>
            <PaymentProgress>
              <PaymentLine>
                <PaymentDot />
                <span>Pagado: {formatPrice(paymentInfo.paid)}</span>
              </PaymentLine>
              {!isPaidInFull && (
                <PaymentLine>
                  <PaymentDot $type="pending" />
                  <span>
                    Pendiente: {formatPrice(paymentInfo.pending)}
                  </span>
                </PaymentLine>
              )}
            </PaymentProgress>
          </TotalsBlock>
          <ActionButtons>
            <ActionButton
              onClick={handleEdit}
              disabled={isProcessing}
              variant="edit"
            >
              <FontAwesomeIcon icon={faEdit} />
            </ActionButton>
            <ActionButton onClick={handleRePrint} variant="print">
              <FontAwesomeIcon icon={faPrint} />
            </ActionButton>
            <ActionButton onClick={handleViewMore} variant="more">
              <FontAwesomeIcon icon={faEye} />
            </ActionButton>
          </ActionButtons>
        </ActionBar>
      </Card>
      {authorizationModal}
    </>
  );
};

const Card = styled.div`
  padding: 12px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
  transition: all 0.2s ease;

  &:hover {
    border-color: #d9d9d9;
    box-shadow: 0 2px 8px rgb(0 0 0 / 12%);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
`;

const InvoiceInfo = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const InvoiceNumber = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;

  svg {
    font-size: 12px;
    color: #666;
  }
`;

const NCFNumber = styled.span`
  padding: 2px 6px;
  margin-left: 4px;
  font-size: 11px;
  font-weight: 400;
  color: #666;
  background: #f5f5f5;
  border-radius: 3px;
`;

const ClientName = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  color: #666;

  svg {
    font-size: 11px;
    color: #999;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const HeaderMeta = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
`;

const DateInfo = styled.div`
  font-size: 11px;
  color: #999;
  white-space: nowrap;
`;

const StatusTag = styled.div`
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${({ $isPaid }: { $isPaid: boolean }) =>
    $isPaid
      ? `
    background: #f6ffed;
    color: #389e0d;
    border: 1px solid #b7eb8f;
  `
      : `
    background: #fff7e6;
    color: #d48806;
    border: 1px solid #ffd591;
  `}
`;

const FinancialDetails = styled.div`
  margin-bottom: 12px;
`;

const DetailsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 8px;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const DetailLabel = styled.span`
  margin-bottom: 2px;
  font-size: 10px;
  font-weight: 500;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const DetailValue = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: #333;
`;

const SummaryRow = styled.div`
  padding: 3px 10px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
`;

const SummaryInfo = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
`;

const ItemCount = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: #666;

  svg {
    font-size: 10px;
    color: #999;
  }
`;

const PaymentMethod = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: #666;

  svg {
    font-size: 10px;
    color: #52c41a;
  }

  span {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const TotalAmount = styled.div`
  flex-shrink: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  text-align: left;
`;

const ActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TotalsBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const TotalLabel = styled.span`
  font-size: 11px;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const PaymentProgress = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PaymentLine = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #595959;
`;

const PaymentDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $type }: { $type?: string }) => ($type === 'pending' ? '#d4380d' : '#52c41a')};
  box-shadow: 0 0 0 1px
    ${({ $type }: { $type?: string }) =>
    $type === 'pending'
      ? 'rgba(212, 56, 13, 0.35)'
      : 'rgba(82, 196, 26, 0.35)'};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 6px;
`;

const ActionButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  ${({ variant }: { variant?: 'edit' | 'print' | 'more' }) => {
    switch (variant) {
      case 'edit':
        return `
          background: #fff;
          border-color: #d9d9d9;
          color: #666;
          
          &:hover {
            background: #f5f5f5;
            border-color: #999;
            color: #333;
          }
        `;
      case 'print':
        return `
          background: #1890ff;
          border-color: #1890ff;
          color: white;
          
          &:hover {
            background: #40a9ff;
            border-color: #40a9ff;
          }
        `;
      case 'more':
        return `
          background: #fff;
          border-color: #d9d9d9;
          color: #666;
          
          &:hover {
            background: #f5f5f5;
            border-color: #999;
            color: #333;
          }
        `;
      default:
        return '';
    }
  }}

  &:active {
    transform: scale(0.95);
  }

  svg {
    font-size: 12px;
  }
`;
