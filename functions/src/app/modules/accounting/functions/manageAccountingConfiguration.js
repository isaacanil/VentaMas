import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { db, Timestamp } from '../../../core/config/firebase.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/invoice/services/repairTasks.service.js';

const CHART_ACCOUNT_TYPES = new Set([
  'asset',
  'liability',
  'equity',
  'income',
  'expense',
]);
const NORMAL_SIDES = new Set(['debit', 'credit']);
const CURRENCY_MODES = new Set([
  'functional_only',
  'multi_currency_reference',
]);
const PROFILE_STATUSES = new Set(['active', 'inactive']);
const ACCOUNTING_EVENT_MODULES = new Map([
  ['invoice.committed', 'sales'],
  ['invoice.voided', 'sales'],
  ['accounts_receivable.payment.recorded', 'accounts_receivable'],
  ['accounts_receivable.payment.voided', 'accounts_receivable'],
  ['customer_credit_note.issued', 'accounts_receivable'],
  ['customer_credit_note.applied', 'accounts_receivable'],
  ['purchase.committed', 'purchases'],
  ['accounts_payable.payment.recorded', 'accounts_payable'],
  ['accounts_payable.payment.voided', 'accounts_payable'],
  ['supplier_credit_note.issued', 'accounts_payable'],
  ['supplier_credit_note.applied', 'accounts_payable'],
  ['expense.recorded', 'expenses'],
  ['cash_over_short.recorded', 'cash'],
  ['bank_statement_adjustment.recorded', 'banking'],
  ['internal_transfer.posted', 'cash'],
  ['manual.entry.recorded', 'general_ledger'],
  ['fx_settlement.recorded', 'fx'],
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
  'purchase_total',
  'expense_total',
  'tax_total',
  'cash_over_short_gain',
  'cash_over_short_loss',
  'bank_statement_adjustment_gain',
  'bank_statement_adjustment_loss',
  'accounts_receivable_payment_amount',
  'accounts_payable_payment_amount',
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

const resolveBusinessId = (payload) =>
  toCleanString(payload.businessId) || toCleanString(payload.businessID);

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
    settlementKind: ['cash', 'bank', 'other'].includes(record.settlementKind)
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
    settlementTiming: ['immediate', 'deferred'].includes(record.settlementTiming)
      ? record.settlementTiming
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

const normalizePostingLine = (value, accountsById) => {
  const record = asRecord(value);
  const accountId = toCleanString(record.accountId);
  const account = accountId ? accountsById.get(accountId) : null;

  return {
    id: toCleanString(record.id) || `line_${Math.random().toString(36).slice(2, 10)}`,
    side: record.side === 'credit' ? 'credit' : 'debit',
    accountId,
    accountCode: account?.code || toCleanString(record.accountCode),
    accountName: account?.name || toCleanString(record.accountName),
    accountSystemKey: account?.systemKey || toCleanString(record.accountSystemKey),
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
    ? record.linesTemplate.map((line) => normalizePostingLine(line, accountsById))
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
    throw new HttpsError('invalid-argument', 'Tipo de cuenta contable inválido.');
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

const assertValidAccountParent = ({ accountsById, accountId, draft }) => {
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

const findJournalEntryUsage = async ({ transaction, businessId, accountId }) => {
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

const assertPostingProfileDraft = ({ draft, accountsById, profiles, profileId }) => {
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
    if (account.postingAllowed === false) {
      throw new HttpsError(
        'failed-precondition',
        'Todas las cuentas usadas por el perfil deben permitir asientos directos.',
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

const buildAccountRecord = ({ businessId, accountId, draft, now, authUid }) => ({
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

export const createChartOfAccount = onCall(
  { cors: true, invoker: 'public' },
  async (request) => {
    const authUid = await resolveCallableAuthUid(request);
    if (!authUid) throw new HttpsError('unauthenticated', 'Usuario no autenticado');

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
      const { accounts, accountsById } = await loadAccounts(transaction, businessId);
      assertUniqueAccountCode({
        accounts,
        accountId: accountRef.id,
        code: draft.code,
      });
      assertValidAccountParent({
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
    if (!authUid) throw new HttpsError('unauthenticated', 'Usuario no autenticado');

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    const accountId =
      toCleanString(payload.accountId) || toCleanString(payload.chartOfAccountId);
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
        accountsById: accountContext.accountsById,
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
    if (!authUid) throw new HttpsError('unauthenticated', 'Usuario no autenticado');

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    const accountId =
      toCleanString(payload.accountId) || toCleanString(payload.chartOfAccountId);
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
    if (!authUid) throw new HttpsError('unauthenticated', 'Usuario no autenticado');

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
    if (!authUid) throw new HttpsError('unauthenticated', 'Usuario no autenticado');

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    const profileId =
      toCleanString(payload.profileId) || toCleanString(payload.postingProfileId);
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
    if (!authUid) throw new HttpsError('unauthenticated', 'Usuario no autenticado');

    const payload = asRecord(request?.data);
    const businessId = resolveBusinessId(payload);
    const profileId =
      toCleanString(payload.profileId) || toCleanString(payload.postingProfileId);
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
