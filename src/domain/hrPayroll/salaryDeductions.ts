import type {
  HrSalaryDeductionBasis,
  HrSalaryDeductionKind,
  HrSalaryDeductionLine,
  HrSalaryDeductionMode,
} from '@/types/hrPayroll';

type SalaryDeductionPreset = {
  accountSystemKey: string;
  id: string;
  kind: HrSalaryDeductionKind;
  label: string;
  obligationKey: string;
};

export const SALARY_DEDUCTION_PRESETS: SalaryDeductionPreset[] = [
  {
    id: 'afp',
    kind: 'afp',
    label: 'AFP',
    obligationKey: 'afp',
    accountSystemKey: 'payroll_withholdings_payable',
  },
  {
    id: 'tss',
    kind: 'tss',
    label: 'TSS',
    obligationKey: 'tss',
    accountSystemKey: 'payroll_withholdings_payable',
  },
  {
    id: 'salary_itbis',
    kind: 'salary_itbis',
    label: 'ITBIS salario',
    obligationKey: 'salary_itbis',
    accountSystemKey: 'tax_payable',
  },
];

const DEDUCTION_LABELS: Record<HrSalaryDeductionKind, string> = {
  afp: 'AFP',
  tss: 'TSS',
  salary_itbis: 'ITBIS salario',
  other: 'Otra deduccion',
};

const DEDUCTION_ACCOUNT_KEYS: Record<HrSalaryDeductionKind, string> = {
  afp: 'payroll_withholdings_payable',
  tss: 'payroll_withholdings_payable',
  salary_itbis: 'tax_payable',
  other: 'payroll_withholdings_payable',
};

const DEDUCTION_KINDS = new Set<HrSalaryDeductionKind>([
  'afp',
  'tss',
  'salary_itbis',
  'other',
]);

const DEDUCTION_MODES = new Set<HrSalaryDeductionMode>(['percentage', 'fixed']);

const DEDUCTION_BASES = new Set<HrSalaryDeductionBasis>([
  'base_salary',
  'gross_pay',
]);

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toFiniteNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeIdSegment = (value: unknown): string | null =>
  toCleanString(value)
    ?.toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) ?? null;

const normalizeDeductionKind = (value: unknown): HrSalaryDeductionKind => {
  const normalized = normalizeIdSegment(value) as HrSalaryDeductionKind | null;
  return normalized && DEDUCTION_KINDS.has(normalized) ? normalized : 'other';
};

const normalizeDeductionMode = (value: unknown): HrSalaryDeductionMode => {
  const normalized = normalizeIdSegment(value) as HrSalaryDeductionMode | null;
  return normalized && DEDUCTION_MODES.has(normalized)
    ? normalized
    : 'percentage';
};

const normalizeDeductionBasis = (value: unknown): HrSalaryDeductionBasis => {
  const normalized = normalizeIdSegment(value) as HrSalaryDeductionBasis | null;
  return normalized && DEDUCTION_BASES.has(normalized)
    ? normalized
    : 'base_salary';
};

const buildDeductionId = (
  source: Record<string, unknown>,
  kind: HrSalaryDeductionKind,
  index: number,
): string =>
  normalizeIdSegment(source.id) ??
  normalizeIdSegment(source.key) ??
  normalizeIdSegment(source.obligationKey) ??
  `${kind}_${index + 1}`;

export const normalizeSalaryDeductionLines = (
  value: unknown,
): HrSalaryDeductionLine[] => {
  const entries = Array.isArray(value) ? value : [];
  const byId = new Map<string, HrSalaryDeductionLine>();

  entries.forEach((entry, index) => {
    const source = asRecord(entry);
    const kind = normalizeDeductionKind(
      source.kind ?? source.type ?? source.obligationType,
    );
    const id = buildDeductionId(source, kind, index);
    const rate = Math.max(0, toFiniteNumber(source.rate ?? source.percentage));
    const amount = Math.max(0, toFiniteNumber(source.amount));

    byId.set(id, {
      id,
      kind,
      name: toCleanString(source.name) ?? DEDUCTION_LABELS[kind],
      mode: normalizeDeductionMode(source.mode),
      rate,
      amount,
      basis: normalizeDeductionBasis(source.basis),
      active: source.active === false ? false : rate > 0 || amount > 0,
      payableObligation: source.payableObligation === false ? false : true,
      obligationKey:
        normalizeIdSegment(source.obligationKey) ??
        normalizeIdSegment(source.payableKey) ??
        kind,
      accountSystemKey:
        toCleanString(source.accountSystemKey) ?? DEDUCTION_ACCOUNT_KEYS[kind],
      basisAmount: Math.max(0, toFiniteNumber(source.basisAmount)),
      calculatedAmount: Math.max(0, toFiniteNumber(source.calculatedAmount)),
      notes: toCleanString(source.notes),
    });
  });

  return Array.from(byId.values());
};

export const upsertSalaryDeductionRate = (
  lines: HrSalaryDeductionLine[] | null | undefined,
  preset: SalaryDeductionPreset,
  rate: number,
): HrSalaryDeductionLine[] => {
  const normalizedRate = Math.max(0, toFiniteNumber(rate));
  const normalizedLines = normalizeSalaryDeductionLines(lines);
  const current = normalizedLines.find((line) => line.id === preset.id);
  const nextLine: HrSalaryDeductionLine = {
    ...(current ?? {
      amount: 0,
      basis: 'base_salary',
      calculatedAmount: 0,
      mode: 'percentage',
      basisAmount: 0,
      notes: null,
    }),
    id: preset.id,
    kind: preset.kind,
    name: preset.label,
    mode: 'percentage',
    rate: normalizedRate,
    amount: 0,
    basis: 'base_salary',
    active: normalizedRate > 0,
    payableObligation: true,
    obligationKey: preset.obligationKey,
    accountSystemKey: preset.accountSystemKey,
  };

  const withoutCurrent = normalizedLines.filter(
    (line) => line.id !== preset.id,
  );
  return [...withoutCurrent, nextLine].filter(
    (line) => line.active !== false || line.rate > 0 || line.amount > 0,
  );
};

export const getSalaryDeductionRate = (
  lines: HrSalaryDeductionLine[] | null | undefined,
  id: string,
): number =>
  normalizeSalaryDeductionLines(lines).find((line) => line.id === id)?.rate ??
  0;

export const summarizeSalaryDeductions = (
  lines: HrSalaryDeductionLine[] | null | undefined,
): string | null => {
  const activeLines = normalizeSalaryDeductionLines(lines).filter(
    (line) => line.active !== false && line.rate > 0,
  );
  if (!activeLines.length) return null;
  return activeLines.map((line) => `${line.name} ${line.rate}%`).join(' | ');
};
