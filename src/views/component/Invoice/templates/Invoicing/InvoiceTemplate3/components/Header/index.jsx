import { faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

import { formatPhoneNumber } from '@/utils/format/formatPhoneNumber';
import { resolveDocumentIdentity } from '@/utils/invoice/documentIdentity.js';

const formatDate = (dateObj) => {
  if (!dateObj) return '';
  if (dateObj.seconds) {
    return new Date(dateObj.seconds * 1000).toLocaleDateString();
  }
  return '';
};

export default function Header({ business, data }) {
  const documentIdentity = resolveDocumentIdentity(data);
  const isPreorder = documentIdentity.type === 'preorder';
  const referenceNumber = isPreorder
    ? documentIdentity.value ||
      data?.preorderDetails?.numberID ||
      data?.numberID
    : data?.numberID;
  const referenceLabel = isPreorder
    ? 'Preventa'
    : documentIdentity.title || 'Factura';
  const shouldShowIdentityLine = !isPreorder && documentIdentity.label;

  const formattedBusinessPhone = formatPhoneNumber(business?.tel || '');
  const primaryClientPhone = formatPhoneNumber(data?.client?.tel || '');
  const secondaryClientPhone = formatPhoneNumber(data?.client?.tel2 || '');

  const clientDetails = [
    { label: 'Cliente', value: data?.client?.name },
    { label: 'ID', value: data?.client?.personalID },
    { label: 'Teléfono', value: primaryClientPhone },
    { label: 'Teléfono 2', value: secondaryClientPhone },
    { label: 'Dirección', value: data?.client?.address },
  ];

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
          {formattedBusinessPhone && (
            <p>
              <FontAwesomeIcon icon={faPhone} /> {formattedBusinessPhone}
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
          <Title>{documentIdentity.title}</Title>
          <p>Fecha: {formatDate(data?.date)}</p>
          <p>
            {referenceLabel} # {referenceNumber || '-'}
          </p>
          {shouldShowIdentityLine && (
            <p>
              {documentIdentity.label}: {documentIdentity.value || '-'}
            </p>
          )}
          {data?.preorderDetails?.date && (
            <p>Fecha de pedido: {formatDate(data?.preorderDetails?.date)}</p>
          )}
          {data?.dueDate && <p>Fecha que vence: {formatDate(data?.dueDate)}</p>}
        </RightAlign>
      </HeaderInfo>
      <CustomerInfo>
        <ClientInfoColumn>
          {clientDetails
            .filter((detail) => detail.value)
            .map((detail) => (
              <p key={detail.label}>
                <strong>{detail.label}:</strong> {detail.value}
              </p>
            ))}
        </ClientInfoColumn>
        {documentIdentity.label && documentIdentity.type !== 'preorder' && (
          <RightAlign>
            <p>
              {documentIdentity.label}: {documentIdentity.value || '-'}
            </p>
          </RightAlign>
        )}
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
  display: flex;
  gap: 1.5rem;
  justify-content: space-between;
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

const ClientInfoColumn = styled.div`
  display: grid;
  gap: 0.25rem;
  font-size: 14px;

  p {
    margin: 0;
  }
`;
