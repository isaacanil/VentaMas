import {
  faArrowTrendDown,
  faArrowTrendUp,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { SimpleTypography } from '../../../templates/system/Typografy/SimpleTypography';
import { buildTransactionRows } from '../utils/transactionRows';

export const TransactionDetailsTable = ({
  dailyMetrics,
  formatCurrency,
  pageSize = 7,
}) => {
  const rows = useMemo(
    () => buildTransactionRows(dailyMetrics),
    [dailyMetrics],
  );
  const [page, setPage] = useState(0);
  const firstRowId = rows[0]?.id ?? null;

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    setPage(0);
  }, [rows.length, firstRowId, pageSize]);
  const currentPage = Math.min(page, totalPages - 1);

  const paginatedRows = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return rows.slice(start, end);
  }, [rows, currentPage, pageSize]);

  const handlePrev = () => setPage((prev) => Math.max(prev - 1, 0));
  const handleNext = () =>
    setPage((prev) => Math.min(prev + 1, totalPages - 1));

  const handlePageSelect = (index) => () => setPage(index);

  const paginationVisible = rows.length > pageSize;

  return (
    <TableCard>
      <SimpleTypography as="h3" size="large" weight="bold">
        Detalle de Transacciones
      </SimpleTypography>
      <SimpleTypography size="small" color="secondary">
        Resumen diario de ventas y rentabilidad.
      </SimpleTypography>
      <TableWrapper>
        <StyledTable>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Ventas Totales</th>
              <th>Costo Total</th>
              <th>ITBIS</th>
              <th>Ganancia Neta</th>
              <th>Tendencia</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState>
                    No hay datos diarios disponibles para este rango.
                  </EmptyState>
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.dateLabel}</td>
                  <td>{formatCurrency(row.totalSales)}</td>
                  <td>{formatCurrency(row.totalCost)}</td>
                  <td>{formatCurrency(row.taxes)}</td>
                  <td className={row.netProfit >= 0 ? 'positive' : 'negative'}>
                    {formatCurrency(row.netProfit)}
                  </td>
                  <td>
                    <TrendIcon trend={row.trend}>
                      <FontAwesomeIcon
                        icon={
                          row.trend === 'up'
                            ? faArrowTrendUp
                            : row.trend === 'down'
                              ? faArrowTrendDown
                              : faChartLine
                        }
                      />
                    </TrendIcon>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </StyledTable>
      </TableWrapper>
      {paginationVisible && (
        <Pagination>
          <PaginationButton
            type="button"
            onClick={handlePrev}
            disabled={currentPage === 0}
          >
            Anterior
          </PaginationButton>
          <PaginationPages>
            {Array.from({ length: totalPages }).map((_, index) => (
              <PageDot
                key={index}
                type="button"
                onClick={handlePageSelect(index)}
                aria-label={`Ir a la página ${index + 1}`}
                data-active={currentPage === index}
              />
            ))}
          </PaginationPages>
          <PaginationButton
            type="button"
            onClick={handleNext}
            disabled={currentPage >= totalPages - 1}
          >
            Siguiente
          </PaginationButton>
        </Pagination>
      )}
    </TableCard>
  );
};

const TableCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 10px 35px rgba(15, 23, 42, 0.1);
`;

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 680px;

  th,
  td {
    text-align: left;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e2e8f0;
    white-space: nowrap;
  }

  thead th {
    font-size: 0.85rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody td.positive {
    color: #16a34a;
    font-weight: 600;
  }

  tbody td.negative {
    color: #dc2626;
    font-weight: 600;
  }
`;

const TrendIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background: ${({ trend }) =>
    trend === 'up'
      ? 'rgba(34, 197, 94, 0.12)'
      : trend === 'down'
        ? 'rgba(220, 38, 38, 0.12)'
        : 'rgba(148, 163, 184, 0.12)'};
  color: ${({ trend }) =>
    trend === 'up' ? '#16a34a' : trend === 'down' ? '#dc2626' : '#475569'};
`;

const EmptyState = styled.div`
  text-align: center;
  color: #64748b;
  padding: 1.5rem 0;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-top: 0.5rem;
`;

const PaginationButton = styled.button`
  border: none;
  background: #e2e8f0;
  color: #1f2937;
  font-weight: 600;
  padding: 0.45rem 1rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #cbd5f5;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PaginationPages = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const PageDot = styled.button`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  background: #cbd5f5;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background 0.2s ease;

  &[data-active='true'] {
    background: #4f46e5;
    transform: scale(1.35);
  }
`;
