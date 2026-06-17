import { CreditCardOutlined } from '@/constants/icons/antd';
import React from 'react';
import { useSelector } from 'react-redux';

import { SelectCartData } from '@/features/cart/cartSlice';
import { normalizeSupportedDocumentCurrency } from '@/utils/accounting/currencies';
import { formatPriceByCurrency } from '@/utils/format';

import {
  Amount,
  CardContent,
  CardHeader,
  CardTitle,
  CreditNoteItem,
  ItemInfo,
  NCF,
  SummaryCard,
  SummaryDivider,
  SummaryInfo,
  SummaryLabel,
  SummaryRow,
  SummaryValue,
  TotalAmount,
} from './CreditNotesSummary.styles';

import type { SupportedDocumentCurrency } from '@/types/products';

type CreditNoteSummaryItem = {
  id?: string | number;
  ncf?: string;
  amountUsed?: number;
};

type CreditNotesSummaryProps = {
  selectedCreditNotes?: CreditNoteSummaryItem[];
  totalPurchase?: number;
};

const EMPTY_CREDIT_NOTES: CreditNoteSummaryItem[] = [];

export const CreditNotesSummary = ({
  selectedCreditNotes = EMPTY_CREDIT_NOTES,
  totalPurchase = 0,
}: CreditNotesSummaryProps) => {
  const cartData = useSelector(SelectCartData) as {
    documentCurrency?: SupportedDocumentCurrency;
  } | null;
  const documentCurrency: SupportedDocumentCurrency =
    normalizeSupportedDocumentCurrency(cartData?.documentCurrency);

  if (!selectedCreditNotes.length) {
    return null;
  }

  const totalCreditNoteAmount = selectedCreditNotes.reduce(
    (sum, note) => sum + (note.amountUsed || 0),
    0,
  );

  return (
    <SummaryCard>
      <CardHeader>
        <CardTitle>
          <CreditCardOutlined />
          Notas de Crédito Aplicadas
        </CardTitle>
        <TotalAmount>
          {formatPriceByCurrency(totalCreditNoteAmount, documentCurrency)}
        </TotalAmount>
      </CardHeader>

      <CardContent>
        {selectedCreditNotes.map((note, index) => (
          <CreditNoteItem key={note.id || index}>
            <ItemInfo>
              <NCF>{note.ncf || 'N/A'}</NCF>
              <Amount>
                {formatPriceByCurrency(note.amountUsed || 0, documentCurrency)}
              </Amount>
            </ItemInfo>
          </CreditNoteItem>
        ))}

        <SummaryDivider />

        <SummaryInfo>
          <SummaryRow>
            <SummaryLabel>Total Aplicado:</SummaryLabel>
            <SummaryValue>
              {formatPriceByCurrency(totalCreditNoteAmount, documentCurrency)}
            </SummaryValue>
          </SummaryRow>
          <SummaryRow>
            <SummaryLabel>Restante a Pagar:</SummaryLabel>
            <SummaryValue>
              {formatPriceByCurrency(
                Math.max(0, totalPurchase - totalCreditNoteAmount),
                documentCurrency,
              )}
            </SummaryValue>
          </SummaryRow>
        </SummaryInfo>
      </CardContent>
    </SummaryCard>
  );
};
