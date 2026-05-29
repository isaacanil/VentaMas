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

export const normalizeEmail = (value) => {
  const email = toCleanString(value)?.toLowerCase();
  return email || null;
};

export const normalizePhone = (value) => {
  const phone = toCleanString(value)?.replace(/[^\d+()-\s]+/g, '');
  return phone || null;
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

const shouldEnableCommission = ({ payType, rawValue }) => {
  if (rawValue === false) return false;
  if (rawValue === true) return true;
  return payType === 'commission_only' || payType === 'mixed';
};

export const buildReadyToPayIssues = (employee) => {
  const issues = [];
  const status = employee.status || 'active';

  if (status !== 'active') {
    issues.push('El empleado no esta activo.');
  }
  if (!employee.documentId) {
    issues.push('Falta documento de identidad.');
  }
  if (
    employee.paymentMethod === 'bank_transfer' &&
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
    (!employee.commissionEnabled || employee.defaultCommissionRate == null)
  ) {
    issues.push('Falta configuracion de comision.');
  }
  if (
    employee.payType === 'mixed' &&
    employee.baseSalaryAmount <= 0 &&
    employee.hourlyRateAmount <= 0 &&
    (!employee.commissionEnabled || employee.defaultCommissionRate == null)
  ) {
    issues.push('Falta compensacion base o comision.');
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
    documentId: normalizeEmployeeDocumentId(
      employeeInput.documentId ||
        employeeInput.employeeDocumentId ||
        employeeInput.identification,
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
    commissionEnabled,
    defaultCommissionType: normalizeEnum(
      employeeInput.defaultCommissionType,
      HR_COMMISSION_TYPES,
      'percentage',
    ),
    defaultCommissionRate: normalizeRate(employeeInput.defaultCommissionRate),
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
  documentId: employee.documentId,
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
  documentId: employee.documentId,
  email: employee.email,
  phone: employee.phone,
  address: employee.address,
  linkedUserId: employee.linkedUserId,
  status: employee.status,
  payType: employee.payType,
  baseSalaryAmount: employee.baseSalaryAmount,
  hourlyRateAmount: employee.hourlyRateAmount,
  currency: employee.currency,
  paymentMethod: employee.paymentMethod,
  paymentDestination: employee.paymentDestination,
  commissionEnabled: employee.commissionEnabled,
  defaultCommissionType: employee.defaultCommissionType,
  defaultCommissionRate: employee.defaultCommissionRate,
  readyToPayStatus: employee.readyToPayStatus,
  readyToPayIssues: employee.readyToPayIssues,
  partySnapshot: {
    displayName: employee.displayName,
    documentId: employee.documentId,
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
