import { Navigate } from 'react-router-dom';

import { useBusinessFeatureAvailability } from '@/hooks/useBusinessFeatureEnabled';
import type { BusinessFeatureKey } from '@/utils/businessFeatures';

import type { JSX, ReactNode } from 'react';

interface BusinessFeatureRouteGateProps {
  feature: BusinessFeatureKey;
  fallbackTo: string;
  children: ReactNode;
}

export const BusinessFeatureRouteGate = ({
  feature,
  fallbackTo,
  children,
}: BusinessFeatureRouteGateProps): JSX.Element => {
  const { enabled, resolved } = useBusinessFeatureAvailability(feature);

  if (!resolved) {
    return <></>;
  }

  if (enabled) {
    return <>{children}</>;
  }

  return <Navigate to={fallbackTo} replace />;
};

export default BusinessFeatureRouteGate;
