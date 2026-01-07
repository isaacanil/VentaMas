// @ts-nocheck
import { faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

const getComprobanteInfo = () => {
  return {
    title: 'COTIZACIÓN',
    label: 'quote',
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
          {business?.tel && (
            <p>
              <FontAwesomeIcon icon={faPhone} /> {business?.tel}
            </p>
          )}
          {business?.email && (
            <p>
              <FontAwesomeIcon icon={faEnvelope} /> {business?.email}
            </p>
          )}
          {business?.rnc && <p> RNC: {business?.rnc}</p>}
        </CompanyInfo>
        <RightAlign>
          <Title>{comprobanteInfo.title}</Title>
          <p>Fecha: {formatDate(data?.createdAt)}</p>
          <p>Cotización No: {data?.numberID}</p>

          {data?.expirationDate && (
            <p>Fecha que vence: {formatDate(data?.expirationDate)}</p>
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
  );
}

const Container = styled.div`
  margin: 1em;
`;

const Title = styled.h1`
  margin-bottom: 1rem;
  font-size: 1.1rem;
`;
const HeaderInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0;
`;
const CompanyInfo = styled.div`
  font-size: 14px;
  line-height: 1.2;

  p {
    margin: 0.5em 0;
  }
`;

const CustomerInfo = styled(CompanyInfo)`
  display: grid;
  grid-template-columns: 1fr 1fr;
`;

const CompanyTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: bold;
`;

const RightAlign = styled.div`
  display: grid;
  justify-content: end;
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
