import React, { useRef } from 'react';
import styled from 'styled-components';
import { Card, Table, Button } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import { useReactToPrint } from 'react-to-print';

const Container = styled.div`
  max-width: 50rem;
  margin: 0 auto;

  padding: 16px;
`;

const StyledCard = styled.div`

  padding: 2em;
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
  text-align: right;
  font-size: 14px;
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
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

const columns = [
  {
    title: 'CANT.',
    dataIndex: 'quantity',
    key: 'quantity',
  },
  {
    title: 'CODIGO',
    dataIndex: 'code',
    key: 'code',
  },
  {
    title: 'DESCRIPCION',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: 'PRECIO',
    dataIndex: 'price',
    key: 'price',
    align: 'right',
  },
  {
    title: 'DESCUENTO',
    dataIndex: 'discount',
    key: 'discount',
    align: 'right',
  },
  {
    title: 'ITBIS',
    dataIndex: 'itbis',
    key: 'itbis',
    align: 'right',
  },
  {
    title: 'TOTAL',
    dataIndex: 'total',
    key: 'total',
    align: 'right',
  },
];

const dataSource = [
  {
    key: '1',
    quantity: '10.00',
    code: '000047',
    description: 'PAN INTEGRAL',
    price: '50.85',
    discount: '0.00',
    itbis: '91.53',
    total: '600.03',
  },
  {
    key: '2',
    quantity: '10.00',
    code: '000100',
    description: 'PAN MEDIA VIGA',
    price: '55.08',
    discount: '0.00',
    itbis: '99.14',
    total: '649.94',
  },
];

function Template2() {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  return (
    <Container>
      <Button type="primary" onClick={handlePrint} style={{ marginBottom: '16px' }}>
        Imprimir
      </Button>
      <div ref={componentRef}>
        <StyledCard>

          <CompanyTitle>Productos D Salud Integral RV, S.R.L.</CompanyTitle>
          <HeaderInfo>
            <CompanyInfo>
              <p>Carret. Sánchez Km. 2 Canastica 5 C. R.D.</p>
              <p><FontAwesomeIcon icon={faPhone} /> 809-798-1848 / 809-527-7045</p>
              <p><FontAwesomeIcon icon={faEnvelope} /> productosdsalud@gmail.com</p>
              <p>RNC: 131041078</p>
            </CompanyInfo>
            <RightAlign>
              <p>Fecha: viernes, 6 septiembre, 2024</p>
              <p>Factura Proforma Crédito # 759</p>
            </RightAlign>
          </HeaderInfo>

          <CustomerInfo>
            
              <div>
                <p><strong>Cliente:</strong> Super Mercado Joselito</p>
                <p>Dirección: San Cristóbal</p>
                <p>RNC: 131041078</p>
              </div>
              <RightAlign>
                <p>Código: 341</p>
              </RightAlign>

            
          </CustomerInfo>

          <TableContainer>
            <Table size='small' columns={columns} dataSource={dataSource} pagination={false} bordered />
          </TableContainer>

          <FooterSection>
            <SignatureGroup>
              <Group>
                <TextWithUpLine
                  label={'Despachado Por:'}
                />
                <TextWithUpLine
                  label={'Recibido Conforme:'}
                />
              </Group>
              <Group>
                <div>
                  <p>Vendedor: 1 - VENTAS</p>
                </div>
                <div>
                  <p >COPIA</p>
                </div>
              </Group>
            </SignatureGroup>
            <TotalsContainer>
              <TotalRow>
                <span>Sub-Total:</span>
                <span className="value">1,059.30</span>
              </TotalRow>
              <TotalRow>
                <span>ITBIS:</span>
                <span className="value">190.67</span>
              </TotalRow>
              <TotalRow className="bold">
                <span>Total:</span>
                <span className="value">1,249.97</span>
              </TotalRow>
            </TotalsContainer>
          </FooterSection>
        </StyledCard>
      </div>
    </Container>
  );
}

export default Template2;

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