export const HR_SALARY_DEDUCTION_KINDS = new Set([
  'afp',
  'tss',
  'salary_itbis',
  'other',
]);

export const HR_SALARY_DEDUCTION_MODES = new Set(['percentage', 'fixed']);

export const HR_SALARY_DEDUCTION_BASES = new Set(['base_salary', 'gross_pay']);

const DEDUCTION_LABELS = {
  afp: 'AFP',
  tss: 'TSS',
  salary_itbis: 'ITBIS salario',
  other: 'Otra deduccion',
};

const DEDUCTION_ACCOUNT_KEYS = {
  afp: 'payroll_withholdings_payable',
  tss: 'payroll_withholdings_payable',
  salary_itbis: 'tax_payable',
  other: 'payroll_withholdings_payable',
};

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundMoney = (value) => Math.round(toFiniteNumber(value) * 100) / 100;

const normalizeIdSegment = (value) =>
  toCleanString(value)
    ?.toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || null;

const normalizeDeductionKind = (value) => {
  const normalized = normalizeIdSegment(value);
  return normalized && HR_SALARY_DEDUCTION_KINDS.has(normalized)
    ? normalized
    : 'other';
};

const normalizeDeductionMode = (value) => {
  const normalized = normalizeIdSegment(value);
  return normalized && HR_SALARY_DEDUCTION_MODES.has(normalized)
    ? normalized
    : 'percentage';
};

const normalizeDeductionBasis = (value) => {
  const normalized = normalizeIdSegment(value);
  return normalized && HR_SALARY_DEDUCTION_BASES.has(normalized)
    ? normalized
    : 'base_salary';
};

const buildDeductionId = (source, kind, index) =>
  normalizeIdSegment(source.id) ||
  normalizeIdSegment(source.key) ||
  normalizeIdSegment(source.obligationKey) ||
  `${kind}_${index + 1}`;

export const normalizeSalaryDeductionLines = (value) => {
  const entries = Array.isArray(value) ? value : [];
  const byId = new Map();

  entries.forEach((entry, index) => {
    const source = asRecord(entry);
    const kind = normalizeDeductionKind(
      source.kind || source.type || source.obligationType,
    );
    const id = buildDeductionId(source, kind, index);
    const mode = normalizeDeductionMode(source.mode);
    const rate = Math.max(0, toFiniteNumber(source.rate ?? source.percentage));
    const amount = Math.max(0, toFiniteNumber(source.amount));
    const active = source.active === false ? false : rate > 0 || amount > 0;

    byId.set(id, {
      id,
      kind,
      name: toCleanString(source.name) || DEDUCTION_LABELS[kind],
      mode,
      rate,
      amount,
      basis: normalizeDeductionBasis(source.basis),
      active,
      payableObligation: source.payableObligation === false ? false : true,
      obligationKey:
        normalizeIdSegment(source.obligationKey) ||
        normalizeIdSegment(source.payableKey) ||
        kind,
      accountSystemKey:
        toCleanString(source.accountSystemKey) || DEDUCTION_ACCOUNT_KEYS[kind],
      notes: toCleanString(source.notes),
    });
  });

  return Array.from(byId.values());
};

export const calculateSalaryDeductions = ({
  baseSalaryAmount = 0,
  grossAmount = 0,
  salaryDeductions = [],
} = {}) => {
  const baseSalary = roundMoney(Math.max(0, toFiniteNumber(baseSalaryAmount)));
  const gross = roundMoney(Math.max(0, toFiniteNumber(grossAmount)));
  let available = gross;

  const deductionLines = normalizeSalaryDeductionLines(salaryDeductions)
    .filter((line) => line.active !== false)
    .map((line) => {
      const basisAmount = line.basis === 'gross_pay' ? gross : baseSalary;
      const rawAmount =
        line.mode === 'fixed' ? line.amount : (basisAmount * line.rate) / 100;
      const calculatedAmount = Math.min(roundMoney(rawAmount), available);
      available = roundMoney(available - calculatedAmount);
      return {
        ...line,
        basisAmount,
        calculatedAmount,
      };
    })
    .filter((line) => line.calculatedAmount > 0);

  const deductionsAmount = roundMoney(
    deductionLines.reduce((sum, line) => sum + line.calculatedAmount, 0),
  );

  return {
    deductionLines,
    deductionsAmount,
    netAmount: roundMoney(Math.max(gross - deductionsAmount, 0)),
  };
};
