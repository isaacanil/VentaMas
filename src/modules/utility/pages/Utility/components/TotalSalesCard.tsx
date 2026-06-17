import { faDollarSign } from '@fortawesome/free-solid-svg-icons';
import type { JSX } from 'react';

import { ComparisonMetricCard } from '@/modules/utility/pages/Utility/components/ComparisonMetricCard';
import type {
  UtilityComparison,
  UtilityCurrencyFormatter,
  UtilityPercentageFormatter,
} from '@/modules/utility/types';

interface TotalSalesCardProps {
  loading: boolean;
  comparison?: UtilityComparison | null;
  formatCurrency: UtilityCurrencyFormatter;
  formatPercentage: UtilityPercentageFormatter;
}

export const TotalSalesCard = ({
  loading,
  comparison,
  formatCurrency,
  formatPercentage,
}: TotalSalesCardProps): JSX.Element => (
  <ComparisonMetricCard
    loading={loading}
    comparison={comparison}
    formatCurrency={formatCurrency}
    formatPercentage={formatPercentage}
    title="Ventas totales"
    loadingLabel="Cargando total de ventas"
    neutralTrendIcon={faDollarSign}
    currentValueColor="info"
    formulaTooltip={(referenceLabel) =>
      `Cambio en ventas = ((ventas actuales - ${referenceLabel}) / ${referenceLabel}) × 100`
    }
  />
);
