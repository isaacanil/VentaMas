import { doc, getDoc, setDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { validateUser } from '../../utils/userValidation';
import { db } from '../firebaseconfig';

export const fbCreateTaxReceipt = async (taxReceipt, user) => {
  taxReceipt = {
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
      taxReceipt.id,
    );

    const docSnap = await getDoc(taxReceiptRef);

    if (docSnap.exists()) {
      console.info('Tax receipt already exists:', taxReceipt.id);
      return;
    }

    await setDoc(taxReceiptRef, { data: taxReceipt });
  } catch (err) {
    console.error('Error creating tax receipt:', err);
  }
};
