import {
  fbUpdateBusinessInfo,
  fbUpdateBusinessLogo,
} from '@/firebase/businessInfo/fbAddBusinessInfo';

import type { BusinessProfileFormValues } from '../components/BusinessProfileForm';

interface BusinessLogoUpdateResult {
  downloadURL?: string;
  errorMessage?: string;
  status: 'error' | 'success';
}

interface BusinessUpdateResult {
  errorMessage?: string;
  status: 'error' | 'success';
}

export const uploadBusinessLogoUpdate = async ({
  file,
  user,
}: {
  file: File | null | undefined;
  user: unknown;
}): Promise<BusinessLogoUpdateResult> => {
  if (!file) {
    return {
      status: 'error',
      errorMessage: 'No se pudo procesar la imagen seleccionada.',
    };
  }

  try {
    const downloadURL = await fbUpdateBusinessLogo(user, file);
    return {
      status: 'success',
      downloadURL,
    };
  } catch {
    return {
      status: 'error',
      errorMessage: 'Error al actualizar el logo',
    };
  }
};

export const submitBusinessUpdate = async ({
  business,
  imageUrl,
  user,
  values,
}: {
  business: any;
  imageUrl: string | null;
  user: unknown;
  values: BusinessProfileFormValues;
}): Promise<BusinessUpdateResult> => {
  const invoiceData = {
    ...(business?.invoice || {}),
    invoiceMessage: business?.invoice?.invoiceMessage || '',
    invoiceType: business?.invoice?.invoiceType || 'invoiceTemplate1',
    ...(values?.invoice || {}),
  };
  const businessData = {
    ...business,
    ...values,
    logoUrl: imageUrl || '',
    logo: values.logo || '',
    country: values.country || '',
    province: values.province || '',
    tel: values.tel || '',
    email: values.email || '',
    rnc: values.rnc || '',
    address: values.address || '',
    name: values.name || '',
    businessType: values.businessType || 'general',
    invoice: invoiceData,
  };

  try {
    await fbUpdateBusinessInfo(user, businessData);
    return { status: 'success' };
  } catch (error: unknown) {
    return {
      status: 'error',
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Error al actualizar la información',
    };
  }
};
