import styled from 'styled-components';

import { formatNumber, formatPrice } from '@/utils/format';

import type { CategoryPerformanceItem } from '../../analyticsSummary';

type CategoryPerformanceBoardProps = {
  categories: CategoryPerformanceItem[];
};

export const CategoryPerformanceBoard = ({
  categories,
}: CategoryPerformanceBoardProps) => (
  <Section>
    <Header>
      <Title>Categorias con mas ventas</Title>
      <Subtitle>
        Compara que categorias aportan mas facturacion, cuantos articulos
        movieron y que peso tienen dentro del total vendido.
      </Subtitle>
    </Header>

    {categories.length > 0 ? (
      <Table>
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Ventas</th>
            <th>Items</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.key}>
              <td>{category.label}</td>
              <td>{formatPrice(category.total)}</td>
              <td>{formatNumber(category.items) ?? 0}</td>
              <td>{Math.round(category.share * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </Table>
    ) : (
      <EmptyState>
        No hay categorias para comparar con los filtros actuales.
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

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 0.7rem 0;
    text-align: left;
    border-bottom: 1px solid rgb(15 23 42 / 8%);
  }

  th {
    color: var(--gray-7);
    font-size: 0.75rem;
    font-weight: 600;
  }

  td {
    color: var(--black-3);
    font-size: 0.86rem;
  }

  th:nth-child(n + 2),
  td:nth-child(n + 2) {
    text-align: right;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  td:first-child {
    max-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const EmptyState = styled.p`
  margin: 0;
  color: var(--gray-6);
  font-size: 0.85rem;
`;
