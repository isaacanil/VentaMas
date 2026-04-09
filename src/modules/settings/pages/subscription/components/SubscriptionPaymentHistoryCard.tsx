import { faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';

import { formatDateTime, formatMoney } from '../subscription.utils';
import type { PaymentRow } from '../subscription.types';

const PAGE_SIZE = 8;

interface SubscriptionPaymentHistoryCardProps {
  paymentRows: PaymentRow[];
}

export const SubscriptionPaymentHistoryCard = ({
  paymentRows,
}: SubscriptionPaymentHistoryCardProps) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(paymentRows.length / PAGE_SIZE));
  const visible = paymentRows.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <Card>
      <CardHeader>
        <CardIcon>
          <FontAwesomeIcon icon={faFileInvoiceDollar} />
        </CardIcon>
        <CardTitle>Historial de pagos</CardTitle>
      </CardHeader>

      {paymentRows.length ? (
        <>
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <Th>Fecha</Th>
                  <Th>Monto</Th>
                  <Th>Estado</Th>
                  <Th>Proveedor</Th>
                  <Th>Descripcion</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.key}>
                    <Td>{formatDateTime(row.createdAt)}</Td>
                    <Td>{formatMoney(row.amount, row.currency)}</Td>
                    <Td>
                      <StatusPill>{row.status.toUpperCase()}</StatusPill>
                    </Td>
                    <Td>{row.provider}</Td>
                    <Td $muted>{row.description}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrapper>
          {totalPages > 1 ? (
            <Pagination>
              <Button
                size="small"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <PageInfo>
                {page + 1} / {totalPages}
              </PageInfo>
              <Button
                size="small"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </Pagination>
          ) : null}
        </>
      ) : (
        <EmptyState>Sin pagos registrados</EmptyState>
      )}
    </Card>
  );
};

export default SubscriptionPaymentHistoryCard;

const Card = styled.section`
  display: grid;
  gap: 16px;
  padding: 22px;
  border: 1px solid rgb(148 163 184 / 18%);
  border-radius: 22px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 12px 36px rgb(15 23 42 / 5%);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CardIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #fef3c7;
  color: #92400e;
  font-size: 14px;
`;

const CardTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1.1rem;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 10px 14px;
  text-align: left;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 1px solid rgb(148 163 184 / 18%);
  white-space: nowrap;
`;

const Td = styled.td<{ $muted?: boolean }>`
  padding: 10px 14px;
  color: ${(p) => (p.$muted ? '#64748b' : '#0f172a')};
  font-size: 0.9rem;
  border-bottom: 1px solid rgb(148 163 184 / 10%);

  tr:last-child & {
    border-bottom: none;
  }
`;

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #334155;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const PageInfo = styled.span`
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
`;

const EmptyState = styled.p`
  margin: 0;
  padding: 18px 0;
  color: #64748b;
  font-size: 0.9rem;
  text-align: center;
`;
