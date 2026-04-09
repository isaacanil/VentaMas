import {
  requestMockSubscriptionScenario,
  type BillingOverviewResponse,
} from '@/firebase/billing/billingManagement';

import type { MockScenarioPayload } from '../components/MockSubscriptionFlowCard';
import type {
  SimulatedBillingResult,
  SimulatedPlanOption,
} from '../components/SimulatedPlanSelectionCard';
import { toCleanString } from '../subscription.utils';

type SimulatedCheckoutResult =
  | {
      planCode: string;
      status: 'success';
    }
  | {
      errorMessage: string;
      status: 'error';
    };

type MockScenarioResult =
  | {
      nextStatus: string;
      status: 'success';
    }
  | {
      errorMessage: string;
      status: 'error';
    };

export const runSimulatedCheckoutScenario = async ({
  activeBusinessId,
  selectedPlan,
}: {
  activeBusinessId: string;
  selectedPlan: SimulatedPlanOption | null;
}): Promise<SimulatedCheckoutResult> => {
  try {
    const resolvedPlanCode = toCleanString(selectedPlan?.planCode);
    if (!resolvedPlanCode) {
      throw new Error(
        'Debes seleccionar un plan para simular el checkout.',
      );
    }

    await requestMockSubscriptionScenario({
      businessId: activeBusinessId,
      nextStatus: 'active',
      planCode: resolvedPlanCode,
      provider: 'cardnet',
      scope: 'business',
      targetBusinessId: activeBusinessId,
      note: `simulated_checkout:${resolvedPlanCode}`,
      recordPayment: true,
      paymentAmount: selectedPlan?.priceMonthly || 0,
      paymentCurrency: selectedPlan?.currency || 'DOP',
      paymentStatus: 'paid',
      paymentDescription: `Pago simulado (${resolvedPlanCode})`,
    });

    return {
      planCode: resolvedPlanCode,
      status: 'success',
    };
  } catch (error: unknown) {
    return {
      errorMessage:
        error instanceof Error ? error.message : 'Error inesperado.',
      status: 'error',
    };
  }
};

export const runMockScenario = async (
  payload: MockScenarioPayload,
): Promise<MockScenarioResult> => {
  try {
    const response = await requestMockSubscriptionScenario(payload);
    return {
      nextStatus: response.nextStatus || payload.nextStatus,
      status: 'success',
    };
  } catch (error: unknown) {
    return {
      errorMessage:
        error instanceof Error ? error.message : 'Error inesperado.',
      status: 'error',
    };
  }
};
