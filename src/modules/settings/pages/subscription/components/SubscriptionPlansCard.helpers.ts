import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBox,
  faCartShopping,
  faFileInvoice,
  faStore,
  faTag,
  faTruck,
  faUserCheck,
  faUsers,
  faWarehouse,
} from '@fortawesome/free-solid-svg-icons';

import { SUBSCRIPTION_FIELD_CONTRACT } from '../subscriptionFieldCatalog';
import type { SubscriptionPlanOption } from '../subscription.types';
import { asRecord, toFiniteNumber } from '../subscription.utils';

export interface PlanComparisonDefinition {
  key: string;
  defaultLabel: string;
}

export const LIMIT_ICON_MAP: Record<string, IconDefinition> = {
  maxBusinesses: faStore,
  maxUsers: faUsers,
  maxProducts: faBox,
  maxMonthlyInvoices: faFileInvoice,
  maxClients: faUserCheck,
  maxSuppliers: faTruck,
  maxWarehouses: faWarehouse,
  maxOpenCashRegisters: faCartShopping,
};

export const FALLBACK_LIMIT_ICON = faTag;

export const LIMIT_DEFINITIONS = Object.values(
  SUBSCRIPTION_FIELD_CONTRACT.limits,
).sort((left, right) => left.defaultOrder - right.defaultOrder);

export const FEATURE_DEFINITIONS = [
  ...Object.values(SUBSCRIPTION_FIELD_CONTRACT.modules),
  ...Object.values(SUBSCRIPTION_FIELD_CONTRACT.addons),
].sort((left, right) => left.defaultOrder - right.defaultOrder);

export const resolvePlanDescription = (plan: SubscriptionPlanOption) => {
  if (plan.planCode === 'demo') {
    return 'Demo inicial asignada durante el onboarding. No admite una nueva selección.';
  }
  if (plan.planCode === 'legacy') {
    return 'Plan heredado por migración. Se conserva como referencia, pero no admite nuevas altas.';
  }
  return 'Configuración activa del catálogo comercial.';
};

export const resolvePlanTone = (plan: SubscriptionPlanOption) => {
  if (plan.isCurrent) return 'current';
  if (plan.isSelectable) return 'selectable';
  return 'locked';
};

export const isFeatureEnabled = (plan: SubscriptionPlanOption, key: string) =>
  asRecord(plan.modules)[key] === true || asRecord(plan.addons)[key] === true;

export const hasDefinedPlanLimit = (
  plan: SubscriptionPlanOption,
  key: string,
) => toFiniteNumber(asRecord(plan.limits)[key]) !== null;
