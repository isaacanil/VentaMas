import type { StatusBadgeTone } from '@/components/ui/StatusBadge';
import type {
  ElectronicTaxReceiptReadinessCheck,
  ElectronicTaxReceiptReadinessCheckStatus,
  ElectronicTaxReceiptReadinessStatus,
} from '@/firebase/electronicTaxReceipts/fbValidateElectronicTaxReceiptConfig';

export const MODE_OPTIONS = [
  { label: 'Preparacion solamente', value: 'shadow' },
  { label: 'Piloto', value: 'pilot' },
  { label: 'Envio activo', value: 'required' },
] as const;

export type RuntimeModeOption = (typeof MODE_OPTIONS)[number]['value'];

type RuntimeStatusMeta = {
  label: string;
  tone: StatusBadgeTone;
};

const STATUS_META: Record<
  ElectronicTaxReceiptReadinessStatus | 'pending',
  RuntimeStatusMeta
> = {
  ready: { label: 'Runtime listo', tone: 'success' },
  blocked: { label: 'Revisar runtime', tone: 'danger' },
  inactive: { label: 'Inactivo', tone: 'neutral' },
  shadow_ready: { label: 'Sin health remoto', tone: 'warning' },
  pending: { label: 'Pendiente de validar', tone: 'neutral' },
};

const CHECK_STATUS_META: Record<
  ElectronicTaxReceiptReadinessCheckStatus,
  RuntimeStatusMeta
> = {
  passed: { label: 'OK', tone: 'success' },
  warning: { label: 'Revisar', tone: 'warning' },
  blocked: { label: 'Bloqueado', tone: 'danger' },
  inactive: { label: 'Inactivo', tone: 'neutral' },
};

export const getRuntimeStatusMeta = (
  status?: ElectronicTaxReceiptReadinessStatus,
) => STATUS_META[status || 'pending'];

export const getCheckStatusMeta = (
  status?: ElectronicTaxReceiptReadinessCheckStatus,
) => CHECK_STATUS_META[status || 'inactive'];

export const getCheckByKey = (
  checks: ElectronicTaxReceiptReadinessCheck[] | undefined,
  key: string,
) => checks?.find((check) => check.key === key) || null;
