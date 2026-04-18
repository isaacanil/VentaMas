import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { db, functions } from '@/firebase/firebaseconfig';
import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import type { InvoiceSignatureAssets } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';

import type { BusinessInfoData } from './fbGetBusinessInfo';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export const normalizeBusinessInfoForUpdate = (
  businessInfo: BusinessInfoData,
): BusinessInfoData => {
  const normalizedBusinessInfo = {
    ...businessInfo,
  };

  // Old business docs may still contain business.business nesting.
  // Keeping that stale subtree makes readers prefer outdated values after save.
  delete normalizedBusinessInfo.business;

  const normalizedInvoice = isRecord(normalizedBusinessInfo.invoice)
    ? { ...normalizedBusinessInfo.invoice }
    : undefined;

  if (normalizedInvoice && isRecord(normalizedInvoice.business)) {
    delete normalizedInvoice.business;
  }

  if (normalizedInvoice) {
    normalizedBusinessInfo.invoice = normalizedInvoice;
  }

  return normalizedBusinessInfo;
};

export const createBusiness = async (
  businessData: BusinessInfoData,
): Promise<{
  businessId: string;
  role?: string;
  hasMultipleBusinesses?: boolean;
  onboardingSubscriptionStatus?: string | null;
  subscriptionStatus?: string | null;
  subscriptionPlanId?: string | null;
}> => {
  try {
    const callable = httpsCallable<
      { business: BusinessInfoData; sessionToken?: string },
      {
        id?: string;
        businessId?: string;
        ok?: boolean;
        role?: string;
        hasMultipleBusinesses?: boolean;
        onboardingSubscriptionStatus?: string | null;
        subscriptionStatus?: string | null;
        subscriptionPlanId?: string | null;
      }
    >(functions, 'clientCreateBusinessForCurrentAccount');
    const { sessionToken } = getStoredSession();
    const response = await callable({
      business: businessData,
      ...(sessionToken ? { sessionToken } : {}),
    });
    const data = response?.data as
      | {
          id?: string;
          businessId?: string;
          ok?: boolean;
          role?: string;
          hasMultipleBusinesses?: boolean;
          onboardingSubscriptionStatus?: string | null;
          subscriptionStatus?: string | null;
          subscriptionPlanId?: string | null;
        }
      | undefined;
    const createdId = data?.businessId || data?.id;
    if (!createdId) {
      throw new Error('Respuesta invalida al crear el negocio.');
    }
    return {
      businessId: createdId,
      role: data?.role,
      hasMultipleBusinesses: data?.hasMultipleBusinesses,
      onboardingSubscriptionStatus: data?.onboardingSubscriptionStatus,
      subscriptionStatus: data?.subscriptionStatus,
      subscriptionPlanId: data?.subscriptionPlanId,
    };
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
      await updateDoc(businessInfoRef, {
        business: normalizeBusinessInfoForUpdate(businessInfo),
      });
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
    const currentData = businessDoc.data() as
      | { business?: { logoUrl?: string } }
      | undefined;

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

export const fbUploadBusinessLogoByBusinessId = async (
  businessId: string,
  newLogoFile: File,
): Promise<string> => {
  const normalizedBusinessId = businessId?.trim();
  if (!normalizedBusinessId) {
    throw new Error('businessId es requerido para subir el logo.');
  }

  const storageInstance = getStorage();
  const businessInfoRef = doc(db, 'businesses', normalizedBusinessId);
  const sanitizedFileName = newLogoFile.name.replace(/\s+/g, '-');
  const storageRef = ref(
    storageInstance,
    `businesses/${normalizedBusinessId}/logo/${Date.now()}-${sanitizedFileName}`,
  );

  try {
    await uploadBytes(storageRef, newLogoFile);
    const downloadURL = await getDownloadURL(storageRef);

    await updateDoc(businessInfoRef, {
      'business.logoUrl': downloadURL,
    });

    return downloadURL;
  } catch (error) {
    console.error('Error uploading business logo by businessId:', error);
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

const INVOICE_SIGNATURE_ASSET_FIELD_MAP = {
  signature: 'signatureUrl',
  stamp: 'stampUrl',
} as const;

type InvoiceSignatureAssetType = keyof typeof INVOICE_SIGNATURE_ASSET_FIELD_MAP;

const deleteBusinessAssetByUrl = async (
  storageInstance: ReturnType<typeof getStorage>,
  url: string | null | undefined,
): Promise<void> => {
  if (!url) return;

  try {
    await deleteObject(ref(storageInstance, url));
  } catch (error) {
    console.warn('Failed to delete old business asset:', error);
  }
};

export const fbUpdateInvoiceSignatureAssets = async (
  user: UserIdentity | null | undefined,
  signatureAssets: Partial<InvoiceSignatureAssets>,
): Promise<boolean | void> => {
  if (!user || !user.businessID) return;

  const businessInfoRef = doc(db, 'businesses', user.businessID);

  try {
    await updateDoc(businessInfoRef, {
      'business.invoice.signatureAssets': signatureAssets,
    });
    return true;
  } catch (error) {
    console.error('Error updating invoice signature assets:', error);
    throw error;
  }
};

export const fbUploadBusinessInvoiceSignatureAsset = async (
  user: UserIdentity | null | undefined,
  assetType: InvoiceSignatureAssetType,
  file: File,
  onStageChange?: (stage: 'uploading' | 'saving') => void,
): Promise<string | void> => {
  if (!user || !user.businessID) return;

  const storageInstance = getStorage();
  const businessInfoRef = doc(db, 'businesses', user.businessID);
  const fieldName = INVOICE_SIGNATURE_ASSET_FIELD_MAP[assetType];

  try {
    const businessDoc = await getDoc(businessInfoRef);
    const currentData = businessDoc.data() as
      | {
          business?: {
            invoice?: {
              signatureAssets?: InvoiceSignatureAssets;
            };
          };
        }
      | undefined;

    await deleteBusinessAssetByUrl(
      storageInstance,
      currentData?.business?.invoice?.signatureAssets?.[fieldName] || null,
    );

    const sanitizedFileName = file.name.replace(/\s+/g, '-');
    const storageRef = ref(
      storageInstance,
      `businesses/${user.businessID}/invoice-assets/${assetType}/${Date.now()}-${sanitizedFileName}`,
    );

    onStageChange?.('uploading');
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    onStageChange?.('saving');
    await updateDoc(businessInfoRef, {
      [`business.invoice.signatureAssets.${fieldName}`]: downloadURL,
    });

    return downloadURL;
  } catch (error) {
    console.error(`Error updating invoice ${assetType} asset:`, error);
    throw error;
  }
};

export const fbRemoveBusinessInvoiceSignatureAsset = async (
  user: UserIdentity | null | undefined,
  assetType: InvoiceSignatureAssetType,
): Promise<boolean | void> => {
  if (!user || !user.businessID) return;

  const storageInstance = getStorage();
  const businessInfoRef = doc(db, 'businesses', user.businessID);
  const fieldName = INVOICE_SIGNATURE_ASSET_FIELD_MAP[assetType];

  try {
    const businessDoc = await getDoc(businessInfoRef);
    const currentData = businessDoc.data() as
      | {
          business?: {
            invoice?: {
              signatureAssets?: InvoiceSignatureAssets;
            };
          };
        }
      | undefined;

    await deleteBusinessAssetByUrl(
      storageInstance,
      currentData?.business?.invoice?.signatureAssets?.[fieldName] || null,
    );

    await updateDoc(businessInfoRef, {
      [`business.invoice.signatureAssets.${fieldName}`]: '',
    });

    return true;
  } catch (error) {
    console.error(`Error removing invoice ${assetType} asset:`, error);
    throw error;
  }
};
