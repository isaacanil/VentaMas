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
            En cuanto termine la consulta podras revisar como se movieron las
            ventas, que clientes aportan mas y desde donde se genera la
            facturacion del rango.
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
          <StateTitle>No hay datos en este corte</StateTitle>
          <StateDescription>
            Esta vista necesita al menos una factura dentro del filtro activo.
            Prueba ampliando la fecha, cambiando cliente o quitando filtros de
            pago.
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
  gap: 1rem;
  width: min(100%, 1280px);
  margin: 0 auto;
  padding: 1rem 0 1.5rem;

  @media (width <= 768px) {
    padding: 0.75rem 0 1rem;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;

const StateBlock = styled.section`
  display: grid;
  gap: 0.35rem;
  padding: 1.35rem 1.4rem;
  background: var(--white);
  border: 1px solid rgb(15 23 42 / 12%);
  border-radius: 10px;
`;

const StateTitle = styled.h3`
  margin: 0;
  color: var(--black-3);
  font-size: 1rem;
  font-weight: 600;
`;

const StateDescription = styled.p`
  margin: 0;
  color: var(--gray-6);
  font-size: 0.86rem;
  line-height: 1.5;
`;

const InsightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (width <= 920px) {
    grid-template-columns: 1fr;
  }
`;

const MixFooter = styled.section`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  padding: 0.15rem 0;

  @media (width <= 768px) {
    grid-template-columns: 1fr;
  }
`;

const MixItem = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1rem;
  background: var(--white-2);
  border: 1px solid rgb(15 23 42 / 8%);
  border-radius: 10px;

  span {
    color: var(--gray-7);
    font-size: 0.82rem;
  }

  strong {
    color: var(--black-3);
    font-size: 0.9rem;
    font-weight: 600;
  }
`;
