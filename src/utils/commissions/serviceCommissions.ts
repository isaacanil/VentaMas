import type { Product } from '@/features/cart/types';
import type {
  ServiceCommissionCollaboratorSnapshot,
  ServiceCommissionLineSnapshot,
  ServiceCommissionServiceRule,
  ServiceCommissionsBillingSettings,
  ServiceCommissionType,
} from '@/domain/commissions/types';
import type { InvoiceProduct } from '@/types/invoice';
import {
  getFunctionalProductDiscount,
  getFunctionalProductSubtotal,
} from '@/utils/accounting/lineMonetary';

const DEFAULT_SERVICE_COMMISSION_SETTINGS: Required<ServiceCommissionsBillingSettings> =
  {
    enabled: false,
    appliesTo: 'services',
    calculationBase: 'netSubtotalWithoutTax',
    defaultType: 'percentage',
    defaultRate: 0,
    requireCollaboratorOnService: false,
    showOnPrintedInvoice: false,
  };

export const toFiniteCommissionNumber = (
  value: unknown,
  fallback = 0,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundMoney = (value: number): number => Number(value.toFixed(2));

export const cleanCommissionString = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toCleanString = cleanCommissionString;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const normalizeServiceCommissionType = (
  value: unknown,
  fallback: ServiceCommissionType = 'percentage',
): ServiceCommissionType =>
  value === 'fixed' || value === 'percentage' ? value : fallback;

const getProductServiceId = (
  product: Product | InvoiceProduct,
): string | null =>
  toCleanString((product as Record<string, unknown>).productId) ??
  toCleanString(product.id) ??
  toCleanString((product as Record<string, unknown>).serviceId);

export const normalizeServiceCommissionServiceRules = (
  rules: unknown,
): ServiceCommissionServiceRule[] => {
  const entries = Array.isArray(rules) ? rules : [];
  const byServiceId = new Map<string, ServiceCommissionServiceRule>();

  entries.forEach((entry) => {
    const source = asRecord(entry);
    const serviceId =
      toCleanString(source.serviceId) ??
      toCleanString(source.productId) ??
      toCleanString(source.id);
    if (!serviceId) return;

    byServiceId.set(serviceId, {
      id: toCleanString(source.id) ?? serviceId,
      serviceId,
      serviceName:
        toCleanString(source.serviceName) ??
        toCleanString(source.productName) ??
        toCleanString(source.name),
      type: normalizeServiceCommissionType(source.type),
      rateValue: Math.max(
        0,
        toFiniteCommissionNumber(source.rateValue ?? source.defaultRate),
      ),
      active: source.active === false ? false : true,
    });
  });

  return Array.from(byServiceId.values());
};

export const resolveServiceCommissionRuleForProduct = ({
  collaborator,
  product,
}: {
  collaborator?: ServiceCommissionCollaboratorSnapshot | null;
  product?: Product | InvoiceProduct | null;
}): ServiceCommissionServiceRule | null => {
  if (!collaborator || !product) return null;
  const serviceId = getProductServiceId(product);
  if (!serviceId) return null;

  return (
    normalizeServiceCommissionServiceRules(
      collaborator.serviceCommissionRules,
    ).find((rule) => rule.active !== false && rule.serviceId === serviceId) ??
    null
  );
};

export const normalizeServiceCommissionSettings = (
  settings?: ServiceCommissionsBillingSettings | null,
): Required<ServiceCommissionsBillingSettings> => ({
  ...DEFAULT_SERVICE_COMMISSION_SETTINGS,
  ...settings,
  enabled: settings?.enabled === true,
  defaultRate: Math.max(0, toFiniteCommissionNumber(settings?.defaultRate)),
  defaultType:
    settings?.defaultType === 'fixed' || settings?.defaultType === 'percentage'
      ? settings.defaultType
      : DEFAULT_SERVICE_COMMISSION_SETTINGS.defaultType,
  appliesTo: 'services',
  calculationBase: 'netSubtotalWithoutTax',
  showOnPrintedInvoice: settings?.showOnPrintedInvoice === true,
  requireCollaboratorOnService: settings?.requireCollaboratorOnService === true,
});

export const isServiceCommissionEligible = (
  product?: Record<string, unknown> | null,
): boolean => {
  const itemType = toCleanString(product?.itemType)?.toLowerCase();
  const type = toCleanString(product?.type)?.toLowerCase();
  return itemType === 'service' || type === 'service';
};

export const isServiceCommissionCollaboratorEligible = (
  collaborator?: ServiceCommissionCollaboratorSnapshot | null,
  product?: Product | InvoiceProduct | null,
): boolean => {
  if (!collaborator || collaborator.active === false) return false;
  const matchingServiceRule = resolveServiceCommissionRuleForProduct({
    collaborator,
    product,
  });
  if (
    matchingServiceRule &&
    toFiniteCommissionNumber(matchingServiceRule.rateValue) > 0
  ) {
    return true;
  }
  if (
    !product &&
    normalizeServiceCommissionServiceRules(
      collaborator.serviceCommissionRules,
    ).some(
      (rule) =>
        rule.active !== false && toFiniteCommissionNumber(rule.rateValue) > 0,
    )
  ) {
    return true;
  }
  if (
    collaborator.defaultType !== 'fixed' &&
    collaborator.defaultType !== 'percentage'
  ) {
    return false;
  }
  if (collaborator.defaultRate == null) return false;
  return toFiniteCommissionNumber(collaborator.defaultRate) > 0;
};

export const isServiceCommissionLineEligible = (
  commission?: ServiceCommissionLineSnapshot | null,
  product?: Product | InvoiceProduct | null,
): boolean => {
  if (!commission) return false;
  if (commission.type !== 'fixed' && commission.type !== 'percentage') {
    return false;
  }
  if (commission.rateValue == null) return false;
  const lineRate = toFiniteCommissionNumber(commission.rateValue);
  if (lineRate <= 0) return false;

  return (
    commission.source === 'collaborator' ||
    commission.source === 'service' ||
    commission.source === 'business-default' ||
    isServiceCommissionCollaboratorEligible(commission.collaborator, product)
  );
};

export const resolveServiceCommissionBaseAmount = (
  product: Product | InvoiceProduct,
): number => {
  const subtotal = getFunctionalProductSubtotal(product as InvoiceProduct);
  const discount = getFunctionalProductDiscount(product as InvoiceProduct);
  return roundMoney(Math.max(0, subtotal - discount));
};

export const calculateServiceCommissionAmount = ({
  baseAmount,
  rateValue,
  type,
}: {
  baseAmount: number;
  rateValue: number;
  type: ServiceCommissionType;
}): number => {
  if (type === 'fixed') return roundMoney(Math.max(0, rateValue));
  return roundMoney(Math.max(0, baseAmount * (rateValue / 100)));
};

export const normalizeCommissionCollaborator = (
  collaborator: Record<string, unknown> | ServiceCommissionCollaboratorSnapshot,
): ServiceCommissionCollaboratorSnapshot => {
  const source = collaborator as Record<string, unknown>;
  const defaultType =
    source.defaultType === 'fixed' || source.defaultType === 'percentage'
      ? source.defaultType
      : null;
  const defaultRate =
    source.defaultRate == null
      ? null
      : Math.max(0, toFiniteCommissionNumber(source.defaultRate));
  const id =
    toCleanString(source.id) ??
    toCleanString(source.uid) ??
    toCleanString(source.userId) ??
    null;
  const code =
    toCleanString(source.code) ??
    toCleanString(source.number) ??
    toCleanString(source.employeeCode) ??
    id;
  const name =
    toCleanString(source.name) ??
    toCleanString(source.displayName) ??
    toCleanString(source.fullName) ??
    toCleanString(source.email) ??
    code;

  return {
    id,
    code,
    name,
    documentType:
      source.documentType === 'cedula' ||
      source.documentType === 'passport' ||
      source.documentType === 'rnc' ||
      source.documentType === 'other'
        ? source.documentType
        : null,
    documentId: toCleanString(source.documentId),
    hrEmployeeId:
      toCleanString(source.hrEmployeeId) ??
      toCleanString(source.employeeId) ??
      null,
    partyId: toCleanString(source.partyId),
    linkedUserId: toCleanString(source.linkedUserId) ?? id,
    defaultType,
    defaultRate,
    serviceCommissionRules: normalizeServiceCommissionServiceRules(
      source.serviceCommissionRules ?? source.serviceRules,
    ),
    active: source.active === false ? false : undefined,
  };
};

export const buildServiceCommissionLineSnapshot = ({
  collaborator,
  current,
  defaultRate,
  defaultType,
  product,
  rateValue,
  type,
}: {
  collaborator: ServiceCommissionCollaboratorSnapshot;
  current?: ServiceCommissionLineSnapshot | null;
  defaultRate?: number;
  defaultType?: ServiceCommissionType;
  product: Product | InvoiceProduct;
  rateValue?: number | null;
  type?: ServiceCommissionType | null;
}): ServiceCommissionLineSnapshot => {
  const serviceRule = resolveServiceCommissionRuleForProduct({
    collaborator,
    product,
  });
  const currentManual =
    current?.source === 'manual' || current?.source == null ? current : null;
  const normalizedType =
    type === 'fixed' || type === 'percentage'
      ? type
      : (currentManual?.type ??
        serviceRule?.type ??
        current?.type ??
        collaborator.defaultType ??
        defaultType ??
        'percentage');
  const normalizedRate = Math.max(
    0,
    toFiniteCommissionNumber(
      rateValue ??
        currentManual?.rateValue ??
        serviceRule?.rateValue ??
        current?.rateValue ??
        collaborator.defaultRate ??
        defaultRate,
    ),
  );
  const estimatedBaseAmount = resolveServiceCommissionBaseAmount(product);
  const estimatedCommissionAmount = calculateServiceCommissionAmount({
    baseAmount: estimatedBaseAmount,
    rateValue: normalizedRate,
    type: normalizedType,
  });

  return {
    collaborator,
    collaboratorId: collaborator.id ?? null,
    collaboratorCode: collaborator.code ?? null,
    collaboratorName: collaborator.name ?? null,
    hrEmployeeId: collaborator.hrEmployeeId ?? null,
    partyId: collaborator.partyId ?? null,
    type: normalizedType,
    rateValue: normalizedRate,
    source:
      rateValue != null || type != null || currentManual
        ? 'manual'
        : serviceRule
          ? 'service'
          : collaborator.defaultRate != null
            ? 'collaborator'
            : 'business-default',
    calculationBase: 'netSubtotalWithoutTax',
    estimatedBaseAmount,
    estimatedCommissionAmount,
  };
};

export const getServiceCommissionCollaboratorLabel = (
  commission?: ServiceCommissionLineSnapshot | null,
): string | null => {
  const code =
    toCleanString(commission?.collaboratorCode) ??
    toCleanString(commission?.collaborator?.code);
  const name =
    toCleanString(commission?.collaboratorName) ??
    toCleanString(commission?.collaborator?.name);

  if (code && name && code !== name) return `${code} · ${name}`;
  return code ?? name ?? null;
};
