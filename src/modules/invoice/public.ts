export { CreditNotesInfoCard } from './components/InvoiceDetailCards/CreditNotesInfoCard';
export { default as CreditSelector } from './components/CreditSelector/CreditSelector';
export { ElectronicTaxReceiptInfoCard } from './components/InvoiceDetailCards/ElectronicTaxReceiptInfoCard';
export { PaymentMethodInfoCard } from './components/InvoiceDetailCards/PaymentMethodInfoCard';
export { ReceivablePaymentsInfoCard } from './components/InvoiceDetailCards/ReceivablePaymentsInfoCard';
export { Invoice } from './components/Invoice/components/Invoice/Invoice';
export { InvoiceDocumentHeader } from './components/InvoiceDocumentHeader/InvoiceDocumentHeader';
export { default as InvoiceTemplates } from './components/Invoice/components/InvoiceTemplates/InvoiceTemplates';
export { TaxReceiptDepletedModal } from './components/TaxReceiptDepletedModal';

export const loadInvoicePreviewModal = () =>
  import('./pages/InvoicesPage/InvoicePreview/InvoicePreview').then(
    (module) => ({ default: module.InvoicePreview }),
  );

export const loadInvoiceWorkspaceModal = () =>
  import('./pages/InvoicesPage/InvoiceWorkspaceModal/InvoiceWorkspaceModal').then(
    (module) => ({ default: module.InvoiceWorkspaceModal }),
  );

export const loadInvoiceFormModal = () =>
  import('./pages/InvoicesPage/components/InvoiceForm/InvoiceForm').then(
    (module) => ({ default: module.InvoiceForm }),
  );

export const loadCreditNoteModal = () =>
  import('./pages/CreditNote/components/CreditNoteModal/CreditNoteModal').then(
    (module) => ({ default: module.CreditNoteModal }),
  );

export const loadCreditNoteListRoute = () =>
  import('./pages/CreditNote/CreditNoteList/CreditNoteList').then((module) => ({
    default: module.CreditNoteList,
  }));

export const loadDebitNoteListRoute = () =>
  import('./pages/DebitNote/DebitNoteList/DebitNoteList').then((module) => ({
    default: module.DebitNoteList,
  }));

export const loadInvoicesPageRoute = () =>
  import('./pages/InvoicesPage/InvoicesPage').then((module) => ({
    default: module.InvoicesPage,
  }));

export const loadReceivablePaymentReceiptRoute = () =>
  import('./pages/InvoicesPage/ReceivablePaymentReceipt').then((module) => ({
    default: module.ReceivablePaymentReceipt,
  }));

export const loadSalesAnalyticsPageRoute = () =>
  import('./pages/InvoicesPage/SalesAnalyticsPage').then((module) => ({
    default: module.SalesAnalyticsPage,
  }));

export const loadSaleReportTableComponent = () =>
  import('./pages/InvoicesPage/SaleReportTable/SaleReportTable');

export const loadServiceCommissionsReportRoute = () =>
  import('./pages/ServiceCommissionsReport/ServiceCommissionsReport').then(
    (module) => ({
      default: module.ServiceCommissionsReport,
    }),
  );
