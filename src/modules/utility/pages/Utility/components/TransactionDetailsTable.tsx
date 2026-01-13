import {
  faArrowTrendDown,
  faArrowTrendUp,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCallback, useMemo, useState, type JSX } from 'react';
import styled from 'styled-components';

import { SimpleTypography } from '@/components/ui/Typografy/SimpleTypography';
import type {
  UtilityCurrencyFormatter,
  UtilityDailyMetric,
  UtilityTrend,
} from '@/modules/utility/pages/Utility/types';

import { buildTransactionRows } from '../utils/transactionRows';

interface TransactionDetailsTableProps {
  dailyMetrics: UtilityDailyMetric[];
  formatCurrency: UtilityCurrencyFormatter;
  pageSize?: number;
}

type PageUpdater = number | ((page: number) => number);

export const TransactionDetailsTable = ({
  dailyMetrics,
  formatCurrency,
  pageSize = 7,
}: TransactionDetailsTableProps): JSX.Element => {
  const rows = useMemo(
    () => buildTransactionRows(dailyMetrics),
    [dailyMetrics],
  );
  const firstRowId = rows[0]?.id ?? null;

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  const resetTrigger = `${rows.length}-${firstRowId}-${pageSize}`;
  const [{ trigger: pageTrigger, page: pageState }, setPageState] = useState<{
    trigger: string;
    page: number;
  }>(() => ({ trigger: resetTrigger, page: 0 }));

  const page = pageTrigger === resetTrigger ? pageState : 0;

  const setPage = useCallback(
    (updater: PageUpdater) => {
      setPageState((prev) => {
        const currentPage =
          prev.trigger === resetTrigger ? prev.page : 0;
        const nextPage =
          typeof updater === 'function' ? updater(currentPage) : updater;
        return { trigger: resetTrigger, page: nextPage };
      });
    },
    [resetTrigger],
  );

  const currentPage = Math.min(page, totalPages - 1);

  const paginatedRows = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return rows.slice(start, end);
  }, [rows, currentPage, pageSize]);

  const handlePrev = () => setPage((prev) => Math.max(prev - 1, 0));
  const handleNext = () =>
    setPage((prev) => Math.min(prev + 1, totalPages - 1));

  const handlePageSelect = (index: number) => () => setPage(index);

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
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 35px rgb(15 23 42 / 10%);
`;

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;

  th,
  td {
    padding: 0.75rem 1rem;
    text-align: left;
    white-space: nowrap;
    border-bottom: 1px solid #e2e8f0;
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
    font-weight: 600;
    color: #16a34a;
  }

  tbody td.negative {
    font-weight: 600;
    color: #dc2626;
  }
`;

const TrendIcon = styled.span<{ trend: UtilityTrend }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: ${({ trend }) =>
    trend === 'up' ? '#16a34a' : trend === 'down' ? '#dc2626' : '#475569'};
  background: ${({ trend }) =>
    trend === 'up'
      ? 'rgba(34, 197, 94, 0.12)'
      : trend === 'down'
        ? 'rgba(220, 38, 38, 0.12)'
        : 'rgba(148, 163, 184, 0.12)'};
  border-radius: 10px;
`;

const EmptyState = styled.div`
  padding: 1.5rem 0;
  color: #64748b;
  text-align: center;
`;

const Pagination = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.5rem;
`;

const PaginationButton = styled.button`
  padding: 0.45rem 1rem;
  font-weight: 600;
  color: #1f2937;
  cursor: pointer;
  background: #e2e8f0;
  border: none;
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #cbd5f5;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const PaginationPages = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const PageDot = styled.button`
  width: 10px;
  height: 10px;
  cursor: pointer;
  background: #cbd5f5;
  border: none;
  border-radius: 50%;
  transition:
    transform 0.2s ease,
    background 0.2s ease;

  &[data-active='true'] {
    background: #4f46e5;
    transform: scale(1.35);
  }
`;
