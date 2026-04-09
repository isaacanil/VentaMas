import styled from 'styled-components';

import type { InvoiceBusinessInfo, InvoiceData } from '@/types/invoice';

import {
  formatInvoiceDate,
  resolveInvoiceIdentity,
} from '../../utils';

interface HeaderProps {
  business?: InvoiceBusinessInfo | null;
  data?: InvoiceData | null;
}

export default function Header({ business, data }: HeaderProps) {
  const identity = resolveInvoiceIdentity(data);
  const hasClientContent = Boolean(
    data?.client?.name ||
      data?.client?.address ||
      data?.client?.tel ||
      data?.client?.rnc ||
      data?.client?.personalID ||
      data?.seller?.name ||
      data?.NCF ||
      data?.preorderDetails?.date,
  );

  return (
    <HeaderRoot>
      <HeaderRow>
        {business?.logoUrl ? (
          <BrandColumn>
            <Logo src={business.logoUrl} alt="Logo del negocio" />
          </BrandColumn>
        ) : null}

        <BusinessColumn>
          <BusinessName>{business?.name || 'Empresa'}</BusinessName>
          {business?.address ? <HeaderText>{business.address}</HeaderText> : null}
          {business?.tel ? <HeaderText>Tel: {business.tel}</HeaderText> : null}
          {business?.email ? (
            <HeaderText>{business.email}</HeaderText>
          ) : null}
          {business?.rnc ? <HeaderStrong>RNC: {business.rnc}</HeaderStrong> : null}
        </BusinessColumn>

        <MetaColumn>
          <Title>{identity.title || 'Factura'}</Title>
          <HeaderText>Fecha: {formatInvoiceDate(data?.date)}</HeaderText>
          {identity.label &&
          identity.type !== 'preorder' &&
          identity.type !== 'receipt' ? (
            <HeaderText>
              {identity.label}: {identity.value || '-'}
            </HeaderText>
          ) : null}
          <HeaderStrong>
            {identity.type === 'preorder'
              ? `${identity.title || 'Factura'} # ${identity.value || data?.preorderDetails?.numberID || data?.numberID || '-'}`
              : identity.type === 'receipt'
                ? `Recibo # ${identity.value || data?.numberID || '-'}`
                : `${identity.title || 'Factura'} # ${data?.numberID || '-'} `}
          </HeaderStrong>
          {data?.dueDate ? (
            <HeaderText>Vence: {formatInvoiceDate(data.dueDate)}</HeaderText>
          ) : null}
        </MetaColumn>
      </HeaderRow>

      {hasClientContent ? (
        <>
          <Separator />
          <ClientCard>
            <ClientColumn>
              <HeaderStrong>
                Cliente: {data?.client?.name || 'Cliente generico'}
              </HeaderStrong>
              {data?.client?.address ? (
                <HeaderText>Direccion: {data.client.address}</HeaderText>
              ) : null}
              {data?.client?.tel ? (
                <HeaderText>Tel: {data.client.tel}</HeaderText>
              ) : null}
            </ClientColumn>

            <ClientColumnRight>
              {data?.client?.rnc ? (
                <HeaderText>RNC/Cedula: {data.client.rnc}</HeaderText>
              ) : data?.client?.personalID ? (
                <HeaderText>RNC/Cedula: {data.client.personalID}</HeaderText>
              ) : null}
              {data?.seller?.name ? (
                <HeaderText>Vendedor: {data.seller.name}</HeaderText>
              ) : null}
              {data?.NCF ? <HeaderText>NCF: {data.NCF}</HeaderText> : null}
              {data?.preorderDetails?.date ? (
                <HeaderText>
                  Fecha pedido: {formatInvoiceDate(data.preorderDetails.date)}
                </HeaderText>
              ) : null}
            </ClientColumnRight>
          </ClientCard>
        </>
      ) : null}
    </HeaderRoot>
  );
}

const HeaderRoot = styled.div`
  border-bottom: 1px solid var(--invoice-v3-border, #d6dde5);
  padding-bottom: 14px;
  color: var(--invoice-v3-text, #1f2933);
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
`;

const BrandColumn = styled.div`
  width: 108px;
  padding-right: 8px;
`;

const Logo = styled.img`
  width: 96px;
  height: 72px;
  object-fit: contain;
  object-position: left center;
`;

const BusinessColumn = styled.div`
  flex: 1;
  min-width: 0;
`;

const MetaColumn = styled.div`
  width: 210px;
  text-align: right;
`;

const BusinessName = styled.h2`
  margin: 0 0 4px;
  font-size: var(--invoice-v3-font-heading, 13px);
  font-weight: 700;
  line-height: 1.25;
`;

const Title = styled.h1`
  margin: 0 0 4px;
  font-size: var(--invoice-v3-font-title, 16px);
  font-weight: 700;
  line-height: 1.2;
`;

const HeaderText = styled.p`
  margin: 0 0 2px;
  font-size: var(--invoice-v3-font-body, 10.5px);
  line-height: var(--invoice-v3-line-height, 1.45);
`;

const HeaderStrong = styled(HeaderText)`
  font-weight: 700;
`;

const Separator = styled.div`
  border-bottom: 1px solid var(--invoice-v3-border, #d6dde5);
  margin: 10px 0 12px;
`;

const ClientCard = styled.div`
  border: 1px solid var(--invoice-v3-border-soft, #dfe7ef);
  border-radius: 4px;
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
`;

const ClientColumn = styled.div`
  flex: 1;
  min-width: 0;
`;

const ClientColumnRight = styled.div`
  width: 210px;
  text-align: right;
`;
