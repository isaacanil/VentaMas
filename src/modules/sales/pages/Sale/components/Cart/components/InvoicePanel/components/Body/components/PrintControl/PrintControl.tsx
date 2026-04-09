import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { SelectSettingCart } from '@/features/cart/cartSlice';
import InvoiceTemplates from '@/modules/invoice/components/Invoice/components/InvoiceTemplates/InvoiceTemplates';
import {
  DocumentCurrencySelector,
  type DocumentCurrencyContext,
} from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/DocumentCurrencySelector';

type PrintControlProps = {
  businessId?: string | null;
  onMonetaryContextChange?: (ctx: DocumentCurrencyContext) => void;
};

export const PrintControl = ({
  businessId,
  onMonetaryContextChange,
}: PrintControlProps) => {
  useSelector(SelectSettingCart); // printInvoice is now managed via InvoicePanel footer dropdown

  return (
    <Container>
      {businessId && onMonetaryContextChange && (
        <DocumentCurrencySelector
          businessId={businessId}
          onChange={onMonetaryContextChange}
        />
      )}
      <InvoiceTemplates previewInModal hidePreviewButton />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
