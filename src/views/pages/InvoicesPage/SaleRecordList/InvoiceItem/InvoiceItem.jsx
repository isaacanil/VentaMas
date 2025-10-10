import { 
  faPrint, 
  faEdit, 
  faEye, 
  faUser, 
  faReceipt,
  faCreditCard,
  faShoppingCart
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import styled from 'styled-components';

import { addInvoice } from '../../../../../features/invoice/invoiceFormSlice';
import { openInvoicePreviewModal } from '../../../../../features/invoice/invoicePreviewSlice';
import { useFormatPrice } from '../../../../../hooks/useFormatPrice';
import { abbreviatePaymentMethods, getActivePaymentMethods, isInvoicePaidInFull } from '../../../../../utils/invoice';
import { prepareInvoiceForEdit } from '../../../../../utils/invoice';
import { Receipt } from '../../../checkout/Receipt';
import useInvoiceEditAuthorization from '../../hooks/useInvoiceEditAuthorization.jsx';

export const InvoiceItem = ({ data }) => {
  const componentToPrintRef = useRef(null);
  const dispatch = useDispatch();
  const isCredit = isInvoicePaidInFull(data);
  
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

  const formatDate = (seconds) => {
    if (!seconds) return new Date().toLocaleDateString('es-ES');
    const date = new Date(seconds * 1000);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRePrint = useReactToPrint({
    content: () => componentToPrintRef.current,
  });

  const proceedToEdit = useCallback((authorization) => {
    const preparedInvoice = prepareInvoiceForEdit(data);
    if (preparedInvoice) {
      dispatch(
        addInvoice({
          invoice: preparedInvoice,
          mode: 'edit',
          authorizationRequest: authorization || null,
        })
      );
    }
  }, [data, dispatch]);

  const { handleEdit, authorizationModal, isProcessing } = useInvoiceEditAuthorization({
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
        {/* Header profesional */}
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
            <DateInfo>{formatDate(date?.seconds)}</DateInfo>
            <StatusTag $isCredit={isCredit}>
              {isCredit ? "Contado" : "Crédito"}
            </StatusTag>
          </HeaderMeta>
        </CardHeader>

        {/* Detalles financieros */}
        <FinancialDetails>
          <DetailsRow>
            <DetailItem>
              <DetailLabel>Subtotal:</DetailLabel>
              <DetailValue>{useFormatPrice(totalPurchaseWithoutTaxes?.value)}</DetailValue>
            </DetailItem>
            
            <DetailItem>
              <DetailLabel>Descuento:</DetailLabel>
              <DetailValue>{discount?.value || 0}%</DetailValue>
            </DetailItem>
            
            <DetailItem>
              <DetailLabel>Delivery:</DetailLabel>
              <DetailValue>{useFormatPrice(delivery?.value || 0)}</DetailValue>
            </DetailItem>
            
            <DetailItem>
              <DetailLabel>Itbis:</DetailLabel>
              <DetailValue>{useFormatPrice(totalTaxes?.value)}</DetailValue>
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

        {/* Total y Acciones */}
        <ActionBar>
          <TotalAmount>{useFormatPrice(totalPurchase?.value)}</TotalAmount>
          <ActionButtons>
            <ActionButton onClick={handleEdit} disabled={isProcessing} variant="edit">
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
  background: #ffffff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8e8e8;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: all 0.2s ease;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    border-color: #d9d9d9;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
`;

const InvoiceInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`;

const InvoiceNumber = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 15px;
  color: #1a1a1a;
  flex-wrap: wrap;
  
  svg {
    font-size: 12px;
    color: #666;
  }
`;

const NCFNumber = styled.span`
  font-size: 11px;
  color: #666;
  font-weight: 400;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  margin-left: 4px;
`;

const ClientName = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
  
  svg {
    font-size: 11px;
    color: #999;
  }
  
  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const HeaderMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
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
  
  ${({ $isCredit }) => $isCredit ? `
    background: #f6ffed;
    color: #389e0d;
    border: 1px solid #b7eb8f;
  ` : `
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
  font-size: 10px;
  color: #999;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 2px;
`;

const DetailValue = styled.span`
  font-size: 12px;
  color: #333;
  font-weight: 600;
`;

const SummaryRow = styled.div`
  background: #fafafa;
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
`;

const SummaryInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const ItemCount = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  
  svg {
    font-size: 10px;
    color: #999;
  }
`;

const PaymentMethod = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  
  svg {
    font-size: 10px;
    color: #52c41a;
  }
  
  span {
    max-width: 120px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const TotalAmount = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  text-align: left;
  flex-shrink: 0;
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  
  ${({ variant }) => {
    switch(variant) {
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




