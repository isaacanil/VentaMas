import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { DateTime } from 'luxon';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import { getNextID } from '@/firebase/Tools/getNextID';
import { sanitizeFirestoreDocument } from '@/utils/firebase/sanitizeFirestoreDocument';

type UserWithBusinessAndUid = {
  businessID: string;
  uid: string;
};

type QuotationData = Record<string, unknown> & {
  id?: string;
  expirationDate?: Date;
  expired?: boolean;
};

type QuotationSettings = {
  quoteValidity?: number | null;
  quoteDefaultNote?: string | null;
};

function calculateExpirationDate(days: number): Date {
  return DateTime.now().plus({ days }).toJSDate();
}

export async function getQuotations(
  user: UserWithBusinessAndUid,
): Promise<QuotationData[]> {
  try {
    const quotationsRef = collection(
      db,
      'businesses',
      user.businessID,
      'quotations',
    );
    const quotationsSnapshot = await getDocs(quotationsRef);
    const quotations: QuotationData[] = quotationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as QuotationData),
    }));
    return quotations;
  } catch (error) {
    console.error('Error fetching quotations:', error);
    throw new Error('Could not fetch quotations');
  }
}

export async function getQuotation(
  user: UserWithBusinessAndUid,
  quotationId: string,
): Promise<QuotationData> {
  try {
    const quotationRef = doc(
      db,
      'businesses',
      user.businessID,
      'quotations',
      quotationId,
    );

    const quotationSnapshot = await getDoc(quotationRef);
    if (quotationSnapshot.exists()) {
      const quotationData = quotationSnapshot.data() as QuotationData;
      const expirationDate = quotationData.expirationDate;
      quotationData.expired = expirationDate instanceof Date ? expirationDate < new Date() : false;
      return quotationData;
    } else {
      throw new Error('Quotation not found');
    }
  } catch (error) {
    console.error('Error fetching quotation:', error);
    throw new Error('Could not fetch quotation');
  }
}

export async function addQuotation(
  user: UserWithBusinessAndUid,
  quotationData: QuotationData,
  quotationSettings?: QuotationSettings | null,
): Promise<QuotationData> {
  try {
    const id = nanoid();
    const quotationRef = doc(
      db,
      'businesses',
      user.businessID,
      'quotations',
      id,
    );

    const validityDays = quotationSettings?.quoteValidity ?? 30; // Default to 30 days if undefined/null
    const defaultNote = quotationSettings?.quoteDefaultNote ?? ''; // Default to empty string if undefined/null

    const data = {
      ...quotationData,
      id,
      numberID: await getNextID(user, 'quotations'),
      date: serverTimestamp(),
      createdBy: user.uid,
      note: defaultNote,
      validity: validityDays,
      expirationDate: calculateExpirationDate(validityDays),
    };

    const sanitizedData = sanitizeFirestoreDocument(data);

    await setDoc(quotationRef, sanitizedData);

    const quotation = await getQuotation(user, id);

    return quotation;
  } catch (error) {
    console.error('Error adding quotation:', error);
    throw new Error('Could not add quotation');
  }
}
