import { formatAccountingMoney } from '../../../utils/accountingWorkspace';

import type { AccountingLedgerRecord } from '../../../utils/accountingWorkspace';

const SYSTEM_GENERATED_REFERENCE_PATTERN =
  /^[a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+__[\w-]+$/i;
const OPAQUE_USER_PATTERN = /^[A-Za-z0-9_-]{20,}$/;
const OPAQUE_REFERENCE_PATTERN = /^[A-Za-z0-9_-]{12,}$/;
const USER_ID_LIKE_PATTERN = /^(?=.{8,}$)(?=.*\d|.*[A-Z])[A-Za-z0-9_-]+$/;

const pad2 = (value: number) => value.toString().padStart(2, '0');

const buildCompactCode = (
  prefix: 'DOC' | 'USR',
  entryDate: Date | null,
  stableSeed: string,
): string => {
  let hash = 0;
  for (let index = 0; index < stableSeed.length; index += 1) {
    hash = (hash * 31 + stableSeed.charCodeAt(index)) % 10000;
  }

  const year = entryDate?.getFullYear() ?? 0;
  const month = pad2((entryDate?.getMonth() ?? 0) + 1);
  return `${prefix}-${year.toString().padStart(4, '0')}-${month}-${hash
    .toString()
    .padStart(4, '0')}`;
};

export const formatJournalAmount = (value: number): string =>
  Math.abs(value) < 0.005 ? '—' : `RD$ ${formatAccountingMoney(value)}`;

export const formatDocumentLabel = (record: AccountingLedgerRecord): string => {
  const documentReference = record.documentReference?.trim();
  if (!documentReference) {
    return '—';
  }

  return SYSTEM_GENERATED_REFERENCE_PATTERN.test(documentReference) ||
    OPAQUE_REFERENCE_PATTERN.test(documentReference)
    ? buildCompactCode('DOC', record.entryDate, documentReference)
    : documentReference;
};

export const formatUserLabel = (record: AccountingLedgerRecord): string => {
  const cleaned = record.userLabel?.trim();
  if (cleaned?.length) {
    if (cleaned.startsWith('system:')) {
      return 'Sistema';
    }

    if (cleaned.includes('@')) {
      return cleaned.split('@')[0];
    }

    if (
      OPAQUE_USER_PATTERN.test(cleaned) ||
      USER_ID_LIKE_PATTERN.test(cleaned) ||
      (cleaned.includes(':') && !cleaned.includes(' '))
    ) {
      return buildCompactCode('USR', record.entryDate, cleaned);
    }

    return cleaned;
  }

  return record.sourceKind === 'automatic' ? 'Sistema' : '—';
};

const getNumericSuffix = (value: string | null | undefined): string | null => {
  const match = value?.match(/(\d{1,6})$/);
  return match ? match[1].padStart(6, '0') : null;
};

const buildStableSixDigitCode = (seed: string): string => {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 1000000;
  }

  return hash.toString().padStart(6, '0');
};

export const formatEntryFolio = (record: AccountingLedgerRecord): string => {
  const year = record.entryDate?.getFullYear() ?? 0;
  const month = pad2((record.entryDate?.getMonth() ?? 0) + 1);
  const sequence =
    getNumericSuffix(record.documentReference) ??
    getNumericSuffix(record.reference) ??
    buildStableSixDigitCode(record.entryReference);

  return `AST-${year.toString().padStart(4, '0')}-${month}-${sequence}`;
};

export const formatAccountLabel = (
  line: AccountingLedgerRecord['lines'][number] | null | undefined,
): string => {
  if (!line) {
    return '—';
  }

  const code = line.accountCode?.trim();
  const name = line.accountName?.trim();

  if (code && name) {
    return `${code} ${name}`;
  }

  return code ?? name ?? '—';
};
