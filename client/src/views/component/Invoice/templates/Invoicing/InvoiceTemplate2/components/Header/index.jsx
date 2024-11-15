import { faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled from "styled-components";

const getComprobanteInfo = (comprobante) => {
    if (!comprobante) {
        return {
            title: 'RECIBO DE PAGO',
            label: 'Número de Recibo',
        };
    }

    if (comprobante.startsWith('B01')) {
        return {
            title: 'FACTURA DE CRÉDITO FISCAL',
            label: 'NCF',
        };
    }

    if (comprobante.startsWith('B02')) {
        return {
            title: 'FACTURA DE CONSUMO',
            label: 'NCF',
        };
    }

    return {
        title: 'COMPROBANTE FISCAL',
        label: 'NCF',
    };
};

const formatDate = (dateObj) => {
    if (!dateObj) return '';
    if (dateObj.seconds) {
        return new Date(dateObj.seconds * 1000).toLocaleDateString();
    }
    return '';
};

export default function Header({ business, data }) {
    const comprobanteInfo = getComprobanteInfo(data?.NCF);
    return (
        <Container>
            {business?.logoUrl && (
                <LogoContainer>
                    <img src={business.logoUrl} alt="Company Logo" />
                </LogoContainer>
            )}
            <HeaderInfo>
                <CompanyInfo>
                    <CompanyTitle>{business?.name || 'Ventamax Dev'}</CompanyTitle>
                    <p>{business?.address}</p>
                    {
                        business?.tel && <p>
                            <FontAwesomeIcon icon={faPhone} /> {business?.tel}
                        </p>
                    }
                    {
                        business?.email && <p>
                            <FontAwesomeIcon icon={faEnvelope} /> {business?.email}
                        </p>
                    }
                    {
                        business?.rnc && <p> RNC: {business?.rnc}</p>
                    }
                </CompanyInfo>
                <RightAlign>
                    <Title>{comprobanteInfo.title}</Title>
                    <p>Fecha: {formatDate(data?.date)}</p>
                    <p>
                        Factura {data?.type === 'preorder' ? 'Pedido' : data?.type} #{' '}
                        {data?.numberID}
                    </p>
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
                <div style={{ display: 'flex', gap: '1em' }}>
                    <span>
                        {data?.client?.name && (
                            <p>
                                <strong>Cliente:</strong> {data.client.name}
                            </p>
                        )}
                        {data?.client?.address && <p>Dirección: {data.client.address}</p>}
                    </span>
                    <span>
                        {data?.client?.tel && <p>Tel: {data.client.tel}</p>}

                        {data?.client?.personalID && <p>RNC: {data.client.personalID}</p>}
                    </span>
                </div>
                <RightAlign>
                    {data?.comprobante && (
                        <p>
                            {comprobanteInfo.label}: {data.comprobante}
                        </p>
                    )}
                </RightAlign>
            </CustomerInfo>
        </Container>
    )
}

const Container = styled.div`
    margin: 1em;
`

const Title = styled.h1`
  font-size: 1.1rem;
  margin-bottom: 1rem;
`;
const HeaderInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0em;
`;
const CompanyInfo = styled.div`
  line-height: 1.2;
  font-size: 14px;
  p {
    margin: 0.5em 0;
  }
`;

const CustomerInfo = styled(CompanyInfo)`
  display: grid;
  grid-template-columns: 1fr 1fr;
`;

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

  font-size: 14px;
  text-align: right;
`;


const LogoContainer = styled.div`
  max-width: 200px;
  height: 40px;
  margin-bottom: 1em;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: left center;
  }
`;