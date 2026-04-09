import { Card, KpiGrid, KpiTitle, KpiValue } from '../styles';

interface SummaryKpisProps {
  currency: string;
  formatCurrency: (value: number, currency?: string) => string;
  formatInteger: (value: number) => string;
  productsCount: number;
  ptTotals: {
    stock: number;
    cost: number;
    listPrice: number;
  };
}

export const SummaryKpis = ({
  currency,
  formatCurrency,
  formatInteger,
  productsCount,
  ptTotals,
}: SummaryKpisProps) => {
  return (
    <KpiGrid>
      <Card>
        <KpiTitle>Total (Precio lista)</KpiTitle>
        <KpiValue>{formatCurrency(ptTotals.listPrice, currency)}</KpiValue>
      </Card>
      <Card>
        <KpiTitle>Total (Costo)</KpiTitle>
        <KpiValue>{formatCurrency(ptTotals.cost, currency)}</KpiValue>
      </Card>
      <Card>
        <KpiTitle>Unidades en stock</KpiTitle>
        <KpiValue>{formatInteger(ptTotals.stock)}</KpiValue>
      </Card>
      <Card>
        <KpiTitle>Productos</KpiTitle>
        <KpiValue>{formatInteger(productsCount)}</KpiValue>
      </Card>
    </KpiGrid>
  );
};
