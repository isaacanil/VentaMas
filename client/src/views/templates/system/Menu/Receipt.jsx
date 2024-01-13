import React from 'react';
import styled from 'styled-components';

const ReceiptWrapper = styled.div`
  width: 80mm;
  font-family: 'Courier New', Courier, monospace;
  font-size: 10px;
  text-align: left;
  white-space: pre; // Esto conserva los espacios y saltos de línea para el formato de monoespaciado
`;

const Title = styled.p`
  font-weight: bold;
  text-align: center;
`;

const Section = styled.div`
  margin-bottom: 5mm;
`;

const LineItem = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Footer = styled.div`

  margin-top: 5mm;
`;
const data = {
    storeName: "SUPERMERCADOS NACIONAL",
    address: "AV. ESTRELLA SADHALÁ, TEL: 226-8080",
    rnc: "101019921",
    authorization: "AUTORIZADO POR DGII",
    resolution: "Res DGII: 02-2009",
    resolutionDate: "Del: 02/02/2009",
    date: "07/01/24 11:02:57",
    ncf: "B0208579189000000000",
    customerNif: "00000000000",
    customerNcf: "NCF: B0208579189000000000",
    items: [
      {
        id: 1,
        description: "QUAKER AVENA INST",
        tax: "0.00",
        value: "94.95"
      },
      {
        id: 2,
        description: "CAPILO PRO ACEITE",
        tax: "25.16",
        value: "164.95"
      }
    ],
    total: "259.90",
    paymentMethod: "VISA",
    taxDetails: "Items con I1 son gravados con 16.00% ITBIS",
    totalTax: "25.16",
    savingsNote: "CON LAS TARJETAS SUMA CCN O PLUS CCN HUBIESE AHORRADO DESDE RD$ 13.00",
    thanksNote: "!!! GRACIAS POR SU COMPRA !!!",
    keepReceiptNote: "CONSERVE RECIBO PARA COMPARAR CON ESTADO DE CUENTA O PARA CAMBIOS O DEVOLUCIONES",
    contactNote: "ESCRIBENOS A soporte_supermercadonacional@ccn.net.do",
    supportWebsite: "soporte.supermercadonacional.com",
    attendedBy: "LE ATENDIO: LUIS FELIPE",
    companyNote: "UNA EMPRESA CCN",
  };
  

const Receipt = () => {
  return (
    <ReceiptWrapper>
    <Title>{data.storeName}</Title>
    <Section>
      {data.address}
  <p>RNC {data.rnc}</p>
      
    </Section>
    <Section>
      {data.authorization}
      <br />
      {data.resolution} {data.resolutionDate}
      <br />
      {data.date}
    </Section>
    <Section>
      NIF: {data.customerNif} NCF: {data.customerNcf}
    </Section>
    <Section>
      <Title>FACTURA PARA CONSUMIDOR FINAL</Title>
      <LineItem>
        <strong>DESCRIPCION</strong>
        <strong>ITBIS</strong>
        <strong>VALOR</strong>
      </LineItem>
      {data.items.map(item => (
        <LineItem key={item.id}>
          <span>{item.description}</span>
          <span>{item.tax}</span>
          <span>{item.value}</span>
        </LineItem>
      ))}
    </Section>
    <Section>
      <LineItem>
        <strong>TOTAL A PAGAR</strong>
        <span>{data.total}</span>
      </LineItem>
    </Section>
    <Section>
      {data.taxDetails}
      <br />
      ITBIS 18% {data.totalTax}
    </Section>
    <Footer>
        <p>

        </p>
      {data.thanksNote}
      <br />
      <p>

      {data.keepReceiptNote}
      </p>
      <br />
      {data.savingsNote}
      <br />
      {data.contactNote}
      <br />
      {data.supportWebsite}
      <br />
      {data.attendedBy}
      <br />
      {data.companyNote}
    </Footer>
  </ReceiptWrapper>)
};

export default Receipt;
