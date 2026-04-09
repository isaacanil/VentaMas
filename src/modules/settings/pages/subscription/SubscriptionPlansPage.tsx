import { useCallback } from 'react';

import { SubscriptionPlansCard } from './components/SubscriptionPlansCard';
import { resolveSubscriptionProviderLabel } from './subscription.utils';
import { useSubscriptionPageContext } from './useSubscriptionPageContext';

const SubscriptionPlansPage = () => {
  const {
    subscription,
    availablePlans,
    canManagePayments,
    loadingAction,
    handleOpenCheckout,
  } =
    useSubscriptionPageContext();

  const handleSelectPlan = useCallback(async (planId: string) => {
    await handleOpenCheckout(planId);
  }, [handleOpenCheckout]);

  return (
    <SubscriptionPlansCard
      plans={availablePlans}
      currentPlanId={subscription.planId}
      onSelectPlan={handleSelectPlan}
      loadingAction={loadingAction === 'checkout'}
      canManagePayments={canManagePayments}
      providerLabel={resolveSubscriptionProviderLabel(subscription.provider)}
    />
  );
};

export default SubscriptionPlansPage;

