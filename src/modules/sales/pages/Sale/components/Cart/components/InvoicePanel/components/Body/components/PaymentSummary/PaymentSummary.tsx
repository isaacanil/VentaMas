import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectCart } from '@/features/cart/cartSlice';
import {
  normalizeSupportedDocumentCurrency,
  type SupportedDocumentCurrency,
} from '@/utils/accounting/currencies';
import { normalizeInvoiceChange } from '@/utils/invoice';
import { Showcase } from '@/components/ui/ShowCase/ShowCase';

export const PaymentSummary = () => {
  const cart = useSelector(selectCart) as {
    data?: {
      payment?: { value?: number };
      change?: { value?: number };
      documentCurrency?: SupportedDocumentCurrency;
    };
  };
  const cartData = cart.data;
  const total = cartData?.payment?.value ?? 0;
  const change = normalizeInvoiceChange(cartData?.change?.value ?? 0);
  const documentCurrency = normalizeSupportedDocumentCurrency(
    cartData?.documentCurrency,
  );
  const isChangeNegative = change < 0;
  return (
    <Container>
      <Showcase
        title="Total Pagado"
        valueType="price"
        value={total}
        priceCurrency={documentCurrency}
      />
      <Showcase
        title={isChangeNegative ? 'Faltante' : 'Devuelta'}
        valueType="price"
        value={change}
        color={true}
        priceCurrency={documentCurrency}
      />
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6em;
`;
