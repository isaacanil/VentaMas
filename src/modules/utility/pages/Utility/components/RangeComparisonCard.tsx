import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import type { JSX } from 'react';

import { ComparisonMetricCard } from '@/modules/utility/pages/Utility/components/ComparisonMetricCard';
import type {
  UtilityComparison,
  UtilityCurrencyFormatter,
  UtilityPercentageFormatter,
} from '@/modules/utility/types';

interface RangeComparisonCardProps {
  loading: boolean;
  comparison?: UtilityComparison | null;
  formatCurrency: UtilityCurrencyFormatter;
  formatPercentage: UtilityPercentageFormatter;
}

export const RangeComparisonCard = ({
  loading,
  comparison,
  formatCurrency,
  formatPercentage,
}: RangeComparisonCardProps): JSX.Element => (
  <ComparisonMetricCard
    loading={loading}
    comparison={comparison}
    formatCurrency={formatCurrency}
    formatPercentage={formatPercentage}
    title="Ganancia Neta"
    loadingLabel="Cargando comparación"
    neutralTrendIcon={faChartLine}
    currentValueColor={(current) => (current >= 0 ? 'success' : 'danger')}
    formulaTooltip={(referenceLabel) =>
      `Cambio en ganancia neta = ((valor actual - ${referenceLabel}) / ${referenceLabel}) × 100`
    }
  />
);
