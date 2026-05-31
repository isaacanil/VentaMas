import type { Product } from '@/features/cart/types';
import type {
  ServiceCommissionCollaboratorSnapshot,
  ServiceCommissionLineSnapshot,
  ServiceCommissionsBillingSettings,
  ServiceCommissionType,
} from '@/types/commissions';
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
    hrEmployeeId:
      toCleanString(source.hrEmployeeId) ??
      toCleanString(source.employeeId) ??
      null,
    partyId: toCleanString(source.partyId),
    linkedUserId: toCleanString(source.linkedUserId) ?? id,
    defaultType,
    defaultRate,
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
  const normalizedType =
    type === 'fixed' || type === 'percentage'
      ? type
      : (current?.type ??
        collaborator.defaultType ??
        defaultType ??
        'percentage');
  const normalizedRate = Math.max(
    0,
    toFiniteCommissionNumber(
      rateValue ??
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
      current?.source ??
      (collaborator.defaultRate != null ? 'collaborator' : 'manual'),
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
