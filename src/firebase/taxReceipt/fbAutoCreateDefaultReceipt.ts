import {
  collection,
  onSnapshot,
  runTransaction,
  doc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { getTaxReceiptData } from '@/features/taxReceipt/taxReceiptSlice';
import { db } from '@/firebase/firebaseconfig';
import type { TaxReceiptDocument } from '@/types/taxReceipt';
import { serializeFirestoreDocuments } from '@/utils/serialization/serializeFirestoreData';
import { validateUser } from '@/utils/userValidation';

import { removeDuplicateTaxReceipts } from './removeDuplicateTaxReceipts';
import { taxReceiptDefault } from './taxReceiptsDefault';

export const useAutoCreateDefaultTaxReceipt = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user || !user.businessID) return;

    const taxReceiptsRef = collection(
      db,
      'businesses',
      user.businessID,
      'taxReceipts',
    );

    const unsubscribe = onSnapshot(taxReceiptsRef, async (snapshot) => {
      if (!snapshot.empty) {
        try {
          await removeDuplicateTaxReceipts(user.businessID);
        } catch (err) {
          console.error('Error al eliminar duplicados:', err);
        }
      } else {
        try {
          const existingReceipts = new Set<string>();
          const existingSnapshot = await getDocs(taxReceiptsRef);
          existingSnapshot.forEach((docItem) => {
            if (docItem.data().data && docItem.data().data.serie) {
              existingReceipts.add(docItem.data().data.serie);
            }
          });

          await runTransaction(db, async (transaction) => {
            const docRefs = [];
            const docSnapshots = [];

            for (const item of taxReceiptDefault) {
              if (!existingReceipts.has(item.serie)) {
                const serie = item.serie;
                const taxReceiptRef = doc(
                  db,
                  'businesses',
                  user.businessID,
                  'taxReceipts',
                  serie,
                );
                docRefs.push({ ref: taxReceiptRef, item });
                const docSnapshot = await transaction.get(taxReceiptRef);
                docSnapshots.push(docSnapshot);
              }
            }

            validateUser(user);
            docRefs.forEach((docRef, index) => {
              if (!docSnapshots[index].exists()) {
                transaction.set(docRef.ref, {
                  data: {
                    ...docRef.item,
                    id: docRef.item.serie,
                    createdAt: serverTimestamp(),
                  },
                });
              }
            });
          });

          console.log(
            'Los recibos fiscales por defecto fueron creados o ya existían.',
          );
        } catch (err) {
          console.error(
            'Error en la transacción al crear los recibos por defecto:',
            err,
          );
        }
        return;
      }

      const taxReceiptsArray = snapshot.docs.map(
        (docItem) => docItem.data() as TaxReceiptDocument,
      );
      const serializedTaxReceipts = serializeFirestoreDocuments(
        taxReceiptsArray,
      ) as TaxReceiptDocument[];
      dispatch(getTaxReceiptData(serializedTaxReceipts));
    });

    return () => {
      unsubscribe();
    };
  }, [user, dispatch]);
};
