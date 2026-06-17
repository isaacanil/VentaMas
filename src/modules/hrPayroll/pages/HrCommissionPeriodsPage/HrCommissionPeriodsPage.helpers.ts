import {
  cleanString,
  HR_COMMISSION_CUT_RULE_FREQUENCY_LABELS as FREQUENCY_LABELS,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type {
  HrCommissionCutRuleFrequency,
  HrCommissionPeriodRecord,
} from '@/types/hrPayroll';
import { getErrorMessage as getSharedErrorMessage } from '@/utils/errors';
import { normalizeText } from '@/utils/text';

export const getErrorMessage = (error: unknown): string =>
  getSharedErrorMessage(error, 'No se pudo completar la operación.');

const getFrequencyLabel = (value: unknown): string | null => {
  const frequency = cleanString(value);
  if (!frequency) return null;

  return Object.prototype.hasOwnProperty.call(FREQUENCY_LABELS, frequency)
    ? FREQUENCY_LABELS[frequency as keyof typeof FREQUENCY_LABELS]
    : null;
};

export const formatCutRuleMeta = ({
  frequency,
  label,
}: {
  frequency?: HrCommissionCutRuleFrequency | null;
  label?: string | null;
}): string => {
  const cleanLabel = cleanString(label);
  const frequencyLabel = getFrequencyLabel(frequency);
  if (!cleanLabel && !frequencyLabel) return 'Sin regla activa';
  if (!cleanLabel) return frequencyLabel ?? 'Sin regla activa';
  if (!frequencyLabel) return cleanLabel;

  const normalizedLabel = normalizeText(cleanLabel);
  const normalizedFrequency = normalizeText(frequencyLabel);

  return normalizedLabel.includes(normalizedFrequency)
    ? cleanLabel
    : `${cleanLabel} (${frequencyLabel})`;
};

export const getNextCutActionLabel = ({
  actionKey,
  blocked,
}: {
  actionKey: string | null;
  blocked?: boolean | null;
}): string => {
  if (actionKey === 'create') return 'Generando corte...';
  return blocked ? 'Revisar próximo corte' : 'Crear próximo corte';
};

export const formatActiveCutRulesSummary = ({
  activeCount,
  activeRuleMeta,
}: {
  activeCount: number;
  activeRuleMeta: string;
}): string =>
  activeCount > 0
    ? `${activeCount} ${activeCount === 1 ? 'activa' : 'activas'}. Usando ${
        activeRuleMeta
      }.`
    : 'Configura una regla activa para generar cortes.';

export const getPeriodCutRuleMeta = (
  period: HrCommissionPeriodRecord | null,
): string => {
  if (!period) return 'Selecciona un corte para ver su regla.';

  const snapshot = period.cutRuleSnapshot ?? {};
  const label = cleanString(snapshot.label) ?? cleanString(period.cutRuleLabel);
  const frequency = cleanString(snapshot.frequency);

  if (label || frequency) {
    return formatCutRuleMeta({
      frequency: frequency as HrCommissionCutRuleFrequency | null,
      label,
    });
  }
  if (label) return label;
  if (cleanString(period.cutRuleId)) return 'Regla registrada sin nombre.';

  return 'Regla no disponible para este corte legacy';
};
