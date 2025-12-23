import { setDoc, Timestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { defaultPaymentsAR } from '@/schema/accountsReceivable/paymentAR';
import { getDocRef } from '@/firebase/firebaseOperations';

export const fbAddPayment = async (user, paymentDetails) => {
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
  const paymentData = {
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
