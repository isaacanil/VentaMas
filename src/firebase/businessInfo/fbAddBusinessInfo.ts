import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

import type { BusinessInfoData } from './fbGetBusinessInfo';

export const createBusiness = async (
  businessData: BusinessInfoData,
): Promise<string> => {
  try {
    const business = {
      ...businessData,
      id: nanoid(),
      createdAt: serverTimestamp(),
    };
    const businessRef = doc(db, 'businesses', business.id);
    await setDoc(businessRef, { business });
    return business.id as string;
  } catch (error) {
    console.error('Error creating business info:', error);
    throw error;
  }
};

export const fbUpdateBusinessInfo = async (
  user: UserIdentity | null | undefined,
  businessInfo: BusinessInfoData,
): Promise<void> => {
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

export const fbUpdateBusinessLogo = async (
  user: UserIdentity | null | undefined,
  newLogoFile: File,
): Promise<string | void> => {
  if (!user || !user.businessID) return;

  const storageInstance = getStorage();
  const businessInfoRef = doc(db, 'businesses', user.businessID);
  const sectionName = 'logo'; // podemos usar esto para diferentes secciones de imagenes

  try {
    const businessDoc = await getDoc(businessInfoRef);
    const currentData = businessDoc.data() as { business?: { logoUrl?: string } } | undefined;

    if (currentData?.business?.logoUrl) {
      const oldLogoRef = ref(storageInstance, currentData.business.logoUrl);
      try {
        await deleteObject(oldLogoRef);
      } catch (error) {
        // Deleting old logo failed - log and continue (not fatal)
        console.warn('Failed to delete old business logo:', error);
      }
    }

    const storageRef = ref(
      storageInstance,
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

export const fbUpdateInvoiceType = async (
  user: UserIdentity | null | undefined,
  invoiceType: string,
): Promise<boolean | void> => {
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

export const fbUpdateInvoiceMessage = async (
  user: UserIdentity | null | undefined,
  invoiceMessage: string,
): Promise<boolean | void> => {
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
