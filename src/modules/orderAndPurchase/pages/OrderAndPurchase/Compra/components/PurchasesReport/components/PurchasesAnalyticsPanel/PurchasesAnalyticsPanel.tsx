import { useMemo } from 'react';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';
import type { Purchase } from '@/utils/purchase/types';

import { PurchasesBreakdownList } from '../PurchasesBreakdownList/PurchasesBreakdownList';
import { PurchasesOverviewStrip } from '../PurchasesOverviewStrip/PurchasesOverviewStrip';
import { PurchasesTrendSection } from '../PurchasesTrendSection/PurchasesTrendSection';
import { buildPurchasesAnalyticsSummary } from '../../utils/purchasesAnalyticsSummary';

type PurchasesAnalyticsPanelProps = {
  purchases: Purchase[];
  loading?: boolean;
};

export const PurchasesAnalyticsPanel = ({
  purchases,
  loading = false,
}: PurchasesAnalyticsPanelProps) => {
  const summary = useMemo(
    () => buildPurchasesAnalyticsSummary(purchases),
    [purchases],
  );

  if (loading) {
    return (
      <Container>
        <StateBlock>
          <StateTitle>Cargando compras</StateTitle>
          <StateDescription>
            En cuanto termine la consulta podras revisar como se distribuye el
            gasto, que suplidores pesan mas y que balances siguen pendientes.
          </StateDescription>
        </StateBlock>
      </Container>
    );
  }

  if (summary.totals.purchases === 0) {
    return (
      <Container>
        <StateBlock>
          <StateTitle>No hay compras para analizar</StateTitle>
          <StateDescription>
            Amplia el rango o quita filtros para ver el resumen de compras de
            este periodo.
          </StateDescription>
        </StateBlock>
      </Container>
    );
  }

  const providerItems = summary.providers.slice(0, 5).map((item) => ({
    key: item.key,
    label: item.label,
    value: formatPrice(item.value),
    detail: `${item.count} compras registradas`,
    share: item.share,
  }));

  const conditionItems = summary.conditions.slice(0, 5).map((item) => ({
    key: item.key,
    label: item.label,
    value: formatPrice(item.value),
    detail: `${item.count} compras bajo esta condicion`,
    share: item.share,
  }));

  const categoryItems = summary.categories.slice(0, 5).map((item) => ({
    key: item.key,
    label: item.label,
    value: formatPrice(item.value),
    detail: `${item.count} lineas asociadas`,
    share: item.share,
  }));

  const paymentStatusItems = summary.paymentStatuses
    .slice(0, 5)
    .map((item) => ({
      key: item.key,
      label: item.label,
      value: formatPrice(item.value),
      detail: `${item.count} compras en este estado`,
      share: item.share,
    }));

  return (
    <Container>
      <PurchasesOverviewStrip
        spend={summary.totals.spend}
        paid={summary.totals.paid}
        pending={summary.totals.pending}
        averageTicket={summary.totals.averageTicket}
        purchases={summary.totals.purchases}
        providers={summary.totals.providers}
      />

      {summary.trend.points.length > 0 ? (
        <PurchasesTrendSection summary={summary} />
      ) : (
        <StateBlock>
          <StateTitle>No hay fechas suficientes</StateTitle>
          <StateDescription>
            Estas compras no tienen fechas validas para mostrar la tendencia del
            periodo.
          </StateDescription>
        </StateBlock>
      )}

      <InsightsGrid>
        <PurchasesBreakdownList
          title="Suplidores"
          subtitle="Compara que suplidores concentran mas gasto y cuanto depende este periodo de cada uno."
          items={providerItems}
          emptyMessage="No hay suplidores con monto suficiente para resumir."
        />
        <PurchasesBreakdownList
          title="Condicion de pago"
          subtitle="Revisa que parte del gasto se hizo a contado y que parte quedo a credito."
          items={conditionItems}
          emptyMessage="No hay condiciones de pago para resumir."
        />
        <PurchasesBreakdownList
          title="Categorias"
          subtitle="Muestra en que tipos de producto se esta concentrando la compra del periodo."
          items={categoryItems}
          emptyMessage="No hay categorias con informacion suficiente."
        />
        <PurchasesBreakdownList
          title="Estado del pago"
          subtitle="Te deja ver cuanto ya se pago y cuanto sigue pendiente en el rango actual."
          items={paymentStatusItems}
          emptyMessage="No hay estados de pago para resumir."
        />
      </InsightsGrid>
    </Container>
  );
};

const Container = styled.section`
  display: grid;
  gap: 1rem;
  width: min(100%, 1280px);
  margin: 0 auto;
  padding: 1.25rem 0 1.25rem;
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
