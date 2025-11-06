import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { SelectSettingCart } from '../features/cart/cartSlice';

const DEFAULT_LOW_THRESHOLD = 20;
const DEFAULT_CRITICAL_THRESHOLD = 10;

export const useStockAlertThresholds = () => {
  const settingsCart = useSelector(SelectSettingCart) || {};
  const billing = settingsCart.billing || {};

  const { lowThreshold, criticalThreshold } = useMemo(() => {
    const resolvedLow = Number.isFinite(billing?.stockLowThreshold)
      ? billing.stockLowThreshold
      : DEFAULT_LOW_THRESHOLD;

    const resolvedCritical = Number.isFinite(billing?.stockCriticalThreshold)
      ? Math.min(billing.stockCriticalThreshold, resolvedLow)
      : Math.min(resolvedLow, DEFAULT_CRITICAL_THRESHOLD);

    return {
      lowThreshold: resolvedLow,
      criticalThreshold: resolvedCritical,
    };
  }, [billing?.stockLowThreshold, billing?.stockCriticalThreshold]);

  const alertsEnabled = !!billing.stockAlertsEnabled;

  return {
    alertsEnabled,
    lowThreshold,
    criticalThreshold,
  };
};

export default useStockAlertThresholds;
