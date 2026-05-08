import styled from 'styled-components';

import { formatPrice } from '@/utils/format';

type MetricItem = {
  label: string;
  value: string;
  detail?: string;
};

type OverviewStripProps = {
  sales: number;
  paid: number;
  pending: number;
  averageTicket: number;
  invoices: number;
  customers: number;
};

export const OverviewStrip = ({
  sales,
  paid,
  pending,
  averageTicket,
  invoices,
  customers,
}: OverviewStripProps) => {
  const metrics: MetricItem[] = [
    {
      label: 'Facturacion',
      value: formatPrice(sales),
      detail: 'Monto total del rango filtrado',
    },
    {
      label: 'Cobrado',
      value: formatPrice(paid),
      detail: 'Pagos aplicados sobre estas facturas',
    },
    {
      label: 'Pendiente',
      value: formatPrice(pending),
      detail: 'Saldo abierto por cobrar',
    },
    {
      label: 'Ticket promedio',
      value: formatPrice(averageTicket),
      detail: 'Promedio por factura',
    },
    {
      label: 'Facturas',
      value: new Intl.NumberFormat('es-DO').format(invoices),
      detail: 'Cantidad de comprobantes',
    },
    {
      label: 'Clientes',
      value: new Intl.NumberFormat('es-DO').format(customers),
      detail: 'Clientes unicos en el rango',
    },
  ];

  return (
    <Container>
      {metrics.map((metric) => (
        <Metric key={metric.label}>
          <MetricLabel>{metric.label}</MetricLabel>
          <MetricValue>{metric.value}</MetricValue>
          {metric.detail ? <MetricDetail>{metric.detail}</MetricDetail> : null}
        </Metric>
      ))}
    </Container>
  );
};

const Container = styled.section`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  box-shadow: var(--ds-shadow-sm);

  @media (width <= 1200px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (width <= 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (width <= 420px) {
    grid-template-columns: 1fr;
  }
`;

const Metric = styled.div`
  display: grid;
  min-width: 0;
  gap: var(--ds-space-2);
  padding: var(--ds-space-4);
  border-right: 1px solid var(--ds-color-border-subtle);

  &:last-child {
    border-right: none;
  }

  @media (width <= 1200px) {
    &:nth-child(3n) {
      border-right: none;
    }

    &:nth-child(n + 4) {
      border-top: 1px solid var(--ds-color-border-subtle);
    }
  }

  @media (width <= 640px) {
    &:nth-child(3n) {
      border-right: 1px solid var(--ds-color-border-subtle);
    }

    &:nth-child(2n) {
      border-right: none;
    }

    &:nth-child(n + 3) {
      border-top: 1px solid var(--ds-color-border-subtle);
    }
  }

  @media (width <= 420px) {
    border-right: none;

    &:not(:first-child) {
      border-top: 1px solid var(--ds-color-border-subtle);
    }
  }
`;

const MetricLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

const MetricValue = styled.strong`
  overflow: hidden;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-xl);
  font-weight: var(--ds-font-weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MetricDetail = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
`;
