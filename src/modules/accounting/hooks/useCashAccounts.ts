import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { CashAccount } from '@/types/accounting';
import {
  normalizeCashAccountDraft,
  normalizeCashAccountRecord,
  type CashAccountDraft,
} from '@/utils/accounting/cashAccounts';

interface UseCashAccountsArgs {
  businessId: string | null;
  userId: string | null;
}

const buildCashAccountSnapshot = ({
  businessId,
  cashAccountId,
  currency,
  location,
  metadata,
  name,
  notes,
  openingBalance,
  openingBalanceDate,
  status = 'active',
  type,
}: {
  businessId: string;
  cashAccountId: string;
  currency: CashAccount['currency'];
  location?: string | null;
  metadata?: Record<string, unknown> | null;
  name: string;
  notes?: string | null;
  openingBalance?: number | null;
  openingBalanceDate?: CashAccount['openingBalanceDate'] | null;
  status?: CashAccount['status'];
  type?: CashAccount['type'];
}) => ({
  id: cashAccountId,
  businessId,
  name,
  currency,
  status,
  type: type ?? null,
  location: location ?? null,
  openingBalance: openingBalance ?? null,
  openingBalanceDate: openingBalanceDate ?? null,
  notes: notes ?? null,
  metadata: metadata ?? {},
});

export const useCashAccounts = ({
  businessId,
  userId,
}: UseCashAccountsArgs) => {
  const queryKey = businessId ? `cashAccounts:${businessId}` : null;
  const [snapshotState, setSnapshotState] = useState<{
    cashAccounts: CashAccount[];
    error: string | null;
    key: string | null;
  }>({
    cashAccounts: [],
    error: null,
    key: null,
  });

  useEffect(() => {
    if (!queryKey || !businessId) return undefined;
    const cashAccountsRef = collection(db, 'businesses', businessId, 'cashAccounts');

    const unsubscribe = onSnapshot(
      cashAccountsRef,
      (snapshot) => {
        const nextCashAccounts = snapshot.docs
          .map((cashAccountDoc) =>
            normalizeCashAccountRecord(
              cashAccountDoc.id,
              businessId,
              cashAccountDoc.data(),
            ),
          )
          .sort((left, right) => {
            if (left.status !== right.status) {
              return left.status === 'active' ? -1 : 1;
            }

            return left.name.localeCompare(right.name);
          });

        setSnapshotState({
          cashAccounts: nextCashAccounts,
          error: null,
          key: queryKey,
        });
      },
      (cause) => {
        console.error('Error cargando cuentas de caja:', cause);
        setSnapshotState({
          cashAccounts: [],
          error: cause.message || 'No se pudieron cargar las cuentas de caja.',
          key: queryKey,
        });
      },
    );

    return unsubscribe;
  }, [businessId, queryKey]);

  const cashAccounts = useMemo(
    () =>
      queryKey && snapshotState.key === queryKey
        ? snapshotState.cashAccounts
        : [],
    [queryKey, snapshotState.cashAccounts, snapshotState.key],
  );
  const loading = Boolean(queryKey && snapshotState.key !== queryKey);
  const error =
    queryKey && snapshotState.key === queryKey ? snapshotState.error : null;

  const addCashAccount = useCallback(
    async (draft: Partial<CashAccountDraft>) => {
      if (!businessId) return;

      const normalizedDraft = normalizeCashAccountDraft(draft);
      if (!normalizedDraft.name) {
        void message.error('El nombre de la cuenta de caja es requerido.');
        return;
      }

      const now = Timestamp.now();
      const cashAccountRef = doc(
        collection(db, 'businesses', businessId, 'cashAccounts'),
      );
      const batch = writeBatch(db);

      batch.set(cashAccountRef, {
        ...buildCashAccountSnapshot({
          businessId,
          cashAccountId: cashAccountRef.id,
          name: normalizedDraft.name,
          currency: normalizedDraft.currency,
          type: normalizedDraft.type ?? null,
          location: normalizedDraft.location ?? null,
          openingBalance: normalizedDraft.openingBalance ?? null,
          openingBalanceDate: normalizedDraft.openingBalanceDate ?? null,
          notes: normalizedDraft.notes ?? null,
          status: 'active',
        }),
        createdAt: now,
        updatedAt: now,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
      });

      await batch.commit();
      void message.success('Cuenta de caja guardada.');
    },
    [businessId, userId],
  );

  const updateCashAccount = useCallback(
    async (cashAccountId: string, draft: Partial<CashAccountDraft>) => {
      if (!businessId || !cashAccountId) return;

      const currentCashAccount =
        cashAccounts.find((cashAccount) => cashAccount.id === cashAccountId) ??
        null;
      if (!currentCashAccount) {
        void message.error('No se encontró la cuenta de caja seleccionada.');
        return;
      }

      const normalizedDraft = normalizeCashAccountDraft(draft);
      const cashAccountRef = doc(
        db,
        'businesses',
        businessId,
        'cashAccounts',
        cashAccountId,
      );
      const now = Timestamp.now();
      const batch = writeBatch(db);

      batch.set(
        cashAccountRef,
        {
          ...buildCashAccountSnapshot({
            businessId,
            cashAccountId,
            name: normalizedDraft.name || currentCashAccount.name,
            currency: normalizedDraft.currency || currentCashAccount.currency,
            type: normalizedDraft.type ?? currentCashAccount.type ?? null,
            location:
              normalizedDraft.location ?? currentCashAccount.location ?? null,
            openingBalance:
              normalizedDraft.openingBalance ??
              currentCashAccount.openingBalance ??
              null,
            openingBalanceDate:
              normalizedDraft.openingBalanceDate ??
              currentCashAccount.openingBalanceDate ??
              null,
            notes: normalizedDraft.notes ?? currentCashAccount.notes ?? null,
            status: currentCashAccount.status,
            metadata: currentCashAccount.metadata ?? {},
          }),
          updatedAt: now,
          updatedBy: userId ?? null,
        },
        { merge: true },
      );

      await batch.commit();
      void message.success('Cuenta de caja actualizada.');
    },
    [businessId, cashAccounts, userId],
  );

  const updateCashAccountStatus = useCallback(
    async (cashAccountId: string, status: CashAccount['status']) => {
      if (!businessId || !cashAccountId) return;

      const cashAccountRef = doc(
        db,
        'businesses',
        businessId,
        'cashAccounts',
        cashAccountId,
      );
      const batch = writeBatch(db);

      batch.set(
        cashAccountRef,
        {
          status,
          updatedAt: Timestamp.now(),
          updatedBy: userId ?? null,
        },
        { merge: true },
      );

      await batch.commit();
      void message.success(
        status === 'active'
          ? 'Cuenta de caja activada.'
          : 'Cuenta de caja desactivada.',
      );
    },
    [businessId, userId],
  );

  return {
    addCashAccount,
    cashAccounts,
    error,
    loading,
    updateCashAccount,
    updateCashAccountStatus,
  };
};
