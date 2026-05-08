import { useMemo, type ReactNode } from 'react';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';

import { buildSalesAnalyticsSummary } from './analyticsSummary';
import { BreakdownList } from './components/BreakdownList/BreakdownList';
import { CategoryPerformanceBoard } from './components/CategoryPerformanceBoard/CategoryPerformanceBoard';
import { OverviewStrip } from './components/OverviewStrip/OverviewStrip';
import { SalesTrendSection } from './components/SalesTrendSection/SalesTrendSection';
import { CustomerSalesReportTable } from './components/Table/CustomerSalesReportTable';
import { TopCustomersBoard } from './components/TopCustomersBoard/TopCustomersBoard';
import type { SalesRecord } from './utils';

type SalesAnalyticsPanelProps = {
  sales: SalesRecord[];
  loading?: boolean;
  actions?: ReactNode;
};

const SalesAnalyticsPanel = ({
  sales,
  loading = false,
  actions,
}: SalesAnalyticsPanelProps) => {
  const summary = useMemo(() => buildSalesAnalyticsSummary(sales), [sales]);

  if (loading) {
    return (
      <Container>
        {actions ? <Actions>{actions}</Actions> : null}
        <StateBlock>
          <StateTitle>Cargando datos</StateTitle>
          <StateDescription>
            Preparando ventas, clientes, pagos y origenes del rango activo.
          </StateDescription>
        </StateBlock>
      </Container>
    );
  }

  if (summary.totals.invoices === 0) {
    return (
      <Container>
        {actions ? <Actions>{actions}</Actions> : null}
        <StateBlock>
          <StateTitle>Sin ventas para mostrar</StateTitle>
          <StateDescription>
            Amplia el rango, cambia el cliente o limpia filtros de pago para
            revisar facturas en esta vista.
          </StateDescription>
        </StateBlock>
      </Container>
    );
  }

  const paymentMethodItems = summary.paymentMethods.slice(0, 5).map((item) => ({
    key: item.key,
    label: item.label,
    value: formatPrice(item.value),
    detail: `${item.count} operaciones registradas`,
    share: item.share,
  }));

  const purchaseTypeItems = summary.purchaseTypes.slice(0, 5).map((item) => ({
    key: item.key,
    label: item.label,
    value: `${item.count} facturas`,
    detail: `Genero ${formatPrice(item.value)} en el rango`,
    share: item.share,
  }));

  return (
    <Container>
      {actions ? <Actions>{actions}</Actions> : null}

      <OverviewStrip
        sales={summary.totals.sales}
        paid={summary.totals.paid}
        pending={summary.totals.pending}
        averageTicket={summary.totals.averageTicket}
        invoices={summary.totals.invoices}
        customers={summary.totals.customers}
      />

      <SalesTrendSection summary={summary} />

      <InsightsGrid>
        <BreakdownList
          title="Metodos de pago"
          subtitle="Compara que metodos concentran mas cobros y cuantas operaciones se registraron con cada uno."
          items={paymentMethodItems}
          emptyMessage="No hay metodos de pago activos dentro del filtro actual."
        />
        <BreakdownList
          title="Origen de la venta"
          subtitle="Te muestra que canal u origen esta generando mas facturacion en el rango actual."
          items={purchaseTypeItems}
          emptyMessage="No hay origenes de venta para resumir."
        />
        <CategoryPerformanceBoard categories={summary.categories} />
        <TopCustomersBoard customers={summary.topCustomers} />
      </InsightsGrid>

      <MixFooter>
        <MixItem>
          <span>Ventas a clientes identificados</span>
          <strong>{formatPrice(summary.totals.namedSales)}</strong>
        </MixItem>
        <MixItem>
          <span>Ventas a cliente generico</span>
          <strong>{formatPrice(summary.totals.genericSales)}</strong>
        </MixItem>
      </MixFooter>

      <CustomerSalesReportTable customers={summary.customers} />
    </Container>
  );
};

export default SalesAnalyticsPanel;

const Container = styled.section`
  display: grid;
  gap: var(--ds-space-4);
  width: min(100%, 1280px);
  margin: 0 auto;
  padding: var(--ds-space-4) 0 var(--ds-space-6);

  @media (width <= 768px) {
    padding: var(--ds-space-3) 0 var(--ds-space-4);
  }
`;

const Actions = styled.div`
  display: flex;
  gap: var(--ds-space-3);
  justify-content: flex-end;
`;

const StateBlock = styled.section`
  display: grid;
  gap: var(--ds-space-2);
  padding: var(--ds-space-5);
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-sm);
`;

const StateTitle = styled.h3`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const StateDescription = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

const InsightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-4);

  @media (width <= 920px) {
    grid-template-columns: 1fr;
  }
`;

const MixFooter = styled.section`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-4);
  padding: var(--ds-space-1) 0;

  @media (width <= 768px) {
    grid-template-columns: 1fr;
  }
`;

const MixItem = styled.div`
  display: flex;
  gap: var(--ds-space-3);
  align-items: center;
  justify-content: space-between;
  padding: var(--ds-space-4);
  background: var(--ds-color-bg-subtle);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-lg);

  span {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-sm);
  }

  strong {
    color: var(--ds-color-text-primary);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-semibold);
  }
`;
