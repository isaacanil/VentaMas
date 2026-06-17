import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import { resolveCashCountEmployeeId } from '@/utils/cashCount/resolveEmployeeId';
import type { CashCountRecord } from '@/utils/cashCount/types';
import { formatLocaleDate } from '@/utils/date/dateUtils';
import { toValidDate } from '@/utils/date/toValidDate';
import { normalizeFirestoreUser } from '@/utils/users/normalizeFirestoreUser';

export interface CashRegisterOption {
  label: string;
  value: string;
  employeeId?: string | null;
}

export const useOpenCashRegisters = (
  businessID: string | null | undefined,
  isOpen: boolean,
): CashRegisterOption[] => {
  const [options, setOptions] = useState<CashRegisterOption[]>([]);

  useEffect(() => {
    if (!businessID || !isOpen) return undefined;

    const ref = collection(db, 'businesses', businessID, 'cashCounts');
    const q = query(ref, where('cashCount.state', '==', 'open'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const registers = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data() as { cashCount?: CashCountRecord };
          const { id, incrementNumber, opening } = data.cashCount || {};
          if (!id) return null;

          const date = toValidDate(opening?.date) ?? new Date();
          const dateStr = formatLocaleDate(date);

          let name = 'Usuario desconocido';
          if (opening?.employee && 'path' in opening.employee) {
            try {
              const employeeSnapshot = await getDoc(
                doc(db, opening.employee.path),
              );
              if (employeeSnapshot.exists()) {
                const normalized = normalizeFirestoreUser(
                  employeeSnapshot.id,
                  employeeSnapshot.data(),
                );
                name =
                  normalized.displayName ||
                  normalized.realName ||
                  normalized.name ||
                  name;
              }
            } catch (fetchError) {
              console.warn('Failed to resolve employee name', fetchError);
            }
          }

          return {
            label: `Cuadre #${incrementNumber || 'N/A'} - ${dateStr} - ${name}`,
            value: id,
            employeeId: resolveCashCountEmployeeId(opening?.employee),
          };
        }),
      );
      setOptions(registers.filter(Boolean) as CashRegisterOption[]);
    });

    return () => unsubscribe();
  }, [businessID, isOpen]);

  return options;
};
