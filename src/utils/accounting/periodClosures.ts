import {
  doc,
  getDoc,
  type DocumentReference,
  type DocumentSnapshot,
  type Transaction,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

import {
  buildAccountingPeriodKey,
  toDateOrNull,
} from './journalEntries';
import {
  getAccountingSettingsForBusiness,
} from './monetary';

const periodLabelFormatter = new Intl.DateTimeFormat('es-DO', {
  month: 'long',
  year: 'numeric',
});

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export interface AccountingPeriodClosureLike {
  periodKey: string;
}

export interface AccountingPeriodStatus<
  TClosure extends AccountingPeriodClosureLike = AccountingPeriodClosureLike,
> {
  periodKey: string;
  isClosed: boolean;
  closure: TClosure | null;
}

export const findAccountingPeriodClosure = <
  TClosure extends AccountingPeriodClosureLike,
>(
  periodKey: string,
  closures: readonly TClosure[] = [],
): TClosure | null =>
  (Array.isArray(closures) ? closures : []).find(
    (closure) => closure?.periodKey === periodKey,
  ) ?? null;

export const resolveAccountingPeriodStatusFromPeriodKey = <
  TClosure extends AccountingPeriodClosureLike,
>(
  periodKey: string,
  closures: readonly TClosure[] = [],
): AccountingPeriodStatus<TClosure> => {
  const closure = findAccountingPeriodClosure(periodKey, closures);

  return {
    periodKey,
    isClosed: closure != null,
    closure,
  };
};

export const resolveAccountingPeriodStatus = <
  TClosure extends AccountingPeriodClosureLike,
>(
  effectiveDate: unknown,
  closures: readonly TClosure[] = [],
): AccountingPeriodStatus<TClosure> =>
  resolveAccountingPeriodStatusFromPeriodKey(
    buildAccountingPeriodKey(toDateOrNull(effectiveDate) ?? new Date()),
    closures,
  );

export const isAccountingPeriodClosed = <
  TClosure extends AccountingPeriodClosureLike,
>(
  periodKey: string,
  closures: readonly TClosure[] = [],
): boolean =>
  resolveAccountingPeriodStatusFromPeriodKey(periodKey, closures).isClosed;

export const formatAccountingPeriodLabel = (
  periodKey: string,
): string | null => {
  const normalizedPeriodKey = toCleanString(periodKey);
  if (!normalizedPeriodKey) return null;

  const [year, month] = normalizedPeriodKey.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  return periodLabelFormatter.format(new Date(year, month - 1, 1));
};

export const buildClosedAccountingPeriodMessage = ({
  periodKey,
  operationLabel,
}: {
  periodKey: string;
  operationLabel: string;
}): string => {
  const periodLabel = formatAccountingPeriodLabel(periodKey);
  const normalizedOperationLabel =
    toCleanString(operationLabel) ?? 'registrar esta operacion';

  if (!periodLabel) {
    return (
      `No puedes ${normalizedOperationLabel} con la fecha seleccionada porque ese periodo contable esta cerrado. ` +
      'Usa otra fecha o solicita reabrir el periodo.'
    );
  }

  return (
    `No puedes ${normalizedOperationLabel} con fecha de ${periodLabel} porque ese periodo contable ` +
    'esta cerrado. Usa otra fecha o solicita reabrir el periodo.'
  );
};

type ClosureReader = (
  closureRef: DocumentReference,
) => Promise<DocumentSnapshot>;

interface AccountingPeriodAssertionOptions {
  businessId: string | null | undefined;
  effectiveDate: unknown;
  operationLabel: string;
  buildMessage?: ((periodKey: string) => string) | null;
}

const resolveClosedAccountingPeriodMessage = ({
  periodKey,
  operationLabel,
  buildMessage,
}: {
  periodKey: string;
  operationLabel: string;
  buildMessage?: ((periodKey: string) => string) | null;
}): string =>
  typeof buildMessage === 'function'
    ? buildMessage(periodKey)
    : buildClosedAccountingPeriodMessage({
        periodKey,
        operationLabel,
      });

const assertAccountingPeriodOpenWithReader = async ({
  businessId,
  effectiveDate,
  operationLabel,
  buildMessage = null,
  readClosure,
}: AccountingPeriodAssertionOptions & {
  readClosure: ClosureReader;
}): Promise<string | null> => {
  const normalizedBusinessId = toCleanString(businessId);
  if (!normalizedBusinessId) {
    return null;
  }

  const accountingSettings = await getAccountingSettingsForBusiness(
    normalizedBusinessId,
  );
  if (accountingSettings?.generalAccountingEnabled !== true) {
    return null;
  }

  const periodStatus = resolveAccountingPeriodStatus(effectiveDate);
  const { periodKey } = periodStatus;
  const closureRef = doc(
    db,
    'businesses',
    normalizedBusinessId,
    'accountingPeriodClosures',
    periodKey,
  );
  const closureSnap = await readClosure(closureRef);

  const closureStatus = resolveAccountingPeriodStatusFromPeriodKey(
    periodKey,
    closureSnap.exists() ? [{ periodKey }] : [],
  );

  if (closureStatus.isClosed) {
    throw new Error(
      resolveClosedAccountingPeriodMessage({
        periodKey,
        operationLabel,
        buildMessage,
      }),
    );
  }

  return periodKey;
};

export const assertAccountingPeriodOpenForBusiness = async ({
  businessId,
  effectiveDate,
  operationLabel,
  buildMessage = null,
}: AccountingPeriodAssertionOptions): Promise<string | null> =>
  assertAccountingPeriodOpenWithReader({
    businessId,
    effectiveDate,
    operationLabel,
    buildMessage,
    readClosure: (closureRef) => getDoc(closureRef),
  });

export const assertAccountingPeriodOpenForBusinessInTransaction = async ({
  transaction,
  businessId,
  effectiveDate,
  operationLabel,
  buildMessage = null,
}: AccountingPeriodAssertionOptions & {
  transaction: Transaction;
}): Promise<string | null> =>
  assertAccountingPeriodOpenWithReader({
    businessId,
    effectiveDate,
    operationLabel,
    buildMessage,
    readClosure: (closureRef) => transaction.get(closureRef),
  });
