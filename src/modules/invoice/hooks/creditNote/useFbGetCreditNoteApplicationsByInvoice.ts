import { useFbGetCreditNoteApplications } from './useFbGetCreditNoteApplications';

/**
 * Hook para obtener aplicaciones de notas de crédito por factura
 * @param {string} invoiceId - ID de la factura
 * @returns {Object} - { applications, loading }
 */
export const useFbGetCreditNoteApplicationsByInvoice = (
  invoiceId: string | null | undefined,
) => {
  return useFbGetCreditNoteApplications(invoiceId ? { invoiceId } : {});
};
