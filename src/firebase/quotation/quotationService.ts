// @ts-nocheck
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

function calculateExpirationDate(days) {
  return DateTime.now().plus({ days }).toJSDate();
}

export async function getQuotations(user) {
  try {
    const quotationsRef = collection(
      db,
      'businesses',
      user.businessID,
      'quotations',
    );
    const quotationsSnapshot = await getDocs(quotationsRef);
    const quotations = quotationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return quotations;
  } catch (error) {
    console.error('Error fetching quotations:', error);
    throw new Error('Could not fetch quotations');
  }
}

export async function getQuotation(user, quotationId) {
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
      const quotationData = quotationSnapshot.data();
      quotationData.expired = quotationData.expirationDate < new Date();
      return quotationData;
    } else {
      throw new Error('Quotation not found');
    }
  } catch (error) {
    console.error('Error fetching quotation:', error);
    throw new Error('Could not fetch quotation');
  }
}

export async function addQuotation(user, quotationData, quotationSettings) {
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
