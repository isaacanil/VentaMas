import { GenericClient } from '@/features/clientCart/clientCartSlice';
import type { CartState, Delivery, PaymentMethod } from '../types';

const defaultDelivery: Delivery = {
  status: false,
  value: '',
};

const defaultClient = {
  name: '',
  tel: '',
  address: '',
  personalID: '',
  delivery: defaultDelivery,
};

const defaultPaymentMethod: PaymentMethod[] = [
  {
    method: 'cash',
    value: 0,
    status: true,
  },
  {
    method: 'card',
    value: 0,
    bankAccountId: null,
    reference: '',
    status: false,
  },
  {
    method: 'transfer',
    value: 0,
    bankAccountId: null,
    reference: '',
    status: false,
  },
];

const initialState: CartState = {
  permission: {
    openCashReconciliation: false,
  },
  settings: {
    taxReceipt: { enabled: false },
    printInvoice: true,
    isInvoicePanelOpen: false,
    billing: {
      billingMode: 'direct',
      authorizationFlowEnabled: false,
      enabledAuthorizationModules: {
        invoices: true,
        accountsReceivable: true,
        cashRegister: true,
      },
      subscriptionEmailNotifications: true,
      subscriptionPaymentReminder: true,
      isLoading: false,
      isError: null,
    },
  },
  isOpen: false,
  showCxcAutoRemovalNotification: false,
  data: {
    isAddedToReceivables: false,
    id: '',
    seller: {},
    client: GenericClient,
    products: [],
    change: {
      value: 0,
    },
    delivery: defaultDelivery,
    discount: {
      value: 0,
    },
    dueDate: null,
    hasDueDate: false,
    paymentMethod: defaultPaymentMethod,
    NCF: null,
    totalShoppingItems: {
      value: 0,
    },
    totalPurchaseWithoutTaxes: {
      value: 0,
    },
    totalTaxes: {
      value: 0,
    },
    payment: {
      //pago realizado por el cliente
      value: 0,
    },
    totalPurchase: {
      value: 0,
    },
    sourceOfPurchase: 'Presencial',
    status: 'completed',
    preorderDetails: {
      preorderNumber: null,
      createdAt: null,
    },
    history: [],
    insuranceEnabled: false,
    totalInsurance: {
      value: 0,
    },
    invoiceComment: '',
    creditNotePayment: [],
    documentCurrency: 'DOP',
    functionalCurrency: 'DOP',
    mixedCurrencySale: false,
    manualRatesByCurrency: {},
    exchangeRate: 1,
    rateOverride: null,
    authorizationContext: {
      discount: null,
    },
  },
};
/*los estados pueden ser:
    - preorder
    - completed
    - cancelled-preorder
    - cancelled
    - refunded
*/
export { defaultClient, defaultDelivery, defaultPaymentMethod, initialState };

