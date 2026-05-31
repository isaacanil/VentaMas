import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Input, Select } from 'antd';
import { useMemo, useState } from 'react';
import { BillingInvoiceDetailModal } from './BillingInvoiceDetailModal';
import { BillingInvoicesTable } from './BillingInvoicesTable';
import {
  type BillingFilter,
  buildBillingInvoices,
  calculateTotalPaid,
  countPaidInvoices,
  filterBillingInvoices,
} from './SubscriptionBillingCard.helpers';
import type { BillingInvoice } from './SubscriptionBillingCard.types';
import {
  FiltersRow,
  SearchIconWrap,
  SearchWrapper,
  SummaryCard,
  SummaryGrid,
  SummaryLabel,
  SummaryNote,
  SummaryValue,
  Wrapper,
} from './SubscriptionBillingCard.styles';

import type { PaymentRow, SubscriptionViewModel } from '../subscription.types';
import { formatDate, formatMoney } from '../subscription.utils';

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
  const [filter, setFilter] = useState<BillingFilter>('todos');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<BillingInvoice | null>(null);

  const invoices = useMemo<BillingInvoice[]>(
    () => buildBillingInvoices(paymentRows, subscription),
    [paymentRows, subscription],
  );
  const filtered = useMemo(
    () => filterBillingInvoices(invoices, filter, search),
    [filter, invoices, search],
  );
  const totalPaid = useMemo(
    () => calculateTotalPaid(paymentRows),
    [paymentRows],
  );
  const paidInvoices = useMemo(
    () => countPaidInvoices(paymentRows),
    [paymentRows],
  );

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
            {formatMoney(
              subscription.priceMonthly,
              subscription.currency || 'DOP',
            )}
          </SummaryValue>
          <SummaryNote>{formatDate(subscription.periodEnd)}</SummaryNote>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Facturas Emitidas</SummaryLabel>
          <SummaryValue>{invoices.length}</SummaryValue>
          <SummaryNote>{paidInvoices} pagadas</SummaryNote>
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

      <BillingInvoicesTable
        invoices={filtered}
        currency={subscription.currency || 'DOP'}
        canManagePayments={canManagePayments}
        portalLoading={portalLoading}
        onOpenPortal={onOpenPortal}
        onSelectInvoice={setDetail}
      />

      <BillingInvoiceDetailModal
        invoice={detail}
        currency={subscription.currency || 'DOP'}
        canManagePayments={canManagePayments}
        portalLoading={portalLoading}
        onOpenPortal={onOpenPortal}
        onClose={() => setDetail(null)}
      />
    </Wrapper>
  );
};

export default SubscriptionBillingCard;
