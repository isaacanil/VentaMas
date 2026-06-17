import { DateTime } from 'luxon';

export const defaultAR = {
  id: '',
  invoiceId: '',
  clientId: '',
  paymentFrequency: 'monthly',
  totalInstallments: 1,
  installmentAmount: 0.0,
  paymentDate: null,
  lastPaymentDate: null,
  lastPayment: 0.0,
  totalReceivable: 0.0,
  currentBalance: 0.0,
  arBalance: 0.0,
  isClosed: false,
  isActive: true,
  createdAt: DateTime.now().toMillis(),
  updatedAt: DateTime.now().toMillis(),
  createdBy: '',
  updatedBy: '',
  comments: '',
};

export const defaultPaymentsAR = {
  id: '',
  paymentMethods: [
    {
      method: 'cash',
      value: 0.0,
      status: true,
    },
    {
      method: 'card',
      value: 0.0,
      bankAccountId: null,
      reference: '',
      status: false,
    },
    {
      method: 'transfer',
      value: 0.0,
      bankAccountId: null,
      reference: '',
      status: false,
    },
  ],
  totalPaid: 0.0,
  createdAt: new Date(),
  updatedAt: new Date(),
  comments: '',
  createdUserId: '',
  updatedUserId: '',
  isActive: true,
};

export const defaultInstallmentPaymentsAR = {
  id: '',
  installmentId: '',
  paymentId: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  paymentAmount: 0.0,
  createdBy: '',
  updatedBy: '',
  isActive: true,
};
