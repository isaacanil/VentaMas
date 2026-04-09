import type {
  CategorySummary,
  TopProductRow,
} from '../hooks/useInventorySummaryData';
import {
  SectionCard,
  SectionCardWide,
  SectionGrid,
  SectionTitle,
  Table,
  TableWrap,
} from '../styles';

interface SummaryTablesProps {
  categoriesSummary: CategorySummary[];
  currency: string;
  formatCurrency: (value: number, currency?: string) => string;
  formatInteger: (value: number) => string;
  topProducts: TopProductRow[];
}

export const SummaryTables = ({
  categoriesSummary,
  currency,
  formatCurrency,
  formatInteger,
  topProducts,
}: SummaryTablesProps) => {
  return (
    <SectionGrid>
      <SectionCardWide>
        <SectionTitle>Resumen por categoria</SectionTitle>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th className="num">Unidades</th>
                <th className="num">Valor (Costo)</th>
                <th className="num">% del costo total</th>
                <th className="num">Costo prom. unit.</th>
              </tr>
            </thead>
            <tbody>
              {categoriesSummary.map((row) => (
                <tr key={row.category}>
                  <td>{row.category}</td>
                  <td className="num">{formatInteger(row.qty)}</td>
                  <td className="num">
                    {formatCurrency(row.valueCost, currency)}
                  </td>
                  <td className="num">{(row.share * 100).toFixed(1)}%</td>
                  <td className="num">{formatCurrency(row.avgCost, currency)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </SectionCardWide>

      <SectionCard>
        <SectionTitle>Top 10 productos por valor</SectionTitle>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoria</th>
                <th className="num">Unidades</th>
                <th className="num">Costo unitario</th>
                <th className="num">Valor</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((row) => (
                <tr key={`${row.id ?? row.name}-${row.sku}`}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{row.name}</div>
                    {row.sku ? (
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        {row.sku}
                      </div>
                    ) : null}
                  </td>
                  <td>{row.category}</td>
                  <td className="num">{formatInteger(row.qty)}</td>
                  <td className="num">
                    {formatCurrency(row.unitCost, currency)}
                  </td>
                  <td className="num">{formatCurrency(row.value, currency)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </SectionCard>
    </SectionGrid>
  );
};
