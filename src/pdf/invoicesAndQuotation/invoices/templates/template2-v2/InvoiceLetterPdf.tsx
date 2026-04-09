import React from 'react';
import { pdf } from '@react-pdf/renderer';

import type {
  InvoicePdfBusiness,
  InvoicePdfData,
} from '@/pdf/invoicesAndQuotation/types';

import { InvoiceLetterDocument } from './InvoiceLetterDocument';

const blobToBase64 = async (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;

      if (typeof result !== 'string') {
        reject(new Error('No se pudo convertir el PDF beta a base64.'));
        return;
      }

      const [, base64 = ''] = result.split(',');
      resolve(base64);
    };
    reader.onerror = () => {
      reject(reader.error || new Error('No se pudo leer el PDF beta.'));
    };
    reader.readAsDataURL(blob);
  });
};

export const generateInvoiceLetterPdf = async (
  business: InvoicePdfBusiness,
  data: InvoicePdfData,
): Promise<string> => {
  const blob = await pdf(
    <InvoiceLetterDocument business={business} data={data} />,
  ).toBlob();

  return blobToBase64(blob);
};
