import styled from 'styled-components';

import MockSubscriptionFlowCard from './components/MockSubscriptionFlowCard';
import { SimulatedPlanSelectionCard } from './components/SimulatedPlanSelectionCard';
import { useDeveloperSubscriptionMaintenanceContext } from './useDeveloperSubscriptionMaintenanceContext';

const DeveloperSubscriptionMaintenanceSandboxPage = () => {
  const {
    activeBusinessId,
    canManagePayments,
    dynamicSimulatedPlans,
    selectedPlanCode,
    setSelectedPlanCode,
    selectedSimulatedPlan,
    mockBusy,
    subscription,
    planOptions,
    handleRunMockScenario,
    handleRunSimulatedCheckout,
  } = useDeveloperSubscriptionMaintenanceContext();

  return (
    <PageContent>
      <SimulatedPlanSelectionCard
        plans={dynamicSimulatedPlans}
        selectedPlanCode={selectedSimulatedPlan?.planCode || selectedPlanCode}
        onSelectPlan={setSelectedPlanCode}
        onSimulateResult={handleRunSimulatedCheckout}
        busy={mockBusy}
        canManagePayments={canManagePayments}
        hasActiveBusiness={Boolean(activeBusinessId)}
      />

      <MockSubscriptionFlowCard
        enabled
        busy={mockBusy}
        businessId={activeBusinessId}
        canManagePayments={canManagePayments}
        defaultPlanCode={
          selectedSimulatedPlan?.planCode || subscription.planId || selectedPlanCode
        }
        defaultAmount={subscription.priceMonthly || 0}
        planOptions={
          planOptions.length
            ? planOptions
            : dynamicSimulatedPlans.map((plan) => ({
                label: `${plan.displayName} (${plan.planCode})`,
                value: plan.planCode,
              }))
        }
        onRunScenario={handleRunMockScenario}
      />
    </PageContent>
  );
};

export default DeveloperSubscriptionMaintenanceSandboxPage;

const PageContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;
