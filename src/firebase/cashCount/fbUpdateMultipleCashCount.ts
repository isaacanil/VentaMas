import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import { CashCountMetaData } from '@/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/components/Body/RightSide/CashCountMetaData';
import type { CashCountRecord } from '@/utils/cashCount/types';
import { fbLoadInvoicesForCashCount } from './fbLoadInvoicesForCashCount';

interface CashCountDocData {
  cashCount?: CashCountRecord;
}

// Esta función recorre todos los negocios y actualiza los cuadres de caja en cada uno
export const fbUpdateAllBusinessCashCounts = async () => {
  try {
    const businesses = await getBusinesses();
    for (const businessId of businesses) {
      try {
        const cashCountsRef = collection(
          db,
          `businesses/${businessId}/cashCounts`,
        );
        const cashCountsSnapshot = await getDocs(cashCountsRef);

        for (const cashCountDoc of cashCountsSnapshot.docs) {
          try {
            const cashCountID = cashCountDoc.id;
            const cashCount = (cashCountDoc.data() as CashCountDocData)
              .cashCount;
            if (!cashCount) continue;

            const user = { businessID: businessId };
            const invoices = await fbLoadInvoicesForCashCount(
              user,
              cashCountID,
            );

            const cashCountMetaData = CashCountMetaData(cashCount, invoices);
            if (cashCountMetaData) {
              await updateCashCountWithMetaData(
                businessId,
                cashCountID,
                cashCountMetaData,
              );
            }
          } catch (error) {
            console.error(
              `Error processing cash count ${cashCountDoc.id} for business ${businessId}: ${error}`,
            );
          }
        }
      } catch (error) {
        console.error(`Error processing businesses ${businessId}: ${error}`);
      }
    }
  } catch (error) {
    console.error(`Error retrieving businesses: ${error}`);
  }
};

const getBusinesses = async () => {
  const businessRef = collection(db, 'businesses');
  const businessSnapshot = await getDocs(businessRef);
  return businessSnapshot.docs.map((docSnap) => docSnap.id);
};

const updateCashCountWithMetaData = async (
  businessId: string,
  cashCountID: string,
  metaData: Record<string, number>,
) => {
  const cashCountRef = doc(
    db,
    `businesses/${businessId}/cashCounts`,
    cashCountID,
  );

  const cashCountDoc = await getDoc(cashCountRef);
  if (cashCountDoc.exists()) {
    const existingData = (cashCountDoc.data() as CashCountDocData).cashCount;

    const updatedData = {
      ...existingData,
      ...metaData,
    };

    await updateDoc(cashCountRef, { cashCount: updatedData });
  } else {
    console.error(`No cashCount found with ID ${cashCountID}`);
  }
};
