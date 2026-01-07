import { doc, getDoc, setDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import type { TaxReceiptData, TaxReceiptUser } from '@/types/taxReceipt';
import { db } from '@/firebase/firebaseconfig';
import { validateUser } from '@/utils/userValidation';

export const fbCreateTaxReceipt = async (
  taxReceipt: TaxReceiptData,
  user: TaxReceiptUser,
) => {
  const taxReceiptWithId: TaxReceiptData = {
    ...taxReceipt,
    id: nanoid(),
  };

  try {
    validateUser(user);
    const { businessID } = user;
    const taxReceiptRef = doc(
      db,
      'businesses',
      businessID,
      'taxReceipts',
      taxReceiptWithId.id as string,
    );

    const docSnap = await getDoc(taxReceiptRef);

    if (docSnap.exists()) {
      console.info('Tax receipt already exists:', taxReceiptWithId.id);
      return;
    }

    await setDoc(taxReceiptRef, { data: taxReceiptWithId });
  } catch (err) {
    console.error('Error creating tax receipt:', err);
  }
};
