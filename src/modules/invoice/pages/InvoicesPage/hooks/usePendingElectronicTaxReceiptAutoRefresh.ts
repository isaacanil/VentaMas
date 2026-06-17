import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { fbRefreshElectronicTaxReceiptStatus } from '@/firebase/electronicTaxReceipts/fbRefreshElectronicTaxReceiptStatus';
import type {
  ElectronicTaxReceiptSnapshot,
  InvoiceData,
} from '@/types/invoice';
import type { UserIdentity } from '@/types/users';
import {
  resolveElectronicTaxReceiptSnapshot,
  resolveElectronicTaxReceiptStatusKey,
} from '@/modules/invoice/utils/electronicTaxReceipt';

import type { InvoiceRecord } from '../types';

const FIRST_REFRESH_DELAY_MS = 45_000;
const MIN_REMOTE_REFRESH_INTERVAL_MS = 3 * 60_000;
const SESSION_REFRESH_INTERVAL_MS = 10 * 60_000;
const MAX_REFRESHES_PER_PASS = 5;

const TERMINAL_STATUS_KEYS = new Set([
  'accepted',
  'accepted_conditional',
  'rejected',
  'error',
  'failed',
  'local_failed',
]);

const PENDING_STATUS_KEYS = new Set([
  'issued',
  'not_checked',
  'pending',
  'queued',
  'submitted',
  'processing',
]);

type TimestampLike =
  | Date
  | number
  | string
  | { seconds?: number; toMillis?: () => number }
  | null
  | undefined;

const toMillis = (value: TimestampLike): number | null => {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value?.toMillis === 'function') {
    const parsed = value.toMillis();
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value?.seconds === 'number') {
    return value.seconds * 1000;
  }
  return null;
};

const normalizeStatus = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
};

const resolveBusinessId = (user: UserIdentity | null): string | null =>
  user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null;

const hasRecentSessionRefresh = (key: string, now: number): boolean => {
  if (typeof window === 'undefined') return false;
  const raw = window.sessionStorage.getItem(key);
  const previous = raw ? Number(raw) : NaN;
  return Number.isFinite(previous) && now - previous < SESSION_REFRESH_INTERVAL_MS;
};

const markSessionRefreshAttempt = (key: string, now: number) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(key, String(now));
};

const isPendingElectronicSnapshot = (
  snapshot: ElectronicTaxReceiptSnapshot | null,
): snapshot is ElectronicTaxReceiptSnapshot => {
  if (!snapshot?.submissionId) return false;

  const statusKey = normalizeStatus(
    resolveElectronicTaxReceiptStatusKey(snapshot),
  );
  if (statusKey && TERMINAL_STATUS_KEYS.has(statusKey)) return false;
  if (statusKey && PENDING_STATUS_KEYS.has(statusKey)) return true;

  return [
    snapshot.requestStatus,
    snapshot.dgiiSubmissionStatus,
    snapshot.dgiiValidationStatus,
    snapshot.dgiiStatus,
    snapshot.rfceSubmissionStatus,
  ].some((status) => {
    const normalized = normalizeStatus(status);
    return Boolean(normalized && PENDING_STATUS_KEYS.has(normalized));
  });
};

const shouldRefreshInvoice = ({
  invoice,
  now,
}: {
  invoice: InvoiceData;
  now: number;
}): boolean => {
  const snapshot = resolveElectronicTaxReceiptSnapshot(invoice);
  if (!isPendingElectronicSnapshot(snapshot)) return false;

  const invoiceMs = toMillis(invoice.date as TimestampLike);
  if (invoiceMs && now - invoiceMs < FIRST_REFRESH_DELAY_MS) return false;

  const lastSyncMs = toMillis(
    (snapshot.lastSyncAt ?? snapshot.updatedAt) as TimestampLike,
  );
  return !lastSyncMs || now - lastSyncMs >= MIN_REMOTE_REFRESH_INTERVAL_MS;
};

export const usePendingElectronicTaxReceiptAutoRefresh = ({
  enabled = true,
  invoices,
}: {
  enabled?: boolean;
  invoices: InvoiceRecord[];
}) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const businessId = resolveBusinessId(user);

  useEffect(() => {
    if (!enabled || !businessId || invoices.length === 0) return undefined;

    const now = Date.now();
    const candidates = invoices
      .map((record) => record.data)
      .filter((invoice): invoice is InvoiceData => Boolean(invoice?.id))
      .filter((invoice) => shouldRefreshInvoice({ invoice, now }))
      .filter((invoice) => {
        const snapshot = resolveElectronicTaxReceiptSnapshot(invoice);
        const key = `ecf-status-refresh:${businessId}:${invoice.id}:${snapshot?.submissionId}`;
        return !hasRecentSessionRefresh(key, now);
      })
      .slice(0, MAX_REFRESHES_PER_PASS);

    if (candidates.length === 0) return undefined;

    let cancelled = false;

    const refreshPendingInvoices = async () => {
      for (const invoice of candidates) {
        if (cancelled || !invoice.id) return;

        const snapshot = resolveElectronicTaxReceiptSnapshot(invoice);
        const key = `ecf-status-refresh:${businessId}:${invoice.id}:${snapshot?.submissionId}`;
        markSessionRefreshAttempt(key, Date.now());

        try {
          await fbRefreshElectronicTaxReceiptStatus({
            businessId,
            invoiceId: invoice.id,
            refreshRemote: true,
          });
        } catch (error) {
          console.warn('[eCF auto-refresh] status refresh failed', {
            invoiceId: invoice.id,
            submissionId: snapshot?.submissionId,
            error,
          });
        }
      }
    };

    void refreshPendingInvoices();

    return () => {
      cancelled = true;
    };
  }, [businessId, enabled, invoices]);
};
