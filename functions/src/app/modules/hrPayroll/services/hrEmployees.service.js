import { normalizeSalaryDeductionLines } from './hrSalaryDeductions.service.js';
import {
  normalizeHrDepositAccount,
  validateHrDepositAccount,
} from './hrDepositAccounts.service.js';

export const HR_EMPLOYEE_STATUSES = new Set([
  'active',
  'inactive',
  'suspended',
  'terminated',
]);

export const HR_PAY_TYPES = new Set([
  'salary',
  'hourly',
  'commission_only',
  'mixed',
]);

export const HR_DOCUMENT_TYPES = new Set([
  'cedula',
  'passport',
  'rnc',
  'other',
]);

export const HR_EMPLOYEE_GENDERS = new Set(['male', 'female', 'other']);

export const HR_PAYMENT_METHODS = new Set([
  'cash',
  'bank_transfer',
  'check',
  'other',
]);

export const HR_COMMISSION_TYPES = new Set(['percentage', 'fixed']);

export const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeDocumentId = (value) => {
  const normalized = toCleanString(value)
    ?.toUpperCase()
    .replace(/[^A-Z0-9-]+/g, '');
  return normalized || null;
};

export const normalizeEmployeeDocumentId = (value) => {
  const documentId = normalizeDocumentId(value);
  if (!documentId) return null;
  return documentId.slice(0, 32);
};

export const normalizeEmployeeDocumentType = (value) => {
  const normalized = toCleanString(value)
    ?.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
  if (!normalized) return 'cedula';
  if (['cedula', 'id', 'id_card'].includes(normalized)) return 'cedula';
  if (['pasaporte', 'passport'].includes(normalized)) return 'passport';
  if (HR_DOCUMENT_TYPES.has(normalized)) return normalized;
  return 'cedula';
};

export const normalizeEmployeeGender = (value) => {
  const normalized = toCleanString(value)
    ?.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
  if (!normalized) return null;
  if (['m', 'male', 'masculino', 'hombre'].includes(normalized)) {
    return 'male';
  }
  if (['f', 'female', 'femenino', 'mujer'].includes(normalized)) {
    return 'female';
  }
  if (['o', 'other', 'otro', 'otra'].includes(normalized)) return 'other';
  return HR_EMPLOYEE_GENDERS.has(normalized) ? normalized : null;
};

export const normalizeEmail = (value) => {
  const email = toCleanString(value)?.toLowerCase();
  return email || null;
};

export const normalizePhone = (value) => {
  const source = toCleanString(value);
  if (!source) return null;

  const compact = source.replace(/[^\d+]/g, '');
  if (compact.startsWith('+')) {
    const digits = compact.slice(1).replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  }

  const digits = compact.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
};

export const normalizeIdSegment = (value) => {
  const source = toCleanString(value);
  const normalized = source
    ?.toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120);
  return normalized || null;
};

export const resolveHrEmployeeId = (input, fallbackId = null) => {
  const employeeInput = asRecord(input);
  return (
    normalizeIdSegment(employeeInput.id) ||
    normalizeIdSegment(employeeInput.employeeId) ||
    normalizeIdSegment(employeeInput.code) ||
    normalizeIdSegment(fallbackId)
  );
};

const normalizeEnum = (value, allowedValues, fallback) => {
  const normalized = toCleanString(value)?.toLowerCase();
  return normalized && allowedValues.has(normalized) ? normalized : fallback;
};

const normalizeCurrency = (value) => {
  const currency = toCleanString(value)?.toUpperCase();
  return currency && /^[A-Z]{3}$/.test(currency) ? currency : 'DOP';
};

const normalizeRate = (value) => {
  if (value == null || value === '') return null;
  return Math.max(0, toFiniteNumber(value));
};

const normalizeCommissionType = (value) => {
  const normalized = toCleanString(value)?.toLowerCase();
  return HR_COMMISSION_TYPES.has(normalized) ? normalized : 'percentage';
};

export const normalizeServiceCommissionRules = (value) => {
  const entries = Array.isArray(value) ? value : [];
  const byServiceId = new Map();

  entries.forEach((entry) => {
    const source = asRecord(entry);
    const serviceId =
      toCleanString(source.serviceId) ||
      toCleanString(source.productId) ||
      toCleanString(source.id);
    if (!serviceId) return;

    byServiceId.set(serviceId, {
      id: toCleanString(source.id) || serviceId,
      serviceId,
      serviceName:
        toCleanString(source.serviceName) ||
        toCleanString(source.productName) ||
        toCleanString(source.name),
      type: normalizeCommissionType(source.type),
      rateValue: Math.max(
        0,
        toFiniteNumber(source.rateValue ?? source.defaultRate),
      ),
      active: source.active === false ? false : true,
    });
  });

  return Array.from(byServiceId.values());
};

const shouldEnableCommission = ({ payType, rawValue }) => {
  if (rawValue === false) return false;
  if (rawValue === true) return true;
  return payType === 'commission_only' || payType === 'mixed';
};

export const buildReadyToPayIssues = (employee) => {
  const issues = [];
  const status = employee.status || 'active';
  const depositAccount = normalizeHrDepositAccount(employee.depositAccount);
  const depositAccountErrors = validateHrDepositAccount(employee.depositAccount);
  const activeSalaryDeductions = Array.isArray(employee.salaryDeductions)
    ? employee.salaryDeductions.filter((line) => line.active !== false)
    : [];
  const hasCommissionConfig =
    employee.defaultCommissionRate != null ||
    (Array.isArray(employee.serviceCommissionRules) &&
      employee.serviceCommissionRules.some(
        (rule) => rule.active !== false && toFiniteNumber(rule.rateValue) > 0,
      ));

  if (status !== 'active') {
    issues.push('El empleado no esta activo.');
  }
  if (!employee.documentId) {
    issues.push('Falta documento de identidad.');
  }
  depositAccountErrors.forEach((error) => issues.push(error));
  if (
    employee.paymentMethod === 'bank_transfer' &&
    !depositAccount &&
    !employee.paymentDestination
  ) {
    issues.push('Falta cuenta o destino de transferencia.');
  }
  if (employee.payType === 'salary' && employee.baseSalaryAmount <= 0) {
    issues.push('Falta salario base.');
  }
  if (employee.payType === 'hourly' && employee.hourlyRateAmount <= 0) {
    issues.push('Falta tarifa por hora.');
  }
  if (
    employee.payType === 'commission_only' &&
    (!employee.commissionEnabled || !hasCommissionConfig)
  ) {
    issues.push('Falta configuracion de comision.');
  }
  if (
    employee.payType === 'mixed' &&
    employee.baseSalaryAmount <= 0 &&
    employee.hourlyRateAmount <= 0 &&
    (!employee.commissionEnabled || !hasCommissionConfig)
  ) {
    issues.push('Falta compensacion base o comision.');
  }
  if (
    activeSalaryDeductions.length > 0 &&
    ['salary', 'mixed'].includes(employee.payType) &&
    employee.baseSalaryAmount <= 0
  ) {
    issues.push('Las deducciones salariales requieren salario base.');
  }

  return issues;
};

export const normalizeHrEmployeeInput = (input, options = {}) => {
  const employeeInput = asRecord(input);
  const employeeId = resolveHrEmployeeId(employeeInput, options.fallbackId);
  const code = toCleanString(employeeInput.code)?.toUpperCase() || employeeId;
  const fullName =
    toCleanString(employeeInput.fullName) ||
    toCleanString(employeeInput.name) ||
    toCleanString(employeeInput.displayName);
  const legalName = toCleanString(employeeInput.legalName) || fullName;
  const payType = normalizeEnum(employeeInput.payType, HR_PAY_TYPES, 'salary');
  const paymentMethod = normalizeEnum(
    employeeInput.paymentMethod,
    HR_PAYMENT_METHODS,
    'bank_transfer',
  );
  const commissionEnabled = shouldEnableCommission({
    payType,
    rawValue: employeeInput.commissionEnabled,
  });

  const employee = {
    employeeId,
    id: employeeId,
    partyId:
      normalizeIdSegment(employeeInput.partyId) ||
      normalizeIdSegment(employeeId),
    code,
    fullName,
    legalName,
    displayName: fullName,
    documentType: normalizeEmployeeDocumentType(
      employeeInput.documentType ||
        employeeInput.employeeDocumentType ||
        employeeInput.identificationType,
    ),
    documentId: normalizeEmployeeDocumentId(
      employeeInput.documentId ||
        employeeInput.employeeDocumentId ||
        employeeInput.identification,
    ),
    gender: normalizeEmployeeGender(
      employeeInput.gender ||
        employeeInput.genero ||
        employeeInput.sex ||
        employeeInput.sexo,
    ),
    email: normalizeEmail(employeeInput.email),
    phone: normalizePhone(employeeInput.phone || employeeInput.tel),
    address: toCleanString(employeeInput.address),
    linkedUserId: toCleanString(
      employeeInput.linkedUserId || employeeInput.userId || employeeInput.uid,
    ),
    status: normalizeEnum(employeeInput.status, HR_EMPLOYEE_STATUSES, 'active'),
    payType,
    baseSalaryAmount: Math.max(
      0,
      toFiniteNumber(employeeInput.baseSalaryAmount),
    ),
    hourlyRateAmount: Math.max(
      0,
      toFiniteNumber(employeeInput.hourlyRateAmount),
    ),
    currency: normalizeCurrency(employeeInput.currency),
    paymentMethod,
    paymentDestination: toCleanString(employeeInput.paymentDestination),
    depositAccount: normalizeHrDepositAccount(employeeInput.depositAccount),
    commissionEnabled,
    defaultCommissionType: normalizeEnum(
      employeeInput.defaultCommissionType,
      HR_COMMISSION_TYPES,
      'percentage',
    ),
    defaultCommissionRate: normalizeRate(employeeInput.defaultCommissionRate),
    salaryDeductions: normalizeSalaryDeductionLines(
      employeeInput.salaryDeductions,
    ),
    serviceCommissionRules: normalizeServiceCommissionRules(
      employeeInput.serviceCommissionRules,
    ),
    notes: toCleanString(employeeInput.notes),
  };

  const readyToPayIssues = buildReadyToPayIssues(employee);

  return {
    ...employee,
    readyToPayIssues,
    readyToPayStatus: readyToPayIssues.length ? 'needs_review' : 'ready',
  };
};

export const validateHrEmployeeInput = (employee) => {
  const errors = [];
  if (!employee.employeeId) errors.push('employeeId es requerido.');
  if (!employee.code) errors.push('codigo es requerido.');
  if (!employee.fullName) errors.push('nombre es requerido.');
  if (!employee.partyId) errors.push('partyId es requerido.');
  validateHrDepositAccount(employee.depositAccount).forEach((error) => {
    errors.push(error);
  });
  return errors;
};

export const buildBusinessPartyPayload = ({
  businessId,
  employee,
  timestamp,
  authUid,
  isNew,
}) => ({
  id: employee.partyId,
  businessId,
  type: 'person',
  displayName: employee.fullName,
  legalName: employee.legalName || employee.fullName,
  documentType: employee.documentType,
  documentId: employee.documentId,
  gender: employee.gender,
  email: employee.email,
  phone: employee.phone,
  status: employee.status === 'active' ? 'active' : 'inactive',
  roles: {
    employee: true,
  },
  linkedUserIds: employee.linkedUserId ? [employee.linkedUserId] : [],
  profileRefs: {
    hrEmployeeId: employee.employeeId,
  },
  source: 'hrPayroll',
  ...(isNew ? { createdAt: timestamp, createdBy: authUid } : {}),
  updatedAt: timestamp,
  updatedBy: authUid,
});

export const buildHrEmployeePayload = ({
  businessId,
  employee,
  timestamp,
  authUid,
  isNew,
}) => ({
  id: employee.employeeId,
  employeeId: employee.employeeId,
  businessId,
  partyId: employee.partyId,
  code: employee.code,
  fullName: employee.fullName,
  legalName: employee.legalName,
  displayName: employee.displayName,
  documentType: employee.documentType,
  documentId: employee.documentId,
  gender: employee.gender,
  email: employee.email,
  phone: employee.phone,
  address: employee.address,
  linkedUserId: employee.linkedUserId,
  status: employee.status,
  payType: employee.payType,
  baseSalaryAmount: employee.baseSalaryAmount,
  hourlyRateAmount: employee.hourlyRateAmount,
  salaryDeductions: employee.salaryDeductions,
  currency: employee.currency,
  paymentMethod: employee.paymentMethod,
  paymentDestination: employee.paymentDestination,
  depositAccount: employee.depositAccount ?? null,
  commissionEnabled: employee.commissionEnabled,
  defaultCommissionType: employee.defaultCommissionType,
  defaultCommissionRate: employee.defaultCommissionRate,
  serviceCommissionRules: employee.serviceCommissionRules,
  readyToPayStatus: employee.readyToPayStatus,
  readyToPayIssues: employee.readyToPayIssues,
  partySnapshot: {
    displayName: employee.displayName,
    documentType: employee.documentType,
    documentId: employee.documentId,
    gender: employee.gender,
    email: employee.email,
    phone: employee.phone,
  },
  notes: employee.notes,
  ...(isNew ? { createdAt: timestamp, createdBy: authUid } : {}),
  updatedAt: timestamp,
  updatedBy: authUid,
});

export const toSerializableHrEmployee = (employee) => {
  if (!employee || typeof employee !== 'object') return null;
  const next = { ...employee };
  delete next.createdAt;
  delete next.updatedAt;
  return next;
};
