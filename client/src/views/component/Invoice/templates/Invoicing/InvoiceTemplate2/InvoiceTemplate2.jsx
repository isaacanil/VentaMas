import React, { useRef } from 'react';
import styled from 'styled-components';
import { Card, Table, Button } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import { selectBusinessData } from '../../../../../../features/auth/businessSlice';
import { useSelector } from 'react-redux';


const Container = styled.div`
  width: 100%;
  margin: 0;
  height: 100%;
  padding: 16px;

  @media print {
    padding: 0;
    height: 100vh;
    background-color: red;
    width: 100vw;
    max-width: none;
  }
`;

const StyledCard = styled.div`
  display: grid;
  grid-template-rows: 1fr min-content;
  padding: 2em;
  height: 100%;

  @media print {
    padding: 20px;
    width: 100%;
    height: 100vh;
    page-break-after: always;
  }
`;

const HeaderInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const CompanyInfo = styled.div`
  line-height: 1.2;
  font-size: 14px;
  `;

const CustomerInfo = styled(CompanyInfo)`
display: grid;
grid-template-columns: 1fr 1fr;

`

const CompanyTitle = styled.h2`
  font-weight: bold;
  font-size: 1.25rem;
`;

const RightAlign = styled.div`
display: grid;
justify-content: end;
  text-align: right;
  font-size: 14px;
`;

const ComprobanteSection = styled.div`
  margin-top: 16px;
  font-size: 14px;
  text-align: right;
`;

const TableContainer = styled.div`
  margin-top: 16px;
`;

const FooterSection = styled.div`
display: grid;
gap: 2em;
grid-template-columns: 1fr 0.4fr;
  margin-top: 32px;
  font-size: 0.875rem;

`;

const TotalsContainer = styled.div`
  display: grid;
  gap: 0.5em;
`;

const TotalRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  font-size: 14px;
  gap: 1em;

  span{
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

const Title = styled.h1`

  font-size: 1.1rem;
  margin-bottom: 1rem;
`;

const columns = [
  {
    title: 'CANT.',
    dataIndex: 'amountToBuy',
    key: 'quantity',
  },
  {
    title: 'CODIGO',
    dataIndex: 'barcode',
    key: 'code',
  },
  {
    title: 'DESCRIPCION',
    dataIndex: 'name',
    key: 'description',
  },
  {
    title: 'PRECIO',
    dataIndex: 'pricing',
    key: 'price',
    align: 'right',
    render: (pricing) => pricing.price.toFixed(2),
  },
  {
    title: 'ITBIS',
    dataIndex: 'pricing',
    key: 'itbis',
    align: 'right',
    render: (pricing) => ((pricing.price * Number(pricing.tax)) / 100).toFixed(2),
  },
  {
    title: 'TOTAL',
    key: 'total',
    align: 'right',
    render: (_, record) => {
      const price = record.pricing.price;
      const tax = (price * Number(record.pricing.tax)) / 100;
      return ((price + tax) * record.amountToBuy).toFixed(2);
    },
  },
];

const LogoContainer = styled.div`
  max-width: 200px;
  height: 100px;
  margin-bottom: 1em;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: left center;
  }
`;

const PaymentMethodsSection = styled.div`
  margin-top: 1em;
  font-size: 14px;
`;

const getComprobanteInfo = (comprobante) => {
  if (!comprobante) {
    return {
      title: 'RECIBO DE PAGO',
      label: 'Número de Recibo'
    };
  }

  if (comprobante.startsWith('B01')) {
    return {
      title: 'FACTURA DE CRÉDITO FISCAL',
      label: 'NCF'
    };
  }

  if (comprobante.startsWith('B02')) {
    return {
      title: 'FACTURA DE CONSUMO',
      label: 'NCF'
    };
  }

  return {
    title: 'COMPROBANTE FISCAL',
    label: 'NCF'
  };
};

const PAYMENT_METHODS = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta'
};

export const InvoiceTemplate2 = React.forwardRef(({ data, ignoreHidden }, ref) => {

  const business = useSelector(selectBusinessData) || {};
  console.log(business)

  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    if (dateObj.seconds) {
      return new Date(dateObj.seconds * 1000).toLocaleDateString();
    }
    return '';
  };

  const totals = {
    subtotal: (data?.totalPurchaseWithoutTaxes?.value || 0).toFixed(2),
    tax: (data?.totalTaxes?.value || 0).toFixed(2),
    delivery: (data?.delivery?.value || 0).toFixed(2),
    total: (data?.totalPurchase?.value || 0).toFixed(2),
  };
  console.log('data ', data)

  const comprobanteInfo = getComprobanteInfo(data?.NCF);

  return (
    data ? (
      <Container style={{ display: ignoreHidden ? 'block' : 'none' }}>

        <StyledCard ref={ref}>
          <div>
            {business?.logoUrl && (
              <LogoContainer>
                <img src={business.logoUrl} alt="Company Logo" />
              </LogoContainer>
            )}

            <HeaderInfo>
              <CompanyInfo>
                <CompanyTitle>{business?.name || 'Ventamax Dev'}</CompanyTitle>
                <p>{business?.address}</p>
                <p><FontAwesomeIcon icon={faPhone} /> {business?.tel}</p>
                <p><FontAwesomeIcon icon={faEnvelope} /> {business?.email}</p>
                <p>RNC: {business?.rnc}</p>
              </CompanyInfo>
              <RightAlign>
                <Title>{comprobanteInfo.title}</Title>
                <p>Fecha: {formatDate(data?.date)}</p>
                <p>Factura {data?.type === 'preorder' ? 'Pedido' : data?.type} # {data?.numberID}</p>
                {data?.preorderDetails?.date && (
                  <p>Fecha de pedido: {formatDate(data?.preorderDetails?.date)}</p>
                )}
                {data?.dueDate && <p>Fecha que vence: {formatDate(data?.dueDate)}</p>}
                {data?.NCF && (
                  <ComprobanteSection>
                    <p>NCF: {data?.NCF}</p>
                  </ComprobanteSection>
                )}
              </RightAlign>
            </HeaderInfo>

            <CustomerInfo>
              <div>

                {data?.client?.name && <p><strong>Cliente:</strong> {data.client.name}</p>}
                {data?.client?.address && <p>Dirección: {data.client.address}</p>}
                {data?.client?.personalID && <p>RNC: {data.client.personalID}</p>}
                {data?.client?.tel && <p>Tel: {data.client.tel}</p>}
              </div>
              <RightAlign>
                {data?.comprobante && (
                  <p>{comprobanteInfo.label}: {data.comprobante}</p>
                )}
              </RightAlign>
            </CustomerInfo>


            <TableContainer>
              <Table
                size='small'
                columns={columns}
                dataSource={data?.products || []}
                pagination={false}
                bordered
              />
            </TableContainer>
          </div>

          <FooterSection>
            <SignatureGroup>
              <Group>
                <TextWithUpLine label={'Despachado Por:'} />
                <TextWithUpLine label={'Recibido Conforme:'} />
              </Group>
              <Group>
                <div>
                  {data?.seller?.name && <p>Vendedor: {data.seller.name}</p>}
                  {data?.paymentMethod?.length > 0 && (
                    <PaymentMethodsSection>
                      <BoldText>Métodos de Pago:</BoldText>
                      {data.paymentMethod.map((method, index) => (
                        method?.status && (
                          <p key={index}>
                            {PAYMENT_METHODS[method.method.toLowerCase()] || method.method}: RD$ {method.value?.toFixed(2)}
                            {method.reference && ` - Ref: ${method.reference}`}
                          </p>
                        )
                      ))}
                    </PaymentMethodsSection>
                  )}
                </div>
                <div>
                  <p>{data?.copyType || 'COPIA'}</p>
                </div>
              </Group>
            </SignatureGroup>
            <TotalsContainer>
              <TotalRow>
                <span>Sub-Total:</span>
                <span className="value">RD$ {totals.subtotal}</span>
              </TotalRow>
              <TotalRow>
                <span>ITBIS:</span>
                <span className="value">RD$ {totals.tax}</span>
              </TotalRow>
              {data?.delivery?.status && (
                <TotalRow>
                  <span>Delivery:</span>
                  <span className="value">RD$ {totals.delivery}</span>
                </TotalRow>
              )}
              <TotalRow className="bold">
                <span>Total:</span>
                <span className="value">RD$ {totals.total}</span>
              </TotalRow>
            </TotalsContainer>
            {business?.invoice?.invoiceMessage && <p>{business.invoice.invoiceMessage}</p>}
          </FooterSection>
        </StyledCard>
      </Container>
    ) : null
  );
});

const Group = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 2em;
`

const TextWithUpLine = ({ label }) => {
  return (
    <p
      style={{
        padding: "0.4em",
        width: "100%",
        marginTop: '1em',
        borderTop: '1px solid black'
      }}
    >{label}</p>
  )
}
const SignatureGroup = styled.div`
  display: grid;
`