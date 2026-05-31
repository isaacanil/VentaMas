import { Empty } from 'antd';
import { useMemo, useState } from 'react';
import {
  FEATURE_DEFINITIONS,
  LIMIT_DEFINITIONS,
  hasDefinedPlanLimit,
  isFeatureEnabled,
} from './SubscriptionPlansCard.helpers';
import { PlanChangeConfirmModal } from './PlanChangeConfirmModal';
import { PlanOptionCard } from './PlanOptionCard';
import { PlansComparisonTable } from './PlansComparisonTable';
import { Wrapper, PlansGrid } from './SubscriptionPlansCard.styles';

import type { SubscriptionPlanOption } from '../subscription.types';
import { toFiniteNumber } from '../subscription.utils';

interface SubscriptionPlansCardProps {
  plans: SubscriptionPlanOption[];
  currentPlanId?: string | null;
  onSelectPlan: (planId: string) => void | Promise<void>;
  loadingAction?: boolean;
  canManagePayments?: boolean;
  providerLabel?: string;
}

export const SubscriptionPlansCard = ({
  plans,
  currentPlanId,
  onSelectPlan,
  loadingAction = false,
  canManagePayments = false,
  providerLabel = 'CardNET',
}: SubscriptionPlansCardProps) => {
  const [confirmPlanId, setConfirmPlanId] = useState<string | null>(null);

  const displayedPlans = useMemo(
    () =>
      plans.slice().sort((left, right) => {
        if (left.isCurrent && !right.isCurrent) return -1;
        if (!left.isCurrent && right.isCurrent) return 1;
        const leftPrice = toFiniteNumber(left.priceMonthly) ?? 0;
        const rightPrice = toFiniteNumber(right.priceMonthly) ?? 0;
        if (leftPrice !== rightPrice) return leftPrice - rightPrice;
        return left.displayName.localeCompare(right.displayName, 'es');
      }),
    [plans],
  );

  const comparisonLimitRows = useMemo(
    () =>
      LIMIT_DEFINITIONS.filter((definition) =>
        displayedPlans.some((plan) =>
          hasDefinedPlanLimit(plan, definition.key),
        ),
      ),
    [displayedPlans],
  );

  const comparisonFeatureRows = useMemo(
    () =>
      FEATURE_DEFINITIONS.filter((definition) =>
        displayedPlans.some((plan) => isFeatureEnabled(plan, definition.key)),
      ),
    [displayedPlans],
  );

  const selectedPlan =
    displayedPlans.find((plan) => plan.planCode === confirmPlanId) || null;

  const handleConfirm = async () => {
    if (!confirmPlanId) return;
    await onSelectPlan(confirmPlanId);
    setConfirmPlanId(null);
  };

  if (!displayedPlans.length) {
    return (
      <Wrapper>
        <Empty
          description="No hay planes comerciales disponibles para este negocio."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <PlansGrid>
        {displayedPlans.map((plan) => (
          <PlanOptionCard
            key={plan.planCode}
            plan={plan}
            currentPlanId={currentPlanId}
            limitDefinitions={comparisonLimitRows}
            featureDefinitions={comparisonFeatureRows}
            canManagePayments={canManagePayments}
            loading={loadingAction}
            isConfirming={confirmPlanId === plan.planCode}
            onRequestSelect={setConfirmPlanId}
          />
        ))}
      </PlansGrid>

      <PlansComparisonTable
        plans={displayedPlans}
        currentPlanId={currentPlanId}
        limitDefinitions={comparisonLimitRows}
        featureDefinitions={comparisonFeatureRows}
      />

      <PlanChangeConfirmModal
        open={confirmPlanId !== null}
        selectedPlan={selectedPlan}
        providerLabel={providerLabel}
        loading={loadingAction}
        onCancel={() => setConfirmPlanId(null)}
        onConfirm={() => void handleConfirm()}
      />
    </Wrapper>
  );
};

export default SubscriptionPlansCard;
