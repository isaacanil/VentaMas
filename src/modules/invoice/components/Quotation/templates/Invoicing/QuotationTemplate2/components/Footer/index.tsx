import styled from 'styled-components';

import { formatPrice } from '@/utils/format';
import type { QuotationData } from '@/pdf/invoicesAndQuotation/types';
import type { InvoiceBusinessInfo } from '@/types/invoice';
import { getInvoiceTotalsSnapshot } from '@/utils/invoice/totals';


type FooterProps = {
  business?: InvoiceBusinessInfo | null;
  data?: QuotationData | null;
};

export default function Footer({ data }: FooterProps) {
  const totalsSnapshot = getInvoiceTotalsSnapshot(data);
  const subtotalValue =
    data?.totalPurchaseWithoutTaxes?.value ?? totalsSnapshot.subtotal;
  const taxValue = data?.totalTaxes?.value ?? totalsSnapshot.totalTaxes;
  const deliveryValue = data?.delivery?.value ?? totalsSnapshot.delivery;
  const totalValue = data?.totalPurchase?.value ?? totalsSnapshot.totalPurchase;
  const totals = {
    subtotal: formatPrice(subtotalValue),
    discount: `-${formatPrice(totalsSnapshot.generalDiscount || 0)}`,
    tax: formatPrice(taxValue),
    delivery: formatPrice(deliveryValue),
    total: formatPrice(totalValue),
  };

  return (
    <FooterSection>
      <Wrapper>
        <SignatureGroup>
          {/* <Group>
                        <TextWithUpLine label={'Despachado Por:'} />
                        <TextWithUpLine label={'Recibido Conforme:'} />
                    </Group> */}
          <PaymentMethodsContainer>
            <div>
              {/* {data?.seller?.name && <p>Vendedor: {data.seller.name}</p>} */}
              {/* {data?.paymentMethod?.length > 0 && (
                                <PaymentMethodsSection>
                                    <BoldText>Métodos de Pago:</BoldText>
                                    {data.paymentMethod.map(
                                        (method, index) =>
                                            method?.status && (
                                                <p key={index} style={{ margin: 0 }}>
                                                    {PAYMENT_METHODS[method.method.toLowerCase()] ||
                                                        method.method}
                                                    :  {formatPrice(method.value || 0)}
                                                    {method.reference && ` - Ref: ${method.reference}`}
                                                </p>
                                            )
                                    )}
                                </PaymentMethodsSection>
                            )} */}
            </div>
            {/* <div>
                            <p>{data?.copyType || 'COPIA'}</p>
                        </div> */}
          </PaymentMethodsContainer>
        </SignatureGroup>
        <TotalsContainer>
          <TotalRow>
            <span>Sub-Total:</span>
            <span className="value">{totals.subtotal}</span>
          </TotalRow>
          <TotalRow>
            <span>ITBIS:</span>
            <span className="value">{totals.tax}</span>
          </TotalRow>
          {data?.discount?.value ? (
            <TotalRow>
              <span>Descuento (%{data?.discount?.value}):</span>
              <span className="value">{totals.discount}</span>
            </TotalRow>
          ) : null}
          {data?.delivery?.status && (
            <TotalRow>
              <span>Delivery :</span>
              <span className="value"> {totals.delivery}</span>
            </TotalRow>
          )}
          <TotalRow className="bold">
            <span>Total:</span>
            <span className="value">{totals.total}</span>
          </TotalRow>
        </TotalsContainer>
      </Wrapper>
      {/* {truncateString(business?.invoice?.invoiceMessage, 200)} */}
      {/* {business?.invoice?.invoiceMessage && (
                <p>{business.invoice.invoiceMessage}</p>
            )} */}
    </FooterSection>
  );
}

const PaymentMethodsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 0.4fr;
`;
const SignatureGroup = styled.div`
  display: grid;
`;

const FooterSection = styled.div`
  display: grid;
  gap: 2em;
  padding: 0 1em 1em;
  padding-top: 32px;
  font-size: 0.875rem;

  /* border: 1px solid red; */
`;

const TotalsContainer = styled.div`
  /* display: grid; */
`;

const TotalRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1em;
  font-size: 14px;

  span {
    white-space: nowrap;
  }

    &.bold {
    font-weight: bold;
  }

  .value {
    text-align: right;
  }
`;
const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 0.6fr;
  column-gap: 1em;
  align-items: end;
`;
