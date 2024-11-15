import styled from "styled-components";
import { truncateString } from "../../../../../../../../utils/text/truncateString";
import { useFormatPrice } from "../../../../../../../../hooks/useFormatPrice";
import { getProductsPrice, getProductsTax, getTotalDiscount } from "../../../../../../../../utils/pricing";

const PAYMENT_METHODS = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    card: 'Tarjeta',
};

export default function Footer({ business, data }) {

    const subtotal = getProductsPrice(data?.products || []);
    const discount = getTotalDiscount(subtotal, data?.discount?.value || 0);
    const totals = {
        subtotal: useFormatPrice(data?.totalPurchaseWithoutTaxes?.value || 0),
        discount: `-${useFormatPrice(discount || 0)}`,
        tax: useFormatPrice(data?.totalTaxes?.value || 0),
        delivery: useFormatPrice(data?.delivery?.value || 0),
        total: useFormatPrice(data?.totalPurchase?.value || 0),
    };

    return (
        <FooterSection>
            <Wrapper>
                <SignatureGroup>
                    <Group>
                        <TextWithUpLine label={'Despachado Por:'} />
                        <TextWithUpLine label={'Recibido Conforme:'} />
                    </Group>
                    <PaymentMethodsContainer>
                        <div>
                            {data?.seller?.name && <p>Vendedor: {data.seller.name}</p>}
                            {data?.paymentMethod?.length > 0 && (
                                <PaymentMethodsSection>
                                    <BoldText>Métodos de Pago:</BoldText>
                                    {data.paymentMethod.map(
                                        (method, index) =>
                                            method?.status && (
                                                <p key={index} style={{ margin: 0 }}>
                                                    {PAYMENT_METHODS[method.method.toLowerCase()] ||
                                                        method.method}
                                                    :  {useFormatPrice(method.value || 0)}
                                                    {method.reference && ` - Ref: ${method.reference}`}
                                                </p>
                                            )
                                    )}
                                </PaymentMethodsSection>
                            )}
                        </div>
                        <div>
                            <p>{data?.copyType || 'COPIA'}</p>
                        </div>
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
    )

}

const TextWithUpLine = ({ label }) => {
    return (
        <p
            style={{
                padding: '0.2em',
                width: '100%',
                marginTop: '1em',
                marginBottom: '0.2em',
                fontWeight: '500',
                color: '#1d1d1d',
                borderTop: '1px solid #1f1f1f',
            }}
        >
            {label}
        </p>
    );
};
const Group = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  column-gap: 2em;

`;

const PaymentMethodsContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 0.4fr;
    `
const SignatureGroup = styled.div`
    display: grid;
  `;

const FooterSection = styled.div`
display: grid;
gap: 2em;
padding: 0 1em 1em 1em;
padding-top: 32px;
font-size: 0.875rem;
/* border: 1px solid red; */
`;

const TotalsContainer = styled.div`
/* display: grid; */

`;

const PaymentMethodsSection = styled.div`
  /* margin-top: 1em; */
  font-size: 14px;
`;

const TotalRow = styled.div`
display: grid;
grid-template-columns: 1fr 1fr;
font-size: 14px;
gap: 1em;

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
const BoldText = styled.p`
  font-weight: bold;
  font-size: 14px;
`;

const Wrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr 0.6fr;
    column-gap: 1em;
    align-items: end;
    `;