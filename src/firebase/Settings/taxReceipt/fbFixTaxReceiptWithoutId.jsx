import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../../features/auth/userSlice';
import { db } from '../../firebaseconfig';

export const updateTaxReceipt = async (user) => {
  if (!user?.businessID) return;

  try {
    const col = collection(db, 'businesses', user.businessID, 'taxReceipts');
    const snaps = await getDocs(col);
    if (snaps.empty) return;

    let batch = writeBatch(db);
    let ops = 0;

    // ✅ for…of respeta await
    for (const snap of snaps.docs) {
      const current = snap.data().data ?? {};
      if (!current.id) {
        batch.update(snap.ref, { data: { ...current, id: snap.id } });
        ops++;

        if (ops === 500) {
          // límite Firestore
          await batch.commit();
          batch = writeBatch(db);
          ops = 0;
        }
      }
    }

    if (ops > 0) await batch.commit(); // último lote pendiente
    console.info(`updateTaxReceipt: ${snaps.size} recibos revisados ✅`);
  } catch (error) {
    console.error(error);
  }
};

export const useFixTaxReceiptWithoutId = () => {
  const user = useSelector(selectUser);
  const { businessID } = user || {};

  const fixReceipts = useCallback(() => {
    if (businessID) updateTaxReceipt(user);
  }, [businessID]);

  useEffect(() => {
    fixReceipts();
  }, [fixReceipts]);
};
