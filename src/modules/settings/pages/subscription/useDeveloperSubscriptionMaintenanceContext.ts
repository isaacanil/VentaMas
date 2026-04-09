import { useOutletContext } from 'react-router-dom';

import type { MockScenarioPayload } from './components/MockSubscriptionFlowCard';
import type {
  SimulatedBillingResult,
  SimulatedPlanOption,
} from './components/SimulatedPlanSelectionCard';
import type {
  ActionKey,
  DevMaintenanceModalKey,
  LimitRow,
  PaymentRow,
  PlanLifecycleStatus,
  StatusTone,
  SubscriptionViewModel,
  UnknownRecord,
} from './subscription.types';
import type { SubscriptionFieldCatalog } from './subscriptionFieldCatalog';

export interface DeveloperSubscriptionMaintenanceContextValue {
  activeBusinessId: string | null;
  loading: ActionKey;
  subscription: SubscriptionViewModel;
  statusTone: StatusTone;
  statusLabel: string;
  limitRows: LimitRow[];
  paymentRows: PaymentRow[];
  canManagePayments: boolean;
  handleLoadOverview: () => Promise<void>;
  dynamicSimulatedPlans: SimulatedPlanOption[];
  selectedPlanCode: string;
  setSelectedPlanCode: (planCode: string) => void;
  selectedSimulatedPlan: SimulatedPlanOption | null;
  mockBusy: boolean;
  planOptions: Array<{ label: string; value: string }>;
  catalogPlanOptions: Array<{ label: string; value: string }>;
  plans: Array<UnknownRecord>;
  plansLoading: boolean;
  loadPlans: () => Promise<void>;
  openDevModal: (modal: Exclude<DevMaintenanceModalKey, null>) => void;
  openDefinitionForPlan: (plan: UnknownRecord | null) => void;
  openVersioningForPlan: (
    plan: UnknownRecord | null,
    options?: { preserveVersionId?: boolean },
  ) => void;
  updatePlanLifecycle: (input: {
    planCode: string;
    lifecycleStatus: PlanLifecycleStatus;
    versionId?: string;
  }) => Promise<void>;
  deletePlanDefinition: (planCode: string) => Promise<void>;
  handleRunSimulatedCheckout: (result: SimulatedBillingResult) => Promise<void>;
  handleRunMockScenario: (payload: MockScenarioPayload) => Promise<void>;
  fieldCatalog: SubscriptionFieldCatalog;
  saveFieldCatalog: (catalog: SubscriptionFieldCatalog) => Promise<void>;
}

export const useDeveloperSubscriptionMaintenanceContext = () =>
  useOutletContext<DeveloperSubscriptionMaintenanceContextValue>();
