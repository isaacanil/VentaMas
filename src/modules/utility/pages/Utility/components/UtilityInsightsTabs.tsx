import { useMemo, useState, type JSX } from 'react';
import styled from 'styled-components';

import { designSystemV2 } from '@/theme/designSystemV2';
import { SimpleTypography } from '@/components/ui/Typografy/SimpleTypography';
import type {
  UtilityCurrencyFormatter,
  UtilityDailyMetric,
  UtilityProductBreakdown,
  UtilitySummary,
} from '@/modules/utility/pages/Utility/types';

import { BusinessInsightsPanel } from './BusinessInsightsPanel';
import { TopProductsPanel } from './TopProductsPanel';
import { TransactionDetailsTable } from './TransactionDetailsTable';

const { colors, spacing, radii, shadows } = designSystemV2;

type UtilityInsightsTabKey = 'transactions' | 'products' | 'insights';

const TAB_CONFIG: Array<{
  id: UtilityInsightsTabKey;
  label: string;
  description: string;
}> = [
  {
    id: 'transactions',
    label: 'Transacciones',
    description: 'Detalle diario de ventas, costos, ITBIS y rentabilidad.',
  },
  {
    id: 'products',
    label: 'Productos destacados',
    description: 'Los productos con mayor contribución en ventas y margen.',
  },
  {
    id: 'insights',
    label: 'Insights operativos',
    description: 'Alertas y hallazgos para tomar acciones con rapidez.',
  },
];

interface UtilityInsightsTabsProps {
  dailyMetrics: UtilityDailyMetric[];
  formatCurrency: UtilityCurrencyFormatter;
  summary: UtilitySummary;
  productsBreakdown: UtilityProductBreakdown[];
}

export const UtilityInsightsTabs = ({
  dailyMetrics,
  formatCurrency,
  summary,
  productsBreakdown,
}: UtilityInsightsTabsProps): JSX.Element => {
  const [activeTab, setActiveTab] = useState<UtilityInsightsTabKey>(TAB_CONFIG[0].id);
  const panelId = 'utility-insights-panel';

  const activeDescription = useMemo(
    () => TAB_CONFIG.find((tab) => tab.id === activeTab)?.description,
    [activeTab],
  );

  const handleSelect = (tabId: UtilityInsightsTabKey) => () => setActiveTab(tabId);

  const renderContent = useMemo(() => {
    switch (activeTab) {
      case 'products':
        return (
          <PanelCard>
            <TopProductsPanel
              products={productsBreakdown}
              formatCurrency={formatCurrency}
            />
          </PanelCard>
        );
      case 'insights':
        return (
          <PanelCard>
            <BusinessInsightsPanel
              summary={summary}
              dailyMetrics={dailyMetrics}
              formatCurrency={formatCurrency}
            />
          </PanelCard>
        );
      default:
        return (
          <TransactionDetailsTable
            dailyMetrics={dailyMetrics}
            formatCurrency={formatCurrency}
          />
        );
    }
  }, [activeTab, dailyMetrics, formatCurrency, summary, productsBreakdown]);

  return (
    <Section>
      <Header>
        <SimpleTypography as="h2" size="large" weight="bold">
          Profundiza en tus resultados
        </SimpleTypography>
        <SimpleTypography size="small" color="secondary">
          Alterna entre el detalle de transacciones y los insights clave del
          período.
        </SimpleTypography>
      </Header>

      <TabsContainer
        role="tablist"
        aria-label="Secciones del análisis de utilidad"
      >
        {TAB_CONFIG.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <TabButton
              key={tab.id}
              id={`utility-tab-${tab.id}`}
              type="button"
              onClick={handleSelect(tab.id)}
              data-active={isActive}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              aria-controls={panelId}
            >
              {tab.label}
            </TabButton>
          );
        })}
      </TabsContainer>

      {activeDescription && (
        <SimpleTypography size="small" color="secondary">
          {activeDescription}
        </SimpleTypography>
      )}

      <Content
        role="tabpanel"
        id={panelId}
        aria-labelledby={`utility-tab-${activeTab}`}
      >
        {renderContent}
      </Content>
    </Section>
  );
};

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${spacing.lg};
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs};
`;

const TabsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing.sm};
`;

const TabButton = styled.button`
  padding: 0.55rem 1.15rem;
  font-weight: 600;
  color: ${colors.text.secondary};
  background: ${colors.background.surface};
  border: 1px solid ${colors.stroke.subtle};
  border-radius: ${radii.pill};
  box-shadow: ${shadows.xs};
  transition: all 0.2s ease;

  &[data-active='true'] {
    color: #fff;
    background: linear-gradient(105deg, #4f46e5 0%, #22d3ee 100%);
    border-color: transparent;
    box-shadow: 0 10px 25px rgb(79 70 229 / 25%);
  }

  &:hover:not([data-active='true']) {
    color: ${colors.text.primary};
    background: ${colors.layers.neutralSoft};
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.md};
`;

const PanelCard = styled.div`
  padding: ${spacing.xl};
  background: ${colors.background.surface};
  border: 1px solid ${colors.stroke.subtle};
  border-radius: ${radii.lg};
  box-shadow: ${shadows.md};
`;
