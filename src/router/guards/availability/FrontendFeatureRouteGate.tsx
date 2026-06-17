import FrontendFeatureBlockedView, {
  type FrontendFeatureBlockedViewProps,
} from './FrontendFeatureBlockedView';
import { FRONTEND_FEATURE_BLOCKED_COPY } from './FrontendFeatureRouteGate.config';
import {
  isFrontendFeatureEnabled,
  type FrontendFeatureKey,
} from '@/utils/runtime/frontendFeatureAccess';

import type { JSX, ReactNode } from 'react';

interface FrontendFeatureRouteGateProps {
  feature: FrontendFeatureKey;
  children: ReactNode;
  blockedView?: Partial<FrontendFeatureBlockedViewProps>;
}

export const FrontendFeatureRouteGate = ({
  feature,
  children,
  blockedView,
}: FrontendFeatureRouteGateProps): JSX.Element => {
  if (isFrontendFeatureEnabled(feature)) {
    return <>{children}</>;
  }

  return (
    <FrontendFeatureBlockedView
      {...FRONTEND_FEATURE_BLOCKED_COPY[feature]}
      {...blockedView}
    />
  );
};

export default FrontendFeatureRouteGate;
