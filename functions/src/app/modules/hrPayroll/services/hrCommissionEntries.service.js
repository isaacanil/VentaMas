import { db, FieldValue } from '../../../core/config/firebase.js';

const ENTRY_STATUSES = new Set([
  'calculated',
  'eligible',
  'included_in_cut',
  'approved',
  'paid',
  'reversed',
  'cancelled',
  'requires_adjustment',
]);

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundMoney = (value) => Number(safeNumber(value).toFixed(2));

const sanitizeDocId = (value) =>
  toCleanString(value)?.replace(/[^a-zA-Z0-9_-]/g, '_') || null;

const withoutUndefined = (value) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  );

const readCommissionSnapshot = (serviceCommission) =>
  asRecord(serviceCommission.commission);

const readCollaboratorSnapshot = (serviceCommission) =>
  asRecord(serviceCommission.collaborator);

const readServiceSnapshot = (serviceCommission) =>
  asRecord(serviceCommission.service);

const resolveSourceCommissionId = (serviceCommission) =>
  toCleanString(serviceCommission.id) ||
  sanitizeDocId(
    [
      serviceCommission.invoiceId,
      serviceCommission.lineId,
      serviceCommission.collaboratorId,
    ]
      .filter(Boolean)
      .join('_'),
  );

export const resolveHrCommissionEntryId = (serviceCommission) => {
  const sourceCommissionId = resolveSourceCommissionId(serviceCommission);
  return sourceCommissionId
    ? sanitizeDocId(`service_${sourceCommissionId}`)
    : null;
};

const addIndexValue = (index, key, employee) => {
  const value = toCleanString(key);
  if (!value || index.has(value)) return;
  index.set(value, employee);
};

export const buildHrEmployeeLookupIndex = (employees = []) => {
  const index = new Map();

  employees.forEach((employeeLike) => {
    const employee = asRecord(employeeLike);
    if (!Object.keys(employee).length) return;

    const employeeId =
      toCleanString(employee.employeeId) || toCleanString(employee.id);
    const code = toCleanString(employee.code);
    const linkedUserId = toCleanString(employee.linkedUserId);
    const partyId = toCleanString(employee.partyId);

    addIndexValue(index, employeeId, employee);
    addIndexValue(index, code, employee);
    addIndexValue(index, linkedUserId, employee);
    addIndexValue(index, partyId, employee);
    addIndexValue(index, `employee:${employeeId}`, employee);
    addIndexValue(index, `code:${code}`, employee);
    addIndexValue(index, `user:${linkedUserId}`, employee);
    addIndexValue(index, `party:${partyId}`, employee);
  });

  return index;
};

export const resolveEmployeeForServiceCommission = (
  serviceCommission,
  employeeIndex = new Map(),
) => {
  const collaborator = readCollaboratorSnapshot(serviceCommission);
  const candidates = [
    toCleanString(serviceCommission.hrEmployeeId),
    toCleanString(collaborator.hrEmployeeId),
    toCleanString(serviceCommission.employeeId),
    toCleanString(collaborator.employeeId),
    toCleanString(serviceCommission.collaboratorId),
    toCleanString(collaborator.id),
    toCleanString(serviceCommission.linkedUserId),
    toCleanString(collaborator.linkedUserId),
    toCleanString(serviceCommission.collaboratorCode),
    toCleanString(collaborator.code),
    toCleanString(serviceCommission.partyId),
    toCleanString(collaborator.partyId),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const direct = employeeIndex.get(candidate);
    if (direct) return direct;
    const byEmployee = employeeIndex.get(`employee:${candidate}`);
    if (byEmployee) return byEmployee;
    const byUser = employeeIndex.get(`user:${candidate}`);
    if (byUser) return byUser;
    const byCode = employeeIndex.get(`code:${candidate}`);
    if (byCode) return byCode;
    const byParty = employeeIndex.get(`party:${candidate}`);
    if (byParty) return byParty;
  }

  return null;
};

const resolveEntryStatus = ({ employeeId, serviceCommission }) => {
  const sourceStatus = toCleanString(serviceCommission.status)?.toLowerCase();
  if (sourceStatus === 'voided' || sourceStatus === 'cancelled') {
    return 'cancelled';
  }
  if (!employeeId) return 'requires_adjustment';
  return 'calculated';
};

export const buildHrCommissionEntryFromServiceCommission = ({
  businessId,
  employeeIndex = new Map(),
  serviceCommission,
  timestamp = FieldValue.serverTimestamp(),
  userId = null,
}) => {
  const source = asRecord(serviceCommission);
  const entryId = resolveHrCommissionEntryId(source);
  if (!businessId || !entryId) return null;

  const commission = readCommissionSnapshot(source);
  const collaborator = readCollaboratorSnapshot(source);
  const service = readServiceSnapshot(source);
  const employee = resolveEmployeeForServiceCommission(source, employeeIndex);
  const employeeId =
    toCleanString(source.hrEmployeeId) ||
    toCleanString(collaborator.hrEmployeeId) ||
    toCleanString(employee?.employeeId) ||
    toCleanString(employee?.id);
  const partyId =
    toCleanString(source.partyId) ||
    toCleanString(collaborator.partyId) ||
    toCleanString(employee?.partyId);
  const collaboratorCode =
    toCleanString(source.collaboratorCode) ||
    toCleanString(collaborator.code) ||
    toCleanString(employee?.code);
  const collaboratorName =
    toCleanString(source.collaboratorName) ||
    toCleanString(collaborator.name) ||
    toCleanString(employee?.fullName) ||
    toCleanString(employee?.displayName);
  const sourceCommissionId = resolveSourceCommissionId(source);
  const status = resolveEntryStatus({
    employeeId,
    serviceCommission: source,
  });
  const commissionType =
    commission.type === 'fixed' || commission.type === 'percentage'
      ? commission.type
      : 'percentage';

  return withoutUndefined({
    id: entryId,
    businessId,
    employeeId: employeeId || null,
    employeeCode: collaboratorCode || null,
    employeeNameSnapshot: collaboratorName || null,
    partyId: partyId || null,
    linkedUserId:
      toCleanString(source.linkedUserId) ||
      toCleanString(collaborator.linkedUserId) ||
      toCleanString(employee?.linkedUserId) ||
      null,
    invoiceId: toCleanString(source.invoiceId),
    invoiceNumber: toCleanString(source.invoiceNumber),
    invoiceItemId: toCleanString(source.lineId),
    sourceType: 'invoice_line',
    sourceCommissionId,
    customerId: toCleanString(source.customerId),
    customerNameSnapshot: toCleanString(source.customerNameSnapshot),
    serviceId:
      toCleanString(source.serviceId) || toCleanString(service.id) || null,
    serviceName:
      toCleanString(source.serviceName) || toCleanString(service.name) || null,
    commissionRuleId:
      toCleanString(source.commissionRuleId) || 'service_default',
    commissionRuleNameSnapshot:
      toCleanString(source.commissionRuleNameSnapshot) ||
      'Comision de servicio',
    calculationBase:
      toCleanString(commission.calculationBase) || 'netSubtotalWithoutTax',
    baseAmount: roundMoney(source.billedAmount ?? source.amountFactured),
    rateType: commissionType,
    rateValue: Math.max(0, safeNumber(commission.rateValue)),
    commissionAmount: roundMoney(source.commissionAmount),
    currency: toCleanString(source.currency) || 'DOP',
    status: ENTRY_STATUSES.has(status) ? status : 'requires_adjustment',
    sourceStatus: toCleanString(source.status) || null,
    periodId: null,
    payrollRunId: null,
    employeePaymentId: null,
    accountingEventId: null,
    journalEntryId: null,
    dedupeKey: [
      businessId,
      'serviceCommission',
      sourceCommissionId,
      employeeId || 'unresolved',
    ].join('|'),
    date: source.date || timestamp,
    sourceSnapshot: {
      serviceCommissionId: sourceCommissionId,
      collaborator: {
        id:
          toCleanString(source.collaboratorId) ||
          toCleanString(collaborator.id) ||
          null,
        code: collaboratorCode || null,
        name: collaboratorName || null,
      },
      service: {
        id:
          toCleanString(source.serviceId) || toCleanString(service.id) || null,
        name:
          toCleanString(source.serviceName) ||
          toCleanString(service.name) ||
          null,
      },
    },
    createdAt: timestamp,
    createdBy: userId,
    updatedAt: timestamp,
    updatedBy: userId,
  });
};

export const buildHrCommissionEntriesFromServiceCommissions = ({
  businessId,
  employeeIndex = new Map(),
  serviceCommissions = [],
  timestamp = FieldValue.serverTimestamp(),
  userId = null,
}) =>
  serviceCommissions
    .map((serviceCommission) =>
      buildHrCommissionEntryFromServiceCommission({
        businessId,
        employeeIndex,
        serviceCommission,
        timestamp,
        userId,
      }),
    )
    .filter(Boolean);

export const syncHrCommissionEntriesFromServiceCommissionRecordsTx = (
  transaction,
  {
    businessId,
    employeeIndex = new Map(),
    records = [],
    timestamp = FieldValue.serverTimestamp(),
    userId = null,
  },
) => {
  const entries = buildHrCommissionEntriesFromServiceCommissions({
    businessId,
    employeeIndex,
    serviceCommissions: records,
    timestamp,
    userId,
  });

  entries.forEach((entry) => {
    const ref = db.doc(
      `businesses/${businessId}/hrCommissionEntries/${entry.id}`,
    );
    transaction.set(ref, entry, { merge: true });
  });

  return entries;
};

export const voidHrCommissionEntriesForServiceCommissionDocsTx = (
  transaction,
  { authUid, businessId, commissionDocs = [], reasonLabel, voidedAt },
) => {
  const timestamp = FieldValue.serverTimestamp();

  commissionDocs.forEach((docSnapshot) => {
    const source = {
      id: docSnapshot.id,
      ...(typeof docSnapshot.data === 'function' ? docSnapshot.data() : {}),
    };
    const entryId = resolveHrCommissionEntryId(source);
    if (!entryId) return;

    const ref = db.doc(
      `businesses/${businessId}/hrCommissionEntries/${entryId}`,
    );
    transaction.set(
      ref,
      {
        status: 'cancelled',
        sourceStatus: 'voided',
        voidedAt,
        voidedBy: authUid,
        voidReason: reasonLabel,
        updatedAt: timestamp,
        updatedBy: authUid,
      },
      { merge: true },
    );
  });
};
