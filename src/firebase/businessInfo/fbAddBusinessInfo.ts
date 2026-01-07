// @ts-nocheck
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';

export const createBusiness = async (businessData) => {
  try {
    const business = {
      ...businessData,
      id: nanoid(),
      createdAt: serverTimestamp(),
    };
    const businessRef = doc(db, 'businesses', business.id);
    await setDoc(businessRef, { business });
    return business.id;
  } catch (error) {
    console.error('Error creating business info:', error);
    throw error;
  }
};

export const fbUpdateBusinessInfo = async (user, businessInfo) => {
  if (!user || !user.businessID) return;

  const businessInfoRef = doc(db, 'businesses', user.businessID);
  try {
    const businessDoc = await getDoc(businessInfoRef);

    if (businessDoc.exists()) {
      await updateDoc(businessInfoRef, { business: { ...businessInfo } });
    }
  } catch (error) {
    console.error('Error updating business info:', error);
    throw error;
  }
};

export const fbUpdateBusinessLogo = async (user, newLogoFile) => {
  if (!user || !user.businessID) return;

  const storage = getStorage();
  const businessInfoRef = doc(db, 'businesses', user.businessID);
  const sectionName = 'logo'; // podemos usar esto para diferentes secciones de imágenes

  try {
    const businessDoc = await getDoc(businessInfoRef);
    const currentData = businessDoc.data();

    if (currentData?.business?.logoUrl) {
      const oldLogoRef = ref(storage, currentData.business.logoUrl);
      try {
        await deleteObject(oldLogoRef);
      } catch (error) {
        // Deleting old logo failed - log and continue (not fatal)
        console.warn('Failed to delete old business logo:', error);
      }
    }

    const storageRef = ref(
      storage,
      `businesses/${user.businessID}/${sectionName}/${newLogoFile.name}`,
    );
    await uploadBytes(storageRef, newLogoFile);

    const downloadURL = await getDownloadURL(storageRef);

    await updateDoc(businessInfoRef, {
      'business.logoUrl': downloadURL,
    });

    return downloadURL;
  } catch (error) {
    console.error('Error updating business logo:', error);
    throw error;
  }
};

export const fbUpdateInvoiceType = async (user, invoiceType) => {
  if (!user || !user.businessID) return;

  const businessInfoRef = doc(db, 'businesses', user.businessID);
  try {
    await updateDoc(businessInfoRef, {
      'business.invoice.invoiceType': invoiceType,
    });
    return true;
  } catch (error) {
    console.error('Error updating invoice type:', error);
    throw error;
  }
};

export const fbUpdateInvoiceMessage = async (user, invoiceMessage) => {
  if (!user || !user.businessID) return;

  const businessInfoRef = doc(db, 'businesses', user.businessID);
  try {
    await updateDoc(businessInfoRef, {
      'business.invoice.invoiceMessage': invoiceMessage || '',
    });
    return true;
  } catch (error) {
    console.error('Error updating invoice message:', error);
    throw error;
  }
};
