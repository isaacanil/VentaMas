import { notification } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BillingOverviewResponse } from '@/firebase/billing/billingManagement';

import type { MockScenarioPayload } from './components/MockSubscriptionFlowCard';
import type {
  SimulatedBillingResult,
  SimulatedPlanOption,
} from './components/SimulatedPlanSelectionCard';
import type { SubscriptionFieldCatalog } from './subscriptionFieldCatalog';
import type {
  ActionKey,
  LimitRow,
  PaymentRow,
  StatusTone,
  SubscriptionViewModel,
  UnknownRecord,
} from './subscription.types';
import {
  asRecord,
  toCleanString,
  toFiniteNumber,
} from './subscription.utils';
import {
  buildVersionEditorSeed,
  findCatalogPlanByCode,
} from './subscriptionVersioning.utils';
import type { DeveloperSubscriptionMaintenanceContextValue } from './useDeveloperSubscriptionMaintenanceContext';
import { useDeveloperTools } from './useDeveloperTools';
import {
  runMockScenario,
  runSimulatedCheckoutScenario,
} from './utils/mockSubscriptionScenarios';

const buildSimulatedPlanCatalog = (
  plans: Array<UnknownRecord>,
): SimulatedPlanOption[] => {
  if (!plans.length) return [];

  return plans
    .map((item) => asRecord(item))
    .map((plan) => {
      const planCode = toCleanString(plan.planCode);
      if (!planCode) return null;

      return {
        planCode,
        displayName: toCleanString(plan.displayName) || planCode.toUpperCase(),
        priceMonthly: toFiniteNumber(plan.priceMonthly) ?? 0,
        currency: toCleanString(plan.currency) || 'DOP',
        description: 'Plan disponible para pruebas del checkout mock.',
      } satisfies SimulatedPlanOption;
    })
    .filter((item): item is SimulatedPlanOption => Boolean(item));
};

interface UseDeveloperSubscriptionMaintenancePageParams {
  activeBusinessId: string | null;
  canManagePayments: boolean;
  fieldCatalog: SubscriptionFieldCatalog;
  handleLoadOverview: () => Promise<void>;
  isDeveloper: boolean;
  limitRows: LimitRow[];
  loading: ActionKey;
  overview: BillingOverviewResponse | null;
  paymentRows: PaymentRow[];
  saveFieldCatalog: (catalog: SubscriptionFieldCatalog) => Promise<void>;
  statusLabel: string;
  statusTone: StatusTone;
  subscription: SubscriptionViewModel;
}

export type DeveloperSubscriptionMaintenanceToolState = ReturnType<
  typeof useDeveloperTools
>;

interface UseDeveloperSubscriptionMaintenancePageResult {
  contextValue: DeveloperSubscriptionMaintenanceContextValue;
  developerTools: DeveloperSubscriptionMaintenanceToolState;
  handleVersioningPlanSelection: (planCode: string) => void;
}

export const useDeveloperSubscriptionMaintenancePage = ({
  activeBusinessId,
  canManagePayments,
  fieldCatalog,
  handleLoadOverview,
  isDeveloper,
  limitRows,
  loading,
  overview,
  paymentRows,
  saveFieldCatalog,
  statusLabel,
  statusTone,
  subscription,
}: UseDeveloperSubscriptionMaintenancePageParams): UseDeveloperSubscriptionMaintenancePageResult => {
  const [searchParams, setSearchParams] = useSearchParams();
  const developerTools = useDeveloperTools(
    isDeveloper,
    activeBusinessId,
    overview,
    handleLoadOverview,
  );
  const {
    catalogPlanOptions,
    handleDeletePlanDefinition,
    handleUpdatePlanLifecycle,
    loadPlans,
    openDevModal,
    planOptions,
    plans,
    plansLoading,
    setDefinitionCatalogStatus,
    setDefinitionDisplayName,
    setDefinitionIsNew,
    setDefinitionPlanCode,
    setEditorAddonsJson,
    setEditorDisplayName,
    setEditorEffectiveAtMode,
    setEditorLimitsJson,
    setEditorModulesJson,
    setEditorNoticeWindowDays,
    setEditorPlanCode,
    setEditorPlanLocked,
    setEditorPriceMonthly,
    setEditorVersionIdMode,
    handleEditorEffectiveAtChange,
    handleEditorVersionIdChange,
    resetEditorEffectiveAtToAuto,
    resetEditorVersionIdToAuto,
  } = developerTools;
  const [selectedPlanCode, setSelectedPlanCode] = useState('');
  const [mockBusy, setMockBusy] = useState(false);

  useEffect(() => {
    if (!isDeveloper) return;
    void loadPlans();
  }, [isDeveloper, loadPlans]);

  const dynamicSimulatedPlans = useMemo(
    () =>
      planOptions.length
        ? buildSimulatedPlanCatalog(
            planOptions.map((item) => ({
              planCode: item.value,
              displayName: item.label,
            })),
          )
        : [],
    [planOptions],
  );

  const safeSelectedPlanCode = useMemo(() => {
    if (!dynamicSimulatedPlans.length) return '';

    const hasSelectedPlan = dynamicSimulatedPlans.some(
      (plan) => plan.planCode === selectedPlanCode,
    );

    return hasSelectedPlan
      ? selectedPlanCode
      : dynamicSimulatedPlans[0]?.planCode || '';
  }, [dynamicSimulatedPlans, selectedPlanCode]);

  const selectedSimulatedPlan = useMemo(
    () =>
      dynamicSimulatedPlans.find(
        (plan) => plan.planCode === safeSelectedPlanCode,
      ) ||
      dynamicSimulatedPlans[0] ||
      null,
    [dynamicSimulatedPlans, safeSelectedPlanCode],
  );

  const openDefinitionForPlan = (plan: UnknownRecord | null) => {
    if (!plan) {
      setDefinitionIsNew(true);
      setDefinitionPlanCode('');
      setDefinitionDisplayName('');
      setDefinitionCatalogStatus('active');
      openDevModal('definition');
      return;
    }

    const planCode = toCleanString(plan.planCode) || '';
    const displayName =
      toCleanString(plan.displayName) || planCode.toUpperCase();
    const catalogStatus = toCleanString(plan.catalogStatus);

    setDefinitionIsNew(false);
    setDefinitionPlanCode(planCode);
    setDefinitionDisplayName(displayName);
    setDefinitionCatalogStatus(
      catalogStatus === 'deprecated' || catalogStatus === 'retired'
        ? catalogStatus
        : 'active',
    );
    openDevModal('definition');
  };

  const openVersioningForPlan = (
    plan: UnknownRecord | null,
    options?: { preserveVersionId?: boolean },
  ) => {
    if (plan) {
      const seed = buildVersionEditorSeed(plan);
      if (seed) {
        setEditorPlanCode(seed.planCode);
        setEditorDisplayName(seed.displayName);
        setEditorPriceMonthly(seed.priceMonthly);
        setEditorNoticeWindowDays(seed.noticeWindowDays);
        setEditorLimitsJson(seed.limitsJson);
        setEditorModulesJson(seed.modulesJson);
        setEditorAddonsJson(seed.addonsJson);
        setEditorPlanLocked(true);

        if (options?.preserveVersionId) {
          handleEditorVersionIdChange(seed.versionId);
          setEditorVersionIdMode('manual');
          handleEditorEffectiveAtChange(seed.effectiveAt);
          setEditorEffectiveAtMode('manual');
        } else {
          setEditorVersionIdMode('auto');
          resetEditorVersionIdToAuto();
          setEditorEffectiveAtMode('auto');
          resetEditorEffectiveAtToAuto();
        }
      }
    } else {
      setEditorPlanLocked(false);
      setEditorVersionIdMode('auto');
      resetEditorVersionIdToAuto();
      setEditorEffectiveAtMode('auto');
      resetEditorEffectiveAtToAuto();
    }

    openDevModal('versioning');
  };

  const handleVersioningPlanSelection = (planCode: string) => {
    const targetPlan = findCatalogPlanByCode(plans, planCode);
    const seed = buildVersionEditorSeed(targetPlan);

    if (!seed) {
      setEditorPlanCode(planCode);
      return;
    }

    setEditorPlanCode(seed.planCode);
    setEditorDisplayName(seed.displayName);
    setEditorPriceMonthly(seed.priceMonthly);
    setEditorNoticeWindowDays(seed.noticeWindowDays);
    setEditorLimitsJson(seed.limitsJson);
    setEditorModulesJson(seed.modulesJson);
    setEditorAddonsJson(seed.addonsJson);
    setEditorPlanLocked(false);
    setEditorVersionIdMode('auto');
    resetEditorVersionIdToAuto();
    setEditorEffectiveAtMode('auto');
    resetEditorEffectiveAtToAuto();
  };

  const setSimulatedBillingResultInQuery = (
    result: SimulatedBillingResult,
  ) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set('billingResult', result);
    nextSearchParams.set('provider', 'mock');
    setSearchParams(nextSearchParams, { replace: true });
  };

  const handleRunSimulatedCheckout = async (
    result: SimulatedBillingResult,
  ) => {
    if (!canManagePayments) {
      notification.warning({
        message: 'Acceso restringido',
        description: 'Solo owner/admin/dev puede ejecutar simulaciones.',
      });
      return;
    }

    if (!activeBusinessId) {
      notification.error({
        message: 'Negocio no disponible',
        description: 'No se pudo resolver el negocio activo.',
      });
      return;
    }

    if (result !== 'success') {
      setSimulatedBillingResultInQuery(result);
      return;
    }

    setMockBusy(true);
    try {
      const checkoutResult = await runSimulatedCheckoutScenario({
        activeBusinessId,
        selectedPlan: selectedSimulatedPlan,
      });

      if (checkoutResult.status === 'success') {
        notification.success({
          message: 'Pago simulado aplicado',
          description: `Se actualizo el negocio con el plan ${checkoutResult.planCode}.`,
        });
        setSimulatedBillingResultInQuery('success');
        await handleLoadOverview();
        return;
      }

      notification.error({
        message: 'No se pudo ejecutar el checkout simulado',
        description: checkoutResult.errorMessage,
      });
      setSimulatedBillingResultInQuery('failed');
    } catch (error: unknown) {
      notification.error({
        message: 'No se pudo ejecutar el checkout simulado',
        description: error instanceof Error ? error.message : 'Error inesperado.',
      });
      setSimulatedBillingResultInQuery('failed');
    } finally {
      setMockBusy(false);
    }
  };

  const handleRunMockScenario = async (payload: MockScenarioPayload) => {
    setMockBusy(true);
    try {
      const scenarioResult = await runMockScenario(payload);

      if (scenarioResult.status === 'success') {
        notification.success({
          message: 'Escenario aplicado',
          description: `Estado actualizado a ${scenarioResult.nextStatus}.`,
        });
        await handleLoadOverview();
        return;
      }

      notification.error({
        message: 'No se pudo ejecutar el flujo mock',
        description: scenarioResult.errorMessage,
      });
    } catch (error: unknown) {
      notification.error({
        message: 'No se pudo ejecutar el flujo mock',
        description: error instanceof Error ? error.message : 'Error inesperado.',
      });
    } finally {
      setMockBusy(false);
    }
  };

  const contextValue: DeveloperSubscriptionMaintenanceContextValue = {
    activeBusinessId,
    loading,
    subscription,
    statusTone,
    statusLabel,
    limitRows,
    paymentRows,
    canManagePayments,
    handleLoadOverview,
    dynamicSimulatedPlans,
    selectedPlanCode: safeSelectedPlanCode,
    setSelectedPlanCode,
    selectedSimulatedPlan,
    mockBusy,
    planOptions,
    catalogPlanOptions,
    plans,
    plansLoading,
    loadPlans,
    openDevModal,
    openDefinitionForPlan,
    openVersioningForPlan,
    updatePlanLifecycle: handleUpdatePlanLifecycle,
    deletePlanDefinition: handleDeletePlanDefinition,
    handleRunSimulatedCheckout,
    handleRunMockScenario,
    fieldCatalog,
    saveFieldCatalog,
  };

  return {
    contextValue,
    developerTools,
    handleVersioningPlanSelection,
  };
};
