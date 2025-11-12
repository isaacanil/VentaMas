import { setDoc, Timestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { defaultPaymentsAR } from '../../../schema/accountsReceivable/paymentAR';
import { getDocRef } from '../../firebaseOperations';

export const fbAddPayment = async (user, paymentDetails) => {
  const id = nanoid();
  const paymentsRef = getDocRef(
    'businesses',
    user.businessID,
    'accountsReceivablePayments',
    id,
  );
  const paymentData = {
    ...defaultPaymentsAR,
    ...paymentDetails,
    id,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdUserId: user?.uid,
    updatedUserId: user?.uid,
    isActive: true,
  };
  await setDoc(paymentsRef, paymentData);
  return paymentData;
};
