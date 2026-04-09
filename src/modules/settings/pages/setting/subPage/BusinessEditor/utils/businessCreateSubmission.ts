import {
  createBusiness,
  fbUploadBusinessLogoByBusinessId,
} from '@/firebase/businessInfo/fbAddBusinessInfo';

import type { BusinessProfileFormValues } from '../components/BusinessProfileForm';

interface BusinessCreationSuccessResult {
  status: 'pending_subscription' | 'success';
  createdBusinessId: string;
  hasMultipleBusinesses: boolean;
  logoUploadErrorMessage: string | null;
  role: string;
}

interface BusinessCreationErrorResult {
  errorMessage: string;
  status: 'error';
}

export type BusinessCreationResult =
  | BusinessCreationSuccessResult
  | BusinessCreationErrorResult;

export const submitBusinessCreation = async ({
  logoFile,
  values,
}: {
  logoFile: File | null;
  values: BusinessProfileFormValues;
}): Promise<BusinessCreationResult> => {
  const businessData = {
    name: values.name || '',
    logoUrl: '',
    country: values.country || '',
    province: values.province || '',
    tel: values.tel || '',
    email: values.email || '',
    rnc: values.rnc || '',
    address: values.address || '',
    businessType: values.businessType || 'general',
    invoice: {
      invoiceMessage: '',
      invoiceType: 'invoiceTemplate1',
    },
  };

  try {
    const createdBusiness = await createBusiness(businessData);
    const createdBusinessId = createdBusiness.businessId;
    let logoUploadErrorMessage: string | null = null;

    if (logoFile) {
      try {
        await fbUploadBusinessLogoByBusinessId(createdBusinessId, logoFile);
      } catch (uploadError: unknown) {
        logoUploadErrorMessage =
          uploadError instanceof Error
            ? uploadError.message
            : 'No se pudo subir el logo.';
      }
    }

    return {
      status:
        createdBusiness.onboardingSubscriptionStatus === 'pending'
          ? 'pending_subscription'
          : 'success',
      createdBusinessId,
      hasMultipleBusinesses: createdBusiness.hasMultipleBusinesses ?? false,
      logoUploadErrorMessage,
      role: createdBusiness.role || 'owner',
    };
  } catch (error: unknown) {
    return {
      status: 'error',
      errorMessage:
        error instanceof Error ? error.message : 'Error al crear el negocio',
    };
  }
};
