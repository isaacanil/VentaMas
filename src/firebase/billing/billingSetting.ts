import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { CartSettings } from '@/features/cart/types';

export const setBillingSettings = async (
  user: UserIdentity | null | undefined,
  setting: Partial<CartSettings['billing']>,
) => {
  if (!user?.businessID) {
    return;
  }
  try {
    const userDocRef = doc(
      db,
      'businesses',
      user.businessID,
      'settings',
      'billing',
    );

    const docSnapshot = await getDoc(userDocRef);

    if (docSnapshot.exists()) {
      await updateDoc(userDocRef, setting);
    } else {
      await setDoc(userDocRef, setting);
    }
  } catch (error) {
    console.error(
      'Error al actualizar la configuración de facturación:',
      error,
    );
    throw error instanceof Error
      ? error
      : new Error('No se pudo actualizar la configuración de facturación.');
  }
};

export const fbBillingSettings = {
  setBillingSettings,
};
