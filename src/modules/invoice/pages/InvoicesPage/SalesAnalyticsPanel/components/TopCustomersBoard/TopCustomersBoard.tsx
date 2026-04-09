import styled from 'styled-components';

import { formatNumber, formatPrice } from '@/utils/format';

import type { CustomerSummaryRow } from '../../analyticsSummary';

type TopCustomersBoardProps = {
  customers: CustomerSummaryRow[];
};

export const TopCustomersBoard = ({ customers }: TopCustomersBoardProps) => (
  <Section>
    <Header>
      <Title>Clientes con mas facturacion</Title>
      <Subtitle>
        Identifica rapido que clientes concentran mas ventas y cuando fue su
        ultima compra.
      </Subtitle>
    </Header>

    {customers.length > 0 ? (
      <List>
        {customers.map((customer, index) => (
          <Item key={customer.key}>
            <Index>{index + 1}</Index>
            <CustomerBlock>
              <CustomerName>{customer.cliente}</CustomerName>
              <CustomerMeta>
                {formatNumber(customer.invoiceCount) ?? 0} facturas · ultima
                compra {customer.lastPurchaseDate}
              </CustomerMeta>
            </CustomerBlock>
            <Totals>
              <strong>{formatPrice(customer.total)}</strong>
              <span>{Math.round(customer.share * 100)}% del total</span>
            </Totals>
          </Item>
        ))}
      </List>
    ) : (
      <EmptyState>
        No hay clientes suficientes para mostrar un ranking.
      </EmptyState>
    )}
  </Section>
);

const Section = styled.section`
  display: grid;
  gap: 1rem;
  padding: 1.1rem 1.15rem;
  background: var(--white);
  border: 1px solid rgb(15 23 42 / 12%);
  border-radius: 10px;
`;

const Header = styled.header`
  display: grid;
  gap: 0.2rem;
`;

const Title = styled.h3`
  margin: 0;
  color: var(--black-3);
  font-size: 1rem;
  font-weight: 600;
`;

const Subtitle = styled.p`
  margin: 0;
  color: var(--gray-6);
  font-size: 0.82rem;
  line-height: 1.45;
`;

const List = styled.div`
  display: grid;
  gap: 0.8rem;
`;

const Item = styled.div`
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) max-content;
  gap: 0.85rem;
  align-items: center;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid rgb(15 23 42 / 8%);

  &:last-child {
    padding-bottom: 0;
    border-bottom: none;
  }

  @media (width <= 640px) {
    grid-template-columns: 2rem 1fr;
  }
`;

const Index = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: #1d69a8;
  font-size: 0.82rem;
  font-weight: 700;
  background: rgba(29, 105, 168, 0.08);
  border-radius: 999px;
`;

const CustomerBlock = styled.div`
  display: grid;
  gap: 0.2rem;
  min-width: 0;
`;

const CustomerName = styled.strong`
  overflow: hidden;
  color: var(--black-3);
  font-size: 0.9rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CustomerMeta = styled.span`
  color: var(--gray-6);
  font-size: 0.78rem;
  line-height: 1.45;
`;

const Totals = styled.div`
  display: grid;
  gap: 0.2rem;
  text-align: right;

  strong {
    color: var(--black-3);
    font-size: 0.92rem;
    font-weight: 600;
  }

  span {
    color: var(--gray-6);
    font-size: 0.76rem;
  }

  @media (width <= 640px) {
    grid-column: 2;
    text-align: left;
  }
`;

const EmptyState = styled.p`
  margin: 0;
  color: var(--gray-6);
  font-size: 0.85rem;
`;
