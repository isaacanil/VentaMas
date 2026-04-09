import {
  faCircleCheck,
  faCircleXmark,
  faClock,
  faDownload,
  faFileLines,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Input, Modal, Select } from 'antd';
import { useMemo, useState } from 'react';
import styled from 'styled-components';

import type {
  PaymentRow,
  SubscriptionViewModel,
} from '../subscription.types';
import {
  formatDate,
  formatMoney,
  getProviderLabel,
  isSuccessfulPaymentStatus,
  normalizePaymentStatus,
} from '../subscription.utils';

type BillingInvoiceStatus =
  | 'pagado'
  | 'pendiente'
  | 'fallido'
  | 'cancelado'
  | 'desconocido';

interface BillingInvoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: BillingInvoiceStatus;
  plan: string;
  method: string;
  description: string;
  reference?: string | null;
}

const STATUS_CONFIG = {
  pagado: {
    icon: faCircleCheck,
    label: 'Pagado',
    bg: 'rgb(13 148 136 / 10%)',
    color: '#0f766e',
    border: 'rgb(13 148 136 / 25%)',
  },
  pendiente: {
    icon: faClock,
    label: 'Pendiente',
    bg: 'rgb(217 119 6 / 10%)',
    color: '#92400e',
    border: 'rgb(217 119 6 / 25%)',
  },
  fallido: {
    icon: faCircleXmark,
    label: 'Fallido',
    bg: 'rgb(220 38 38 / 10%)',
    color: '#991b1b',
    border: 'rgb(220 38 38 / 20%)',
  },
  cancelado: {
    icon: faCircleXmark,
    label: 'Cancelado',
    bg: 'rgb(226 232 240)',
    color: '#475569',
    border: 'rgb(203 213 225)',
  },
  desconocido: {
    icon: faClock,
    label: 'Sin clasificar',
    bg: 'rgb(241 245 249)',
    color: '#475569',
    border: 'rgb(226 232 240)',
  },
} as const;

const InvoiceStatusBadge = ({
  status,
}: {
  status: BillingInvoiceStatus;
}) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <StatusBadge $bg={cfg.bg} $color={cfg.color} $border={cfg.border}>
      <FontAwesomeIcon icon={cfg.icon} />
      {cfg.label}
    </StatusBadge>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <DetailRowWrapper>
    <DetailLabel>{label}</DetailLabel>
    <DetailValue>{value}</DetailValue>
  </DetailRowWrapper>
);

interface SubscriptionBillingCardProps {
  subscription: SubscriptionViewModel;
  paymentRows: PaymentRow[];
  canManagePayments: boolean;
  portalLoading?: boolean;
  onOpenPortal: () => void | Promise<boolean>;
}

export const SubscriptionBillingCard = ({
  subscription,
  paymentRows,
  canManagePayments,
  portalLoading = false,
  onOpenPortal,
}: SubscriptionBillingCardProps) => {
  const [filter, setFilter] = useState<string>('todos');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<BillingInvoice | null>(null);

  const invoices = useMemo<BillingInvoice[]>(
    () =>
      paymentRows.map((item) => ({
        id: item.key,
        number: item.reference || item.key.toUpperCase(),
        date: formatDate(item.createdAt),
        amount: item.amount,
        status: normalizePaymentStatus(item.status),
        plan: subscription.displayName || 'Sin plan asignado',
        method: getProviderLabel(item.provider),
        description:
          item.description !== '-'
            ? item.description
            : 'Movimiento registrado desde el proveedor de pagos.',
        reference: item.reference,
      })),
    [paymentRows, subscription.displayName],
  );

  const filtered = invoices.filter((invoice) => {
    const matchesFilter = filter === 'todos' || invoice.status === filter;
    const needle = search.trim().toLowerCase();
    const matchesSearch =
      !needle ||
      invoice.number.toLowerCase().includes(needle) ||
      invoice.plan.toLowerCase().includes(needle) ||
      invoice.method.toLowerCase().includes(needle);
    return matchesFilter && matchesSearch;
  });

  const totalPaid = paymentRows
    .filter((item) => isSuccessfulPaymentStatus(item.status))
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <Wrapper>
      <SummaryGrid>
        <SummaryCard>
          <SummaryLabel>Total Pagado</SummaryLabel>
          <SummaryValue>
            {formatMoney(totalPaid, subscription.currency || 'DOP')}
          </SummaryValue>
          <SummaryNote>Según el historial de pagos disponible</SummaryNote>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Próxima Factura</SummaryLabel>
          <SummaryValue>
            {formatMoney(subscription.priceMonthly, subscription.currency || 'DOP')}
          </SummaryValue>
          <SummaryNote>{formatDate(subscription.periodEnd)}</SummaryNote>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Facturas Emitidas</SummaryLabel>
          <SummaryValue>{invoices.length}</SummaryValue>
          <SummaryNote>
            {paymentRows.filter((item) => isSuccessfulPaymentStatus(item.status)).length}{' '}
            pagadas
          </SummaryNote>
        </SummaryCard>
      </SummaryGrid>

      <FiltersRow>
        <SearchWrapper>
          <SearchIconWrap>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </SearchIconWrap>
          <Input
            placeholder="Buscar por referencia, plan o proveedor..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            allowClear
            style={{ paddingLeft: 36 }}
          />
        </SearchWrapper>
        <Select
          value={filter}
          onChange={setFilter}
          style={{ width: 180, flexShrink: 0 }}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'pagado', label: 'Pagados' },
            { value: 'pendiente', label: 'Pendientes' },
            { value: 'fallido', label: 'Fallidos' },
            { value: 'cancelado', label: 'Cancelados' },
          ]}
        />
      </FiltersRow>

      <TableCard>
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>Factura</Th>
                <Th>Fecha</Th>
                <Th>Plan</Th>
                <Th>Monto</Th>
                <Th>Estado</Th>
                <ThRight>Acciones</ThRight>
              </tr>
            </thead>
            <tbody>
              {filtered.map((invoice, index) => (
                <Tr key={invoice.id} $last={index === filtered.length - 1}>
                  <Td>
                    <InvoiceLink type="button" onClick={() => setDetail(invoice)}>
                      {invoice.number}
                    </InvoiceLink>
                  </Td>
                  <Td $muted>{invoice.date}</Td>
                  <Td>{invoice.plan}</Td>
                  <Td $bold>
                    {formatMoney(invoice.amount, subscription.currency || 'DOP')}
                  </Td>
                  <Td>
                    <InvoiceStatusBadge status={invoice.status} />
                  </Td>
                  <TdRight>
                    <ActionGroup>
                      <Button
                        type="text"
                        size="small"
                        icon={<FontAwesomeIcon icon={faFileLines} />}
                        onClick={() => setDetail(invoice)}
                      />
                      <Button
                        type="text"
                        size="small"
                        icon={<FontAwesomeIcon icon={faDownload} />}
                        disabled={!canManagePayments}
                        loading={portalLoading}
                        onClick={() => {
                          onOpenPortal();
                        }}
                      />
                    </ActionGroup>
                  </TdRight>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>

        {filtered.length === 0 && (
          <EmptyState>
            <FontAwesomeIcon icon={faFileLines} />
            <span>No se encontraron facturas</span>
          </EmptyState>
        )}
      </TableCard>

      <Modal
        open={detail !== null}
        onCancel={() => setDetail(null)}
        title="Detalle de Factura"
        footer={null}
        width={480}
      >
        {detail && (
          <ModalBody>
            <ModalTop>
              <div>
                <ModalInvoiceNumber>{detail.number}</ModalInvoiceNumber>
                <ModalInvoiceDate>{detail.date}</ModalInvoiceDate>
              </div>
              <InvoiceStatusBadge status={detail.status} />
            </ModalTop>

            <ModalDivider />

            <DetailRows>
              <DetailRow label="Plan" value={detail.plan} />
              <DetailRow
                label="Monto"
                value={formatMoney(detail.amount, subscription.currency || 'DOP')}
              />
              <DetailRow label="Proveedor" value={detail.method} />
              <DetailRow label="Descripción" value={detail.description} />
              <DetailRow
                label="Referencia"
                value={detail.reference || detail.number}
              />
            </DetailRows>

            <ModalDivider />

            <ModalTotal>
              <ModalTotalLabel>Total</ModalTotalLabel>
              <ModalTotalValue>
                {formatMoney(detail.amount, subscription.currency || 'DOP')}
              </ModalTotalValue>
            </ModalTotal>

            <ModalActions>
              <Button
                type="primary"
                icon={<FontAwesomeIcon icon={faDownload} />}
                style={{ flex: 1 }}
                disabled={!canManagePayments}
                loading={portalLoading}
                onClick={() => {
                  onOpenPortal();
                }}
              >
                Abrir portal
              </Button>
              <Button style={{ flex: 1 }} onClick={() => setDetail(null)}>
                Cerrar
              </Button>
            </ModalActions>
          </ModalBody>
        )}
      </Modal>
    </Wrapper>
  );
};

export default SubscriptionBillingCard;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled.div`
  padding: 18px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
`;

const SummaryLabel = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.85rem;
`;

const SummaryValue = styled.p`
  margin: 4px 0 0;
  color: #0f172a;
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
`;

const SummaryNote = styled.p`
  margin: 4px 0 0;
  color: #94a3b8;
  font-size: 0.78rem;
`;

const FiltersRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const SearchWrapper = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 360px;
`;

const SearchIconWrap = styled.span`
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 0.82rem;
  pointer-events: none;
  z-index: 1;
`;

const TableCard = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  overflow: hidden;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 10px 16px;
  text-align: left;
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
`;

const ThRight = styled(Th)`
  text-align: right;
`;

const Tr = styled.tr<{ $last: boolean }>`
  border-bottom: ${(p) => (p.$last ? 'none' : '1px solid #f1f5f9')};
  transition: background 0.1s;

  &:hover {
    background: #f8fafc;
  }
`;

const Td = styled.td<{ $muted?: boolean; $bold?: boolean }>`
  padding: 10px 16px;
  color: ${(p) => (p.$muted ? '#64748b' : '#0f172a')};
  font-size: 0.88rem;
  font-weight: ${(p) => (p.$bold ? 600 : 400)};
  vertical-align: middle;
`;

const TdRight = styled(Td)`
  text-align: right;
`;

const InvoiceLink = styled.button`
  padding: 0;
  border: none;
  background: transparent;
  color: #0d9488;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: text-decoration 0.1s;

  &:hover {
    text-decoration: underline;
  }
`;

const ActionGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 2px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 0;
  color: #94a3b8;
  font-size: 0.9rem;

  svg {
    font-size: 1.6rem;
  }
`;

const StatusBadge = styled.span<{
  $bg: string;
  $color: string;
  $border: string;
}>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid ${(p) => p.$border};
  background: ${(p) => p.$bg};
  color: ${(p) => p.$color};
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
`;

const ModalTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const ModalInvoiceNumber = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 1.05rem;
  font-weight: 600;
`;

const ModalInvoiceDate = styled.p`
  margin: 4px 0 0;
  color: #64748b;
  font-size: 0.875rem;
`;

const ModalDivider = styled.hr`
  margin: 0;
  border: none;
  border-top: 1px solid #e2e8f0;
`;

const DetailRows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const DetailRowWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const DetailLabel = styled.span`
  color: #64748b;
  font-size: 0.875rem;
`;

const DetailValue = styled.span`
  color: #0f172a;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: right;
`;

const ModalTotal = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTotalLabel = styled.span`
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 600;
`;

const ModalTotalValue = styled.span`
  color: #0f172a;
  font-size: 1.15rem;
  font-weight: 700;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 10px;
`;
