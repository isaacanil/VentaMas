import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/auth/services/userAccess.service.js';

const CHART_ACCOUNT_TYPES = new Set([
  'asset',
  'liability',
  'equity',
  'income',
  'expense',
]);
const NORMAL_SIDES = new Set(['debit', 'credit']);
const CURRENCY_MODES = new Set(['functional_only', 'multi_currency_reference']);
const PROFILE_STATUSES = new Set(['active', 'inactive']);
const CHART_OF_ACCOUNTS_MAX_LEVEL = 6;
const BANK_ACCOUNT_TYPES = new Set([
  'checking',
  'savings',
  'credit_card',
  'other',
]);
const BANK_CHART_PARENT_CODE = '1110';
const BANK_CHART_PARENT_SYSTEM_KEY = 'bank';
const BANK_ACCOUNT_CHART_METADATA_SOURCE = 'bank_account';
const BANK_ACCOUNT_TYPE_LABELS = new Map([
  ['checking', 'Corriente'],
  ['savings', 'Ahorros'],
  ['credit_card', 'Tarjeta'],
  ['other', 'Banco'],
]);
const ACCOUNTING_EVENT_MODULES = new Map([
  ['invoice.committed', 'sales'],
  ['invoice.voided', 'sales'],
  ['accounts_receivable.payment.recorded', 'accounts_receivable'],
  ['accounts_receivable.payment.voided', 'accounts_receivable'],
  ['customer_credit_note.issued', 'accounts_receivable'],
  ['customer_credit_note.applied', 'accounts_receivable'],
  ['customer_debit_note.issued', 'accounts_receivable'],
  ['purchase.committed', 'purchases'],
  ['accounts_payable.payment.recorded', 'accounts_payable'],
  ['accounts_payable.payment.voided', 'accounts_payable'],
  ['supplier_credit_note.issued', 'accounts_payable'],
  ['supplier_credit_note.applied', 'accounts_payable'],
  ['expense.recorded', 'expenses'],
  ['cash_over_short.recorded', 'cash'],
  ['bank_statement_adjustment.recorded', 'banking'],
  ['internal_transfer.posted', 'cash'],
  ['inventory.cogs.recorded', 'sales'],
  ['inventory.cogs.voided', 'sales'],
  ['manual.entry.recorded', 'general_ledger'],
  ['fx_settlement.recorded', 'fx'],
  ['fx_settlement.voided', 'fx'],
  ['hr_commission.accrued', 'payroll'],
  ['hr_payroll.payment.recorded', 'payroll'],
]);
const AMOUNT_SOURCES = new Set([
  'document_total',
  'net_sales',
  'sale_settled_amount',
  'sale_receivable_balance',
  'sale_cash_received',
  'sale_bank_received',
  'sale_other_received',
  'credit_note_net_total',
  'purchase_subtotal',
  'purchase_tax',
  'purchase_total',
  'purchase_net_payable',
  'purchase_withholding_itbis',
  'purchase_withholding_isr',
  'expense_subtotal',
  'expense_tax',
  'expense_total',
  'expense_net_payable',
  'expense_withholding_itbis',
  'expense_withholding_isr',
  'tax_total',
  'cash_over_short_gain',
  'cash_over_short_loss',
  'bank_statement_adjustment_gain',
  'bank_statement_adjustment_loss',
  'accounts_receivable_payment_amount',
  'accounts_receivable_applied_amount',
  'accounts_receivable_collected_amount',
  'accounts_receivable_withholding_amount',
  'accounts_payable_payment_amount',
  'accounts_payable_cash_paid',
  'accounts_payable_bank_paid',
  'accounts_payable_credit_note_applied',
  'accounts_payable_withholding_itbis',
  'accounts_payable_withholding_isr',
  'payroll_accrual_amount',
  'payroll_net_payable_amount',
  'payroll_tax_deductions_amount',
  'payroll_other_deductions_amount',
  'transfer_amount',
  'fx_gain',
  'fx_loss',
]);
const STRUCTURAL_ACCOUNT_FIELDS = [
  'code',
  'type',
  'parentId',
  'postingAllowed',
  'normalSide',
  'currencyMode',
];

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toBoolean = (value, fallback = true) =>
  typeof value === 'boolean' ? value : fallback;

const toFiniteNumber = (value, fallback = 100) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toNullableFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveBusinessId = (payload) =>
  toCleanString(payload.businessId) || toCleanString(payload.businessID);

const normalizeTimestampLike = (value) => {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value;
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return Timestamp.fromDate(value);
  }

  const record = asRecord(value);
  const seconds = Number(record.seconds ?? record._seconds);
  const nanoseconds = Number(record.nanoseconds ?? record._nanoseconds ?? 0);
  if (Number.isFinite(seconds)) {
    return Timestamp.fromMillis(seconds * 1000 + nanoseconds / 1000000);
  }

  const parsedDate = new Date(value);
  return Number.isFinite(parsedDate.getTime())
    ? Timestamp.fromDate(parsedDate)
    : null;
};

const normalizeCurrencyCode = (value, fallback = 'DOP') =>
  (toCleanString(value) || fallback).toUpperCase();

const normalizeAccountNumberLast4 = (value) => {
  const digits = (toCleanString(value) || '').replace(/\D/g, '');
  return digits ? digits.slice(-4) : null;
};

const normalizeBankAccountDraft = (value) => {
  const record = asRecord(value);
  const type = toCleanString(record.type);

  return {
    name: toCleanString(record.name) || '',
    currency: normalizeCurrencyCode(record.currency),
    status: 'active',
    type: BANK_ACCOUNT_TYPES.has(type) ? type : null,
    institutionName: toCleanString(record.institutionName),
    bankCode: toCleanString(record.bankCode),
    countryCode: normalizeCurrencyCode(record.countryCode, 'DO'),
    isCustomBank: record.isCustomBank === true,
    accountNumberLast4: normalizeAccountNumberLast4(
      record.accountNumberLast4 ?? record.last4,
    ),
    openingBalance: toNullableFiniteNumber(record.openingBalance),
    openingBalanceDate: normalizeTimestampLike(record.openingBalanceDate),
    notes: toCleanString(record.notes),
    metadata: asRecord(record.metadata),
  };
};

const resolveNormalSide = (type, value) => {
  if (NORMAL_SIDES.has(value)) return value;
  return type === 'asset' || type === 'expense' ? 'debit' : 'credit';
};

const normalizeConditions = (value) => {
  const record = asRecord(value);
  return {
    paymentTerm: ['cash', 'credit'].includes(record.paymentTerm)
      ? record.paymentTerm
      : 'any',
    settlementKind: ['cash', 'bank', 'mixed', 'other'].includes(
      record.settlementKind,
    )
      ? record.settlementKind
      : 'any',
    taxTreatment: ['taxed', 'untaxed'].includes(record.taxTreatment)
      ? record.taxTreatment
      : 'any',
    documentNature: ['inventory', 'expense', 'asset', 'service'].includes(
      record.documentNature,
    )
      ? record.documentNature
      : 'any',
    settlementTiming: ['immediate', 'deferred'].includes(
      record.settlementTiming,
    )
      ? record.settlementTiming
      : 'any',
    transferDirection: [
      'cash_to_bank',
      'bank_to_cash',
      'bank_to_bank',
      'cash_to_cash',
    ].includes(record.transferDirection)
      ? record.transferDirection
      : 'any',
  };
};

const normalizeAccountDraft = (value, current = {}) => {
  const record = { ...asRecord(current), ...asRecord(value) };
  const type = CHART_ACCOUNT_TYPES.has(record.type) ? record.type : 'asset';

  return {
    code: toCleanString(record.code) || '',
    name: toCleanString(record.name) || '',
    type,
    subtype: toCleanString(record.subtype),
    parentId: toCleanString(record.parentId),
    postingAllowed: toBoolean(record.postingAllowed, true),
    status: record.status === 'inactive' ? 'inactive' : 'active',
    normalSide: resolveNormalSide(type, record.normalSide),
    currencyMode: CURRENCY_MODES.has(record.currencyMode)
      ? record.currencyMode
      : 'functional_only',
    systemKey: toCleanString(record.systemKey),
    metadata: asRecord(record.metadata),
  };
};

const findBankChartParentAccount = (accounts) =>
  accounts.find(
    (account) =>
      account.status === 'active' &&
      toCleanString(account.systemKey) === BANK_CHART_PARENT_SYSTEM_KEY,
  ) ??
  accounts.find(
    (account) =>
      account.status === 'active' &&
      toCleanString(account.code) === BANK_CHART_PARENT_CODE,
  ) ??
  null;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildBankLedgerAccountName = (bankAccount) => {
  const institutionName = toCleanString(bankAccount.institutionName);
  const typeLabel = bankAccount.type
    ? BANK_ACCOUNT_TYPE_LABELS.get(bankAccount.type) ?? null
    : null;
  const last4 = toCleanString(bankAccount.accountNumberLast4);
  const descriptiveName = [institutionName, typeLabel, last4]
    .filter(Boolean)
    .join(' ');

  return descriptiveName || toCleanString(bankAccount.name) || 'Cuenta bancaria';
};

const buildNextBankLedgerAccountCode = ({ accounts, parentCode }) => {
  const childCodePattern = new RegExp(`^${escapeRegExp(parentCode)}\\.(\\d+)$`);
  const usedCodes = new Set(
    accounts
      .map((account) => toCleanString(account.code))
      .filter(Boolean)
      .map((code) => code.toLowerCase()),
  );
  let sequence =
    accounts.reduce((currentMax, account) => {
      const code = toCleanString(account.code);
      const match = code ? code.match(childCodePattern) : null;
      if (!match) return currentMax;
      const parsed = Number.parseInt(match[1] ?? '', 10);
      return Number.isFinite(parsed) ? Math.max(currentMax, parsed) : currentMax;
    }, 0) + 1;

  while (true) {
    const candidate = `${parentCode}.${String(sequence).padStart(2, '0')}`;
    if (!usedCodes.has(candidate.toLowerCase())) {
      return candidate;
    }
    sequence += 1;
  }
};

const buildBankLedgerAccountDraft = ({
  accounts,
  bankAccount,
  bankAccountId,
  parentAccount,
}) =>
  normalizeAccountDraft({
    code: buildNextBankLedgerAccountCode({
      accounts,
      parentCode: toCleanString(parentAccount.code) || BANK_CHART_PARENT_CODE,
    }),
    name: buildBankLedgerAccountName(bankAccount),
    type: 'asset',
    subtype: 'bank_account',
    parentId: parentAccount.id,
    postingAllowed: true,
    status: 'active',
    normalSide: 'debit',
    currencyMode: 'multi_currency_reference',
    systemKey: null,
    metadata: {
      source: BANK_ACCOUNT_CHART_METADATA_SOURCE,
      bankAccountId,
      bankAccountName: bankAccount.name,
      bankAccountCurrency: bankAccount.currency,
    },
  });

const findExistingBankLedgerAccount = ({ accounts, bankAccountId }) =>
  accounts.find((account) => {
    const metadata = asRecord(account.metadata);
    return (
      account.status === 'active' &&
      toCleanString(metadata.source) === BANK_ACCOUNT_CHART_METADATA_SOURCE &&
      toCleanString(metadata.bankAccountId) === bankAccountId
    );
  }) ?? null;

const normalizePostingLine = (value, accountsById) => {
  const record = asRecord(value);
  const accountId = toCleanString(record.accountId);
  const account = accountId ? accountsById.get(accountId) : null;

  return {
    id:
      toCleanString(record.id) ||
      `line_${Math.random().toString(36).slice(2, 10)}`,
    side: record.side === 'credit' ? 'credit' : 'debit',
    accountId,
    accountCode: account?.code || toCleanString(record.accountCode),
    accountName: account?.name || toCleanString(record.accountName),
    accountSystemKey:
      account?.systemKey || toCleanString(record.accountSystemKey),
    amountSource: AMOUNT_SOURCES.has(record.amountSource)
      ? record.amountSource
      : 'document_total',
    description: toCleanString(record.description),
    omitIfZero: record.omitIfZero !== false,
    metadata: asRecord(record.metadata),
  };
};

const normalizePostingProfileDraft = (value, accountsById, current = {}) => {
  const record = { ...asRecord(current), ...asRecord(value) };
  const eventType = toCleanString(record.eventType);
  const moduleKey = ACCOUNTING_EVENT_MODULES.get(eventType);
  const lines = Array.isArray(record.linesTemplate)
    ? record.linesTemplate.map((line) =>
        normalizePostingLine(line, accountsById),
      )
    : [];

  return {
    name: toCleanString(record.name) || '',
    description: toCleanString(record.description),
    eventType,
    moduleKey,
    status: PROFILE_STATUSES.has(record.status) ? record.status : 'active',
    priority: toFiniteNumber(record.priority, 100),
    conditions: normalizeConditions(record.conditions),
    linesTemplate: lines,
    metadata: asRecord(record.metadata),
  };
};

const serializeStructuralAccount = (account) => {
  const record = asRecord(account);
  return STRUCTURAL_ACCOUNT_FIELDS.reduce((accumulator, key) => {
    accumulator[key] = record[key] ?? null;
    return accumulator;
  }, {});
};

const hasStructuralAccountChanges = (current, next) =>
  JSON.stringify(serializeStructuralAccount(current)) !==
  JSON.stringify(serializeStructuralAccount(next));

const serializeProfileStructure = (profile) => {
  const record = asRecord(profile);
  return {
    eventType: record.eventType,
    priority: record.priority,
    conditions: normalizeConditions(record.conditions),
    linesTemplate: (Array.isArray(record.linesTemplate)
      ? record.linesTemplate
      : []
    ).map((line) => ({
      side: line.side,
      accountId: line.accountId ?? null,
      accountSystemKey: line.accountSystemKey ?? null,
      amountSource: line.amountSource,
      description: line.description ?? null,
      omitIfZero: line.omitIfZero !== false,
      metadata: asRecord(line.metadata),
    })),
  };
};

const hasStructuralPostingProfileChanges = (current, next) =>
  JSON.stringify(serializeProfileStructure(current)) !==
  JSON.stringify(serializeProfileStructure(next));

const assertConfigurationAccess = async ({ authUid, businessId }) => {
  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.FINANCE_CONFIG,
  });
};

const assertAccountDraft = (draft) => {
  if (!draft.code || !draft.name) {
    throw new HttpsError(
      'invalid-argument',
      'La cuenta contable requiere código y nombre.',
    );
  }
  if (!CHART_ACCOUNT_TYPES.has(draft.type)) {
    throw new HttpsError(
      'invalid-argument',
      'Tipo de cuenta contable inválido.',
    );
  }
};

const assertBankAccountDraft = (draft) => {
  if (!draft.name) {
    throw new HttpsError(
      'invalid-argument',
      'El nombre de la cuenta bancaria es requerido.',
    );
  }
  if (!draft.currency) {
    throw new HttpsError(
      'invalid-argument',
      'La moneda de la cuenta bancaria es requerida.',
    );
  }
};

const assertUniqueAccountCode = ({ accounts, accountId, code }) => {
  const normalizedCode = code.trim().toLowerCase();
  const duplicate = accounts.find(
    (account) =>
      account.id !== accountId &&
      toCleanString(account.code)?.toLowerCase() === normalizedCode,
  );
  if (duplicate) {
    throw new HttpsError(
      'already-exists',
      'Ya existe una cuenta contable con ese código.',
    );
  }
};

const buildAccountChildrenByParentId = (accounts = []) =>
  accounts.reduce((accumulator, account) => {
    const parentId = toCleanString(account.parentId);
    if (!parentId) return accumulator;

    const children = accumulator.get(parentId) || [];
    children.push(account);
    accumulator.set(parentId, children);
    return accumulator;
  }, new Map());

const getAccountLevel = (account, accountsById) => {
  let level = 1;
  let currentParentId = toCleanString(account.parentId);
  const visitedIds = new Set([account.id]);

  while (currentParentId) {
    if (visitedIds.has(currentParentId)) break;
    const parent = accountsById.get(currentParentId);
    if (!parent) break;

    visitedIds.add(currentParentId);
    level += 1;
    currentParentId = toCleanString(parent.parentId);
  }

  return level;
};

const getMaxDescendantDepth = (accountId, childrenByParentId) => {
  const children = childrenByParentId.get(accountId) || [];
  if (!children.length) return 0;

  return Math.max(
    ...children.map(
      (childAccount) =>
        1 + getMaxDescendantDepth(childAccount.id, childrenByParentId),
    ),
  );
};

const assertValidAccountParent = ({
  accounts = [],
  accountsById,
  accountId,
  draft,
}) => {
  if (!draft.parentId) return;
  if (draft.parentId === accountId) {
    throw new HttpsError(
      'invalid-argument',
      'Una cuenta contable no puede ser padre de sí misma.',
    );
  }

  const parent = accountsById.get(draft.parentId);
  if (!parent) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta padre seleccionada no existe.',
    );
  }
  if (parent.status !== 'active') {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta padre debe estar activa.',
    );
  }
  if (parent.type !== draft.type) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta padre debe pertenecer al mismo tipo contable.',
    );
  }

  let currentParentId = parent.parentId;
  while (currentParentId) {
    if (currentParentId === accountId) {
      throw new HttpsError(
        'failed-precondition',
        'La cuenta padre no puede ser una subcuenta de la cuenta actual.',
      );
    }
    currentParentId = accountsById.get(currentParentId)?.parentId ?? null;
  }

  const childrenByParentId = buildAccountChildrenByParentId(accounts);
  const nextLevel = getAccountLevel(parent, accountsById) + 1;
  const maxDescendantDepth = getMaxDescendantDepth(
    accountId,
    childrenByParentId,
  );
  if (nextLevel + maxDescendantDepth > CHART_OF_ACCOUNTS_MAX_LEVEL) {
    throw new HttpsError(
      'failed-precondition',
      `El catálogo solo permite subcuentas hasta el nivel ${CHART_OF_ACCOUNTS_MAX_LEVEL}.`,
    );
  }
};

const assertAccountPostingClassification = ({ accounts, accountId, draft }) => {
  const hasChildren = accounts.some((account) => account.parentId === accountId);
  if (hasChildren && draft.postingAllowed !== false) {
    throw new HttpsError(
      'failed-precondition',
      'Una Cuenta Mayor con subcuentas no puede recibir asientos directos.',
    );
  }
};

const loadAccounts = async (transaction, businessId) => {
  const snap = await transaction.get(
    db.collection(`businesses/${businessId}/chartOfAccounts`),
  );
  const accounts = snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...asRecord(docSnap.data()),
  }));
  return {
    accounts,
    accountsById: new Map(accounts.map((account) => [account.id, account])),
  };
};

const loadBankAccounts = async (transaction, businessId) => {
  const snap = await transaction.get(
    db.collection(`businesses/${businessId}/bankAccounts`),
  );
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...asRecord(docSnap.data()),
  }));
};

const loadPostingProfiles = async (transaction, businessId) => {
  const snap = await transaction.get(
    db.collection(`businesses/${businessId}/accountingPostingProfiles`),
  );
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...asRecord(docSnap.data()),
  }));
};

const findAccountUsageInProfiles = ({ profiles, accountId }) =>
  profiles.find((profile) =>
    (Array.isArray(profile.linesTemplate) ? profile.linesTemplate : []).some(
      (line) => line?.accountId === accountId,
    ),
  );

const findJournalEntryUsage = async ({
  transaction,
  businessId,
  accountId,
}) => {
  const query = db
    .collection(`businesses/${businessId}/journalEntries`)
    .where('accountIds', 'array-contains', accountId)
    .limit(1);
  const snap = await transaction.get(query);
  return snap.empty ? null : snap.docs[0];
};

const assertAccountCanChangeStructure = async ({
  transaction,
  businessId,
  currentAccount,
  nextAccount,
  profiles,
}) => {
  const structuralChanges = hasStructuralAccountChanges(
    currentAccount,
    nextAccount,
  );
  if (!structuralChanges) return;

  if (currentAccount.systemKey) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta es canónica del sistema. Crea otra cuenta y remapea la configuración antes de cambiar su estructura.',
    );
  }

  const profileUsage = findAccountUsageInProfiles({
    profiles,
    accountId: currentAccount.id,
  });
  if (profileUsage) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta está usada por perfiles contables activos o históricos. No se permite cambiar su estructura.',
    );
  }

  const journalUsage = await findJournalEntryUsage({
    transaction,
    businessId,
    accountId: currentAccount.id,
  });
  if (journalUsage) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta ya está usada por asientos contables. No se permite cambiar su estructura.',
    );
  }
};

const assertAccountCanDisable = async ({
  transaction,
  businessId,
  currentAccount,
  accounts,
  profiles,
}) => {
  if (currentAccount.systemKey) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta es canónica del sistema y no puede desactivarse desde operación regular.',
    );
  }
  if (
    accounts.some(
      (account) =>
        account.parentId === currentAccount.id && account.status === 'active',
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      'No puedes desactivar una cuenta con subcuentas activas.',
    );
  }
  const profileUsage = findAccountUsageInProfiles({
    profiles,
    accountId: currentAccount.id,
  });
  if (profileUsage) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta está usada por perfiles contables. Desactiva o versiona esos perfiles primero.',
    );
  }
  const journalUsage = await findJournalEntryUsage({
    transaction,
    businessId,
    accountId: currentAccount.id,
  });
  if (journalUsage) {
    throw new HttpsError(
      'failed-precondition',
      'La cuenta ya está usada por asientos contables y no puede desactivarse sin revisión contable.',
    );
  }
};

const assertPostingProfileDraft = ({
  draft,
  accountsById,
  profiles,
  profileId,
}) => {
  if (!draft.name) {
    throw new HttpsError(
      'invalid-argument',
      'El perfil contable requiere un nombre.',
    );
  }
  if (!ACCOUNTING_EVENT_MODULES.has(draft.eventType)) {
    throw new HttpsError(
      'invalid-argument',
      'El tipo de evento contable del perfil no es válido.',
    );
  }
  if (draft.linesTemplate.length < 2) {
    throw new HttpsError(
      'invalid-argument',
      'El perfil contable requiere al menos dos líneas.',
    );
  }
  if (!draft.linesTemplate.some((line) => line.side === 'debit')) {
    throw new HttpsError(
      'invalid-argument',
      'El perfil contable requiere al menos una línea débito.',
    );
  }
  if (!draft.linesTemplate.some((line) => line.side === 'credit')) {
    throw new HttpsError(
      'invalid-argument',
      'El perfil contable requiere al menos una línea crédito.',
    );
  }

  const childCountByParentId = buildAccountChildrenByParentId(
    Array.from(accountsById.values()),
  );

  draft.linesTemplate.forEach((line) => {
    if (!line.accountId) {
      throw new HttpsError(
        'invalid-argument',
        'Todas las líneas deben apuntar a una cuenta contable.',
      );
    }
    const account = accountsById.get(line.accountId);
    if (!account) {
      throw new HttpsError(
        'failed-precondition',
        'Una de las cuentas seleccionadas ya no existe.',
      );
    }
    if (account.status !== 'active') {
      throw new HttpsError(
        'failed-precondition',
        'Todas las cuentas usadas por el perfil deben estar activas.',
      );
    }
    if (
      account.postingAllowed === false ||
      (childCountByParentId.get(account.id)?.length || 0) > 0
    ) {
      throw new HttpsError(
        'failed-precondition',
        'Todas las cuentas usadas por el perfil deben ser Cuentas Detalle.',
      );
    }
  });

  const duplicate = profiles.find(
    (profile) =>
      profile.id !== profileId &&
      profile.status !== 'inactive' &&
      profile.eventType === draft.eventType &&
      Number(profile.priority) === Number(draft.priority),
  );
  if (duplicate) {
    throw new HttpsError(
      'already-exists',
      'Ya existe otro perfil activo con esa prioridad para el mismo evento.',
    );
  }
};

const buildAccountRecord = ({
  businessId,
  accountId,
  draft,
  now,
  authUid,
}) => ({
  id: accountId,
  businessId,
  code: draft.code,
  name: draft.name,
  type: draft.type,
  subtype: draft.subtype,
  parentId: draft.parentId,
  postingAllowed: draft.postingAllowed,
  status: draft.status,
  normalSide: draft.normalSide,
  currencyMode: draft.currencyMode,
  systemKey: draft.systemKey,
  metadata: draft.metadata,
  createdAt: now,
  updatedAt: now,
  createdBy: authUid,
  updatedBy: authUid,
});

const buildBankAccountRecord = ({
  businessId,
  bankAccountId,
  chartOfAccountId,
  draft,
  now,
  authUid,
}) => ({
  id: bankAccountId,
  businessId,
  name: draft.name,
  currency: draft.currency,
  status: 'active',
  type: draft.type,
  institutionName: draft.institutionName,
  bankCode: draft.bankCode,
  countryCode: draft.countryCode,
  isCustomBank: draft.isCustomBank === true,
  accountNumberLast4: draft.accountNumberLast4,
  chartOfAccountId,
  openingBalance: draft.openingBalance,
  openingBalanceDate: draft.openingBalanceDate,
  notes: draft.notes,
  metadata: draft.metadata,
  createdAt: now,
  updatedAt: now,
  createdBy: authUid,
  updatedBy: authUid,
});

const buildPostingProfileRecord = ({
  businessId,
  profileId,
  draft,
  now,
  authUid,
}) => ({
  id: profileId,
  businessId,
  name: draft.name,
  description: draft.description,
  eventType: draft.eventType,
  moduleKey: draft.moduleKey,
  status: draft.status,
  priority: draft.priority,
  conditions: draft.conditions,
  linesTemplate: draft.linesTemplate,
  metadata: draft.metadata,
  createdAt: now,
  updatedAt: now,
  createdBy: authUid,
  updatedBy: authUid,
});

export const createBankAccount = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid)
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    const draft = normalizeBankAccountDraft(
      payload.bankAccount || payload.account || payload.data,
    );
    if (!businessId) {
      throw new HttpsError('invalid-argument', 'businessId es requerido.');
    }
    await assertConfigurationAccess({ authUid, businessId });
    assertBankAccountDraft(draft);

    const bankAccountRef = db
      .collection(`businesses/${businessId}/bankAccounts`)
      .doc();
    const ledgerAccountRef = db
      .collection(`businesses/${businessId}/chartOfAccounts`)
      .doc();
    const now = Timestamp.now();

    await db.runTransaction(async (transaction) => {
      const { accounts, accountsById } = await loadAccounts(
        transaction,
        businessId,
      );
      const parentAccount = findBankChartParentAccount(accounts);
      if (!parentAccount) {
        throw new HttpsError(
          'failed-precondition',
          'Primero crea o restaura la cuenta 1110 - Cuentas bancarias.',
        );
      }

      const ledgerDraft = buildBankLedgerAccountDraft({
        accounts,
        bankAccount: draft,
        bankAccountId: bankAccountRef.id,
        parentAccount,
      });

      assertAccountDraft(ledgerDraft);
      assertUniqueAccountCode({
        accounts,
        accountId: ledgerAccountRef.id,
        code: ledgerDraft.code,
      });
      assertValidAccountParent({
        accounts,
        accountsById,
        accountId: ledgerAccountRef.id,
        draft: ledgerDraft,
      });

      transaction.set(
        ledgerAccountRef,
        buildAccountRecord({
          businessId,
          accountId: ledgerAccountRef.id,
          draft: ledgerDraft,
          now,
          authUid,
        }),
      );
      transaction.set(
        bankAccountRef,
        buildBankAccountRecord({
          businessId,
          bankAccountId: bankAccountRef.id,
          chartOfAccountId: ledgerAccountRef.id,
          draft,
          now,
          authUid,
        }),
      );
    });

    return {
      ok: true,
      bankAccountId: bankAccountRef.id,
      chartOfAccountId: ledgerAccountRef.id,
    };
  },
);

export const backfillBankAccountChartLinks = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid)
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    if (!businessId) {
      throw new HttpsError('invalid-argument', 'businessId es requerido.');
    }
    await assertConfigurationAccess({ authUid, businessId });

    const now = Timestamp.now();
    const summary = await db.runTransaction(async (transaction) => {
      const [accountContext, bankAccounts] = await Promise.all([
        loadAccounts(transaction, businessId),
        loadBankAccounts(transaction, businessId),
      ]);
      const parentAccount = findBankChartParentAccount(accountContext.accounts);
      if (!parentAccount) {
        throw new HttpsError(
          'failed-precondition',
          'Primero crea o restaura la cuenta 1110 - Cuentas bancarias.',
        );
      }

      const workingAccounts = [...accountContext.accounts];
      const results = [];

      bankAccounts.forEach((bankAccount) => {
        const bankAccountId = toCleanString(bankAccount.id);
        if (!bankAccountId) {
          return;
        }

        if (toCleanString(bankAccount.chartOfAccountId)) {
          results.push({
            bankAccountId,
            status: 'skipped_already_linked',
            chartOfAccountId: toCleanString(bankAccount.chartOfAccountId),
          });
          return;
        }

        const existingLedgerAccount = findExistingBankLedgerAccount({
          accounts: workingAccounts,
          bankAccountId,
        });
        const bankAccountRef = db.doc(
          `businesses/${businessId}/bankAccounts/${bankAccountId}`,
        );

        if (existingLedgerAccount) {
          transaction.set(
            bankAccountRef,
            {
              chartOfAccountId: existingLedgerAccount.id,
              updatedAt: now,
              updatedBy: authUid,
            },
            { merge: true },
          );
          results.push({
            bankAccountId,
            status: 'linked_existing_chart_account',
            chartOfAccountId: existingLedgerAccount.id,
            code: toCleanString(existingLedgerAccount.code),
          });
          return;
        }

        const normalizedBankAccount = normalizeBankAccountDraft({
          ...bankAccount,
          name: toCleanString(bankAccount.name) || 'Cuenta bancaria',
        });
        const ledgerAccountRef = db
          .collection(`businesses/${businessId}/chartOfAccounts`)
          .doc();
        const ledgerDraft = buildBankLedgerAccountDraft({
          accounts: workingAccounts,
          bankAccount: normalizedBankAccount,
          bankAccountId,
          parentAccount,
        });
        assertAccountDraft(ledgerDraft);
        assertUniqueAccountCode({
          accounts: workingAccounts,
          accountId: ledgerAccountRef.id,
          code: ledgerDraft.code,
        });
        assertValidAccountParent({
          accounts: workingAccounts,
          accountsById: accountContext.accountsById,
          accountId: ledgerAccountRef.id,
          draft: ledgerDraft,
        });

        const ledgerRecord = buildAccountRecord({
          businessId,
          accountId: ledgerAccountRef.id,
          draft: ledgerDraft,
          now,
          authUid,
        });

        transaction.set(ledgerAccountRef, ledgerRecord);
        transaction.set(
          bankAccountRef,
          {
            chartOfAccountId: ledgerAccountRef.id,
            updatedAt: now,
            updatedBy: authUid,
          },
          { merge: true },
        );
        workingAccounts.push(ledgerRecord);
        accountContext.accountsById.set(ledgerRecord.id, ledgerRecord);
        results.push({
          bankAccountId,
          status: 'created_chart_account',
          chartOfAccountId: ledgerAccountRef.id,
          code: ledgerDraft.code,
        });
      });

      return {
        processed: bankAccounts.length,
        created: results.filter(
          (result) => result.status === 'created_chart_account',
        ).length,
        linkedExisting: results.filter(
          (result) => result.status === 'linked_existing_chart_account',
        ).length,
        skippedAlreadyLinked: results.filter(
          (result) => result.status === 'skipped_already_linked',
        ).length,
        results,
      };
    });

    return {
      ok: true,
      ...summary,
    };
  },
);

export const createChartOfAccount = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid)
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    const draft = normalizeAccountDraft(payload.account || payload.data);
    if (!businessId) {
      throw new HttpsError('invalid-argument', 'businessId es requerido.');
    }
    await assertConfigurationAccess({ authUid, businessId });
    assertAccountDraft(draft);

    const accountRef = db
      .collection(`businesses/${businessId}/chartOfAccounts`)
      .doc();
    const now = Timestamp.now();

    await db.runTransaction(async (transaction) => {
      const { accounts, accountsById } = await loadAccounts(
        transaction,
        businessId,
      );
      assertUniqueAccountCode({
        accounts,
        accountId: accountRef.id,
        code: draft.code,
      });
      assertValidAccountParent({
        accounts,
        accountsById,
        accountId: accountRef.id,
        draft,
      });
      transaction.set(
        accountRef,
        buildAccountRecord({
          businessId,
          accountId: accountRef.id,
          draft,
          now,
          authUid,
        }),
      );
    });

    return { ok: true, accountId: accountRef.id };
  },
);

export const updateChartOfAccount = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid)
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    const accountId =
      toCleanString(payload.accountId) ||
      toCleanString(payload.chartOfAccountId);
    if (!businessId || !accountId) {
      throw new HttpsError(
        'invalid-argument',
        'businessId y accountId son requeridos.',
      );
    }
    await assertConfigurationAccess({ authUid, businessId });

    const accountRef = db.doc(
      `businesses/${businessId}/chartOfAccounts/${accountId}`,
    );
    const now = Timestamp.now();

    await db.runTransaction(async (transaction) => {
      const [accountSnap, accountContext, profiles] = await Promise.all([
        transaction.get(accountRef),
        loadAccounts(transaction, businessId),
        loadPostingProfiles(transaction, businessId),
      ]);
      if (!accountSnap.exists) {
        throw new HttpsError('not-found', 'La cuenta contable no existe.');
      }
      const currentAccount = {
        id: accountId,
        ...asRecord(accountSnap.data()),
      };
      const draft = normalizeAccountDraft(
        payload.account || payload.updates || payload.data,
        currentAccount,
      );
      assertAccountDraft(draft);
      assertUniqueAccountCode({
        accounts: accountContext.accounts,
        accountId,
        code: draft.code,
      });
      assertValidAccountParent({
        accounts: accountContext.accounts,
        accountsById: accountContext.accountsById,
        accountId,
        draft,
      });
      assertAccountPostingClassification({
        accounts: accountContext.accounts,
        accountId,
        draft,
      });
      await assertAccountCanChangeStructure({
        transaction,
        businessId,
        currentAccount,
        nextAccount: draft,
        profiles,
      });
      transaction.set(
        accountRef,
        {
          ...buildAccountRecord({
            businessId,
            accountId,
            draft,
            now,
            authUid,
          }),
          createdAt: currentAccount.createdAt ?? now,
          createdBy: currentAccount.createdBy ?? authUid,
          updatedAt: now,
          updatedBy: authUid,
        },
        { merge: true },
      );
    });

    return { ok: true, accountId };
  },
);

export const disableChartOfAccount = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid)
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    const accountId =
      toCleanString(payload.accountId) ||
      toCleanString(payload.chartOfAccountId);
    const reason = toCleanString(payload.reason);
    if (!businessId || !accountId) {
      throw new HttpsError(
        'invalid-argument',
        'businessId y accountId son requeridos.',
      );
    }
    await assertConfigurationAccess({ authUid, businessId });

    const accountRef = db.doc(
      `businesses/${businessId}/chartOfAccounts/${accountId}`,
    );
    const now = Timestamp.now();

    await db.runTransaction(async (transaction) => {
      const [accountSnap, accountContext, profiles] = await Promise.all([
        transaction.get(accountRef),
        loadAccounts(transaction, businessId),
        loadPostingProfiles(transaction, businessId),
      ]);
      if (!accountSnap.exists) {
        throw new HttpsError('not-found', 'La cuenta contable no existe.');
      }
      const currentAccount = {
        id: accountId,
        ...asRecord(accountSnap.data()),
      };
      if (currentAccount.status === 'inactive') return;

      await assertAccountCanDisable({
        transaction,
        businessId,
        currentAccount,
        accounts: accountContext.accounts,
        profiles,
      });
      transaction.set(
        accountRef,
        {
          status: 'inactive',
          updatedAt: now,
          updatedBy: authUid,
          disabledAt: now,
          disabledBy: authUid,
          disableReason: reason,
        },
        { merge: true },
      );
    });

    return { ok: true, accountId };
  },
);

export const createAccountingPostingProfile = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid)
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    if (!businessId) {
      throw new HttpsError('invalid-argument', 'businessId es requerido.');
    }
    await assertConfigurationAccess({ authUid, businessId });

    const profileRef = db
      .collection(`businesses/${businessId}/accountingPostingProfiles`)
      .doc();
    const now = Timestamp.now();

    await db.runTransaction(async (transaction) => {
      const [{ accountsById }, profiles] = await Promise.all([
        loadAccounts(transaction, businessId),
        loadPostingProfiles(transaction, businessId),
      ]);
      const draft = normalizePostingProfileDraft(
        payload.profile || payload.data,
        accountsById,
      );
      assertPostingProfileDraft({
        draft,
        accountsById,
        profiles,
        profileId: profileRef.id,
      });
      transaction.set(
        profileRef,
        buildPostingProfileRecord({
          businessId,
          profileId: profileRef.id,
          draft,
          now,
          authUid,
        }),
      );
    });

    return { ok: true, profileId: profileRef.id };
  },
);

export const updateAccountingPostingProfile = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid)
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    const profileId =
      toCleanString(payload.profileId) ||
      toCleanString(payload.postingProfileId);
    if (!businessId || !profileId) {
      throw new HttpsError(
        'invalid-argument',
        'businessId y profileId son requeridos.',
      );
    }
    await assertConfigurationAccess({ authUid, businessId });

    const profileRef = db.doc(
      `businesses/${businessId}/accountingPostingProfiles/${profileId}`,
    );
    const now = Timestamp.now();
    let result = { ok: true, profileId, versioned: false };

    await db.runTransaction(async (transaction) => {
      const [profileSnap, { accountsById }, profiles] = await Promise.all([
        transaction.get(profileRef),
        loadAccounts(transaction, businessId),
        loadPostingProfiles(transaction, businessId),
      ]);
      if (!profileSnap.exists) {
        throw new HttpsError('not-found', 'El perfil contable no existe.');
      }
      const currentProfile = {
        id: profileId,
        ...asRecord(profileSnap.data()),
      };
      const draft = normalizePostingProfileDraft(
        payload.profile || payload.updates || payload.data,
        accountsById,
        currentProfile,
      );
      assertPostingProfileDraft({
        draft,
        accountsById,
        profiles,
        profileId,
      });

      if (hasStructuralPostingProfileChanges(currentProfile, draft)) {
        const rootProfileId =
          toCleanString(currentProfile.metadata?.rootProfileId) || profileId;
        const currentVersion = Number.isFinite(
          Number(currentProfile.metadata?.profileVersion),
        )
          ? Number(currentProfile.metadata.profileVersion)
          : 1;
        const nextProfileRef = db
          .collection(`businesses/${businessId}/accountingPostingProfiles`)
          .doc();
        const nextDraft = {
          ...draft,
          metadata: {
            ...asRecord(currentProfile.metadata),
            ...draft.metadata,
            rootProfileId,
            profileVersion: currentVersion + 1,
            previousProfileId: profileId,
          },
        };
        transaction.set(
          nextProfileRef,
          buildPostingProfileRecord({
            businessId,
            profileId: nextProfileRef.id,
            draft: nextDraft,
            now,
            authUid,
          }),
        );
        transaction.set(
          profileRef,
          {
            status: 'inactive',
            updatedAt: now,
            updatedBy: authUid,
            metadata: {
              ...asRecord(currentProfile.metadata),
              rootProfileId,
              profileVersion: currentVersion,
              replacedByProfileId: nextProfileRef.id,
            },
          },
          { merge: true },
        );
        result = {
          ok: true,
          profileId: nextProfileRef.id,
          previousProfileId: profileId,
          versioned: true,
        };
        return;
      }

      transaction.set(
        profileRef,
        {
          ...buildPostingProfileRecord({
            businessId,
            profileId,
            draft,
            now,
            authUid,
          }),
          createdAt: currentProfile.createdAt ?? now,
          createdBy: currentProfile.createdBy ?? authUid,
          updatedAt: now,
          updatedBy: authUid,
        },
        { merge: true },
      );
    });

    return result;
  },
);

export const disableAccountingPostingProfile = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid)
      throw new HttpsError('unauthenticated', 'Usuario no autenticado');

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    const profileId =
      toCleanString(payload.profileId) ||
      toCleanString(payload.postingProfileId);
    const reason = toCleanString(payload.reason);
    if (!businessId || !profileId) {
      throw new HttpsError(
        'invalid-argument',
        'businessId y profileId son requeridos.',
      );
    }
    await assertConfigurationAccess({ authUid, businessId });

    const profileRef = db.doc(
      `businesses/${businessId}/accountingPostingProfiles/${profileId}`,
    );
    const now = Timestamp.now();

    await db.runTransaction(async (transaction) => {
      const profileSnap = await transaction.get(profileRef);
      if (!profileSnap.exists) {
        throw new HttpsError('not-found', 'El perfil contable no existe.');
      }
      transaction.set(
        profileRef,
        {
          status: 'inactive',
          updatedAt: now,
          updatedBy: authUid,
          disabledAt: now,
          disabledBy: authUid,
          disableReason: reason,
        },
        { merge: true },
      );
    });

    return { ok: true, profileId };
  },
);
