import {
  collection,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

/** 8 dígitos para B, 10 para E */
const defaultLength = (serie?: string) => (serie === 'B' ? 8 : 10);

type TaxReceiptRecord = {
  id?: string;
  name?: string;
  type?: string;
  serie?: string;
  sequence?: number;
  sequenceLength?: number;
  increase?: number;
  quantity?: number | string;
  disabled?: boolean;
};

export function useTaxReceiptsFix() {
  const [taxReceipts, setTaxReceipts] = useState<TaxReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const user = useSelector(selectUser) as UserIdentity | null;
  const businessID = user?.businessID;
  useEffect(() => {
    if (!businessID) {
      // No businessID available yet, skip initialization
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = collection(db, 'businesses', businessID, 'taxReceipts');

    const unsubscribe = onSnapshot(
      ref,
      async (snapshot) => {
        /* ── Early-return global (REMOVED) ───────────────────── */
        // The check that blocked non-string sequences is removed
        // because we want to allow numbers (already migrated) or strings (to be migrated).
        /* ────────────────────────────────────────────────────── */

        /* 1) Primer pase: defaults + conversión */
        await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const raw = (docSnap.data().data ?? {}) as TaxReceiptRecord;
            const updates: Record<string, unknown> = {};

            // id por defecto
            if (raw.id !== docSnap.id) updates['data.id'] = docSnap.id;
            // disabled por defecto
            if (typeof raw.disabled !== 'boolean')
              updates['data.disabled'] = false;
            // sequenceLength por defecto
            if (typeof raw.sequenceLength !== 'number')
              updates['data.sequenceLength'] = defaultLength(raw.serie);
            // convertir sequence string → número
            const seqNum = Number(raw.sequence);
            if (!Number.isNaN(seqNum)) updates['data.sequence'] = seqNum;

            if (Object.keys(updates).length) {
              await updateDoc(
                doc(db, 'businesses', businessID, 'taxReceipts', docSnap.id),
                updates,
              );
            }
          }),
        );

        /* 2) Segundo pase: lectura ya migrada */
        const receipts: TaxReceiptRecord[] = snapshot.docs.map((docSnap) => {
          const r = docSnap.data().data as TaxReceiptRecord;
          return {
            id: r.id,
            name: r.name,
            type: r.type,
            serie: r.serie,
            sequence: r.sequence, // ya número
            sequenceLength: r.sequenceLength,
            increase: r.increase,
            quantity: r.quantity,
            disabled: r.disabled,
          };
        });

        setTaxReceipts(receipts);
        setLoading(false);
      },
      (err) => {
        console.error('Snapshot error:', err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [businessID]);

  /** Incrementa y persiste data.sequence (número) en Firestore */
  const updateSequence = async (docId: string, delta = 1) => {
    if (!businessID) {
      console.warn('updateSequence: no businessID');
      return;
    }
    try {
      const docRef = doc(db, 'businesses', businessID, 'taxReceipts', docId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error('Receipt not found');

      const current = (snap.data().data as TaxReceiptRecord | undefined)?.sequence;
      if (typeof current !== 'number') {
        console.warn('updateSequence: sequence no es numérico; se omite.');
        return; // ⛔️   aborta si no es número
      }

      const nextSeq = current + delta;
      await updateDoc(docRef, { 'data.sequence': nextSeq });
      // onSnapshot refrescará automáticamente
    } catch (err) {
      console.error('Error updating sequence:', err);
      setError(err as Error);
    }
  };

  /** Devuelve el NCF completo con padding de ceros */
  const formatNCF = ({ type, serie, sequence, sequenceLength }: TaxReceiptRecord) =>
    `${type ?? ''}${serie ?? ''}${String(sequence ?? 0).padStart(sequenceLength ?? 0, '0')}`;

  return { taxReceipts, loading, error, updateSequence, formatNCF };
}
