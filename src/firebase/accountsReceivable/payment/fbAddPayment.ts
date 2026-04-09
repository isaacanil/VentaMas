import { setDoc, Timestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { getDocRef } from '@/firebase/firebaseOperations';
import { defaultPaymentsAR } from '@/schema/accountsReceivable/paymentAR';
import type { UserIdentity } from '@/types/users';
import {
  resolveMonetarySnapshotForBusiness,
} from '@/utils/accounting/monetary';
import type { AccountsReceivablePayment } from '@/utils/accountsReceivable/types';

export const fbAddPayment = async (
  user: UserIdentity,
  paymentDetails: AccountsReceivablePayment & {
    paymentMethod?: AccountsReceivablePayment['paymentMethods'];
  },
): Promise<AccountsReceivablePayment> => {
  const id = nanoid();
  const paymentsRef = getDocRef(
    'businesses',
    user.businessID,
    'accountsReceivablePayments',
    id,
  );
  const paymentMethod =
    paymentDetails?.paymentMethod || paymentDetails?.paymentMethods || [];
  const amountPaid =
    paymentDetails?.totalPaid ||
    paymentDetails?.totalAmount ||
    paymentDetails?.amount ||
    0;
  const paymentData: AccountsReceivablePayment = {
    ...defaultPaymentsAR,
    ...paymentDetails,
    id,
    paymentMethod,
    paymentMethods: paymentMethod,
    amount: amountPaid,
    date: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdUserId: user?.uid,
    updatedUserId: user?.uid,
    isActive: true,
  };
  if (!paymentData.monetary) {
    const monetary = await resolveMonetarySnapshotForBusiness({
      businessId: user?.businessID,
      monetary: null,
      source: paymentData,
      totals: {
        total: paymentData.totalAmount ?? paymentData.amount,
        paid: paymentData.totalPaid ?? paymentData.amount,
        balance: 0,
      },
      capturedBy: user?.uid ?? null,
    });
    if (monetary) {
      paymentData.monetary = monetary;
    }
  }
  await setDoc(paymentsRef, paymentData);
  return paymentData;
};
