import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type {
  AccountingPostingProfile,
  BankAccount,
  ChartOfAccount,
} from '@/types/accounting';
import type { AccountingSettingsHistoryEntry } from '../utils/accountingConfig';
import {
  buildAccountingAuditEntryRecord,
  buildLegacyAuditFetchCandidates,
  buildLegacySettingsAuditEntries,
  mergeAccountingAuditEntries,
  normalizeAccountingAuditEntry,
  type AccountingAuditEntry,
} from '../utils/accountingAudit';

interface UseAccountingAuditTrailArgs {
  bankAccounts: BankAccount[];
  businessId: string | null;
  chartOfAccounts: ChartOfAccount[];
  postingProfiles: AccountingPostingProfile[];
  settingsHistory: AccountingSettingsHistoryEntry[];
}

interface LoadedAuditState {
  businessId: string | null;
  entries: AccountingAuditEntry[];
}

interface LoadedLegacyState {
  requestKey: string | null;
  entries: AccountingAuditEntry[];
}

export const useAccountingAuditTrail = ({
  bankAccounts,
  businessId,
  chartOfAccounts,
  postingProfiles,
  settingsHistory,
}: UseAccountingAuditTrailArgs) => {
  const [auditState, setAuditState] = useState<LoadedAuditState>({
    businessId: null,
    entries: [],
  });
  const [legacyState, setLegacyState] = useState<LoadedLegacyState>({
    requestKey: null,
    entries: [],
  });

  const legacyCandidates = useMemo(
    () =>
      businessId
        ? buildLegacyAuditFetchCandidates({
            bankAccounts,
            chartOfAccounts,
            postingProfiles,
          })
        : [],
    [bankAccounts, businessId, chartOfAccounts, postingProfiles],
  );

  useEffect(() => {
    if (!businessId) {
      return;
    }

    const auditRef = collection(
      db,
      'businesses',
      businessId,
      'settings',
      'accounting',
      'audit',
    );
    const auditQuery = query(auditRef, orderBy('changedAt', 'desc'), limit(60));

    const unsubscribe = onSnapshot(
      auditQuery,
      (snapshot) => {
        setAuditState({
          businessId,
          entries: snapshot.docs
            .map((docSnapshot) =>
              normalizeAccountingAuditEntry(docSnapshot.data()),
            )
            .filter((entry): entry is AccountingAuditEntry => entry !== null),
        });
      },
      (cause) => {
        console.error('Error cargando auditoria contable:', cause);
        setAuditState({
          businessId,
          entries: [],
        });
      },
    );

    return () => unsubscribe();
  }, [businessId]);

  const visibleAuditEntries = useMemo(
    () => (auditState.businessId === businessId ? auditState.entries : []),
    [auditState, businessId],
  );

  const pendingLegacyCandidates = useMemo(() => {
    const knownAuditIds = new Set(
      visibleAuditEntries.map((entry) => entry.id),
    );

    return legacyCandidates.filter(
      (candidate) =>
        !knownAuditIds.has(`${candidate.scope}:${candidate.historyId}`),
    );
  }, [legacyCandidates, visibleAuditEntries]);

  const legacyRequestKey = useMemo(
    () =>
      pendingLegacyCandidates.length
        ? [
            businessId,
            ...pendingLegacyCandidates.map(
              (candidate) => `${candidate.scope}:${candidate.historyId}`,
            ),
          ].join('|')
        : null,
    [businessId, pendingLegacyCandidates],
  );

  useEffect(() => {
    if (!businessId || !legacyRequestKey) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const nextEntries = (
        await Promise.all(
          pendingLegacyCandidates.map(async (candidate) => {
            const historySnapshot = await getDoc(
              doc(
                db,
                'businesses',
                businessId,
                candidate.collectionName,
                candidate.entityId,
                'history',
                candidate.historyId,
              ),
            );

            if (!historySnapshot.exists()) {
              return null;
            }

            const historyRecord = historySnapshot.data();
            return buildAccountingAuditEntryRecord({
              businessId,
              scope: candidate.scope,
              entityId: candidate.entityId,
              historyId: candidate.historyId,
              entityLabel: candidate.entityLabel,
              changeType: historyRecord.changeType as
                | 'created'
                | 'updated'
                | 'status_changed'
                | 'seeded'
                | undefined,
              changedAt:
                historyRecord.changedAt ??
                historyRecord.updatedAt ??
                candidate.lastChangedAt ??
                null,
              changedBy:
                (historyRecord.changedBy as string | null | undefined) ??
                (historyRecord.updatedBy as string | null | undefined) ??
                null,
              before: historyRecord.previous ?? null,
              after: historyRecord.next ?? null,
            });
          }),
        )
      ).filter((entry): entry is AccountingAuditEntry => entry !== null);

      if (!cancelled) {
        setLegacyState({
          requestKey: legacyRequestKey,
          entries: nextEntries,
        });
      }
    })().catch((cause) => {
      console.error('Error cargando historial legado contable:', cause);
      if (!cancelled) {
        setLegacyState({
          requestKey: legacyRequestKey,
          entries: [],
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [businessId, legacyRequestKey, pendingLegacyCandidates]);

  const legacySettingsEntries = useMemo(
    () =>
      businessId
        ? buildLegacySettingsAuditEntries({
            businessId,
            entries: settingsHistory,
          })
        : [],
    [businessId, settingsHistory],
  );

  const visibleLegacyEntityEntries = useMemo(() => {
    if (!legacyRequestKey || legacyState.requestKey !== legacyRequestKey) {
      return [];
    }

    return legacyState.entries;
  }, [legacyRequestKey, legacyState]);

  const entries = useMemo(
    () =>
      mergeAccountingAuditEntries(
        visibleAuditEntries,
        legacySettingsEntries,
        visibleLegacyEntityEntries,
      ).slice(0, 60),
    [legacySettingsEntries, visibleAuditEntries, visibleLegacyEntityEntries],
  );

  return {
    entries,
    loading:
      businessId == null
        ? false
        : auditState.businessId !== businessId ||
          (legacyRequestKey !== null &&
            legacyState.requestKey !== legacyRequestKey),
  };
};
