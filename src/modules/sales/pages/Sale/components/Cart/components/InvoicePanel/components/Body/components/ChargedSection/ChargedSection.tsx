import React from 'react';
import { useSelector } from 'react-redux';
import { selectCart } from '@/features/cart/cartSlice';
import {
  normalizeSupportedDocumentCurrency,
  type SupportedDocumentCurrency,
} from '@/utils/accounting/currencies';
import { Showcase } from '@/components/ui/ShowCase/ShowCase';

export const ChargedSection = () => {
  const cart = useSelector(selectCart) as {
    data?: {
      totalPurchase?: { value?: number };
      documentCurrency?: SupportedDocumentCurrency;
    };
  };
  const cartData = cart.data;
  const total = cartData?.totalPurchase?.value ?? 0;
  const documentCurrency = normalizeSupportedDocumentCurrency(
    cartData?.documentCurrency,
  );
  return (
    <Showcase
      title="Total a cobrar"
      valueType="price"
      value={total}
      priceCurrency={documentCurrency}
    />
  );
};
