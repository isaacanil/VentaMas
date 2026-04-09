import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

type TaxReceiptSettingsDoc = {
  taxReceiptEnabled?: boolean;
};

export const fbEnabledTaxReceipt = async (
  user: UserIdentity | null | undefined,
): Promise<void> => {
  if (!user || !user?.businessID) return;

  try {
    const settingRef = doc(
      db,
      'businesses',
      user.businessID,
      'settings',
      'taxReceipt',
    );
    const docSnap = await getDoc(settingRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as TaxReceiptSettingsDoc;
      const currentValue = Boolean(data.taxReceiptEnabled);
      await updateDoc(settingRef, { taxReceiptEnabled: !currentValue });
    } else {
      await setDoc(settingRef, { taxReceiptEnabled: true });
    }
  } catch (error) {
    console.error(
      'Ocurrio un error al actualizar el comprobante fiscal:',
      error,
    );
  }
};
