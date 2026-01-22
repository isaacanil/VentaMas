import { setDoc, Timestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { getDocRef } from '@/firebase/firebaseOperations';
import { defaultPaymentsAR } from '@/schema/accountsReceivable/paymentAR';
import type { UserIdentity } from '@/types/users';
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
  await setDoc(paymentsRef, paymentData);
  return paymentData;
};
