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
import { toValidDate } from '@/utils/date/toValidDate';
import type { CashCountRecord } from '@/utils/cashCount/types';

interface CashRegisterOption {
  label: string;
  value: string;
}

export const useOpenCashRegisters = (
  businessID: string | null | undefined,
  isOpen: boolean,
): CashRegisterOption[] => {
  const [options, setOptions] = useState<CashRegisterOption[]>([]);

  useEffect(() => {
    if (!businessID || !isOpen) return;

    const ref = collection(db, 'businesses', businessID, 'cashCounts');
    const q = query(ref, where('cashCount.state', '==', 'open'));

    const unsub = onSnapshot(q, async (snapshot) => {
      const regs = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data() as { cashCount?: CashCountRecord };
          const { id, incrementNumber, opening } = data.cashCount || {};
          if (!id) return null;

          // Format date
          const date = toValidDate(opening?.date) ?? new Date();
          const dateStr = date.toLocaleDateString('es-ES');

          // Fetch employee name
          let name = 'Usuario desconocido';
          if (opening?.employee && 'path' in opening.employee) {
            try {
              const empSnap = await getDoc(doc(db, opening.employee.path));
              if (empSnap.exists()) {
                const d = empSnap.data() as { name?: string; user?: { name?: string } };
                name = d.name || d.user?.name || name;
              }
            } catch (fetchError) {
              console.warn('Failed to resolve employee name', fetchError);
            }
          }

          return {
            label: `Cuadre #${incrementNumber || 'N/A'} - ${dateStr} - ${name}`,
            value: id,
          };
        }),
      );
      setOptions(regs.filter(Boolean) as CashRegisterOption[]);
    });

    return () => unsub();
  }, [businessID, isOpen]);

  return options;
};
