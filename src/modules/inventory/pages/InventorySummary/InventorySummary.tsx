import { Button, Input, Select } from 'antd';
import { Fragment } from 'react';

import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import { SummaryKpis } from './components/SummaryKpis';
import { SummaryTables } from './components/SummaryTables';
import { useInventorySummaryData } from './hooks/useInventorySummaryData';
import {
  Center,
  Content,
  Header,
  LeftFilters,
  Page,
  RightActions,
} from './styles';

export const InventorySummary = () => {
  const {
    category,
    categories,
    categoriesSummary,
    currency,
    exportExcel,
    formatCurrency,
    formatInteger,
    loading,
    productsCount,
    ptTotals,
    query,
    setCategory,
    setQuery,
    topProducts,
  } = useInventorySummaryData();

  return (
    <Fragment>
      <MenuApp sectionName="Resumen de Inventario" />
      <Page>
        <Content>
          {loading ? (
            <Center>Cargando inventario…</Center>
          ) : (
            <>
              <Header>
                <LeftFilters>
                  <Input
                    placeholder="Buscar por nombre, SKU o categoria"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    allowClear
                  />
                  <Select
                    value={category}
                    onChange={setCategory}
                    style={{ minWidth: 200 }}
                    options={categories.map((value) => ({
                      label:
                        value === 'all' ? 'Todas las categorias' : value,
                      value,
                    }))}
                  />
                </LeftFilters>
                <RightActions>
                  <Button type="primary" onClick={exportExcel}>
                    Exportar Excel
                  </Button>
                </RightActions>
              </Header>

              <SummaryKpis
                currency={currency}
                formatCurrency={formatCurrency}
                formatInteger={formatInteger}
                productsCount={productsCount}
                ptTotals={ptTotals}
              />

              <SummaryTables
                categoriesSummary={categoriesSummary}
                currency={currency}
                formatCurrency={formatCurrency}
                formatInteger={formatInteger}
                topProducts={topProducts}
              />
            </>
          )}
        </Content>
      </Page>
    </Fragment>
  );
};

export default InventorySummary;
