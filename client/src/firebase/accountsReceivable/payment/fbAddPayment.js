import { setDoc, Timestamp } from "firebase/firestore";
import { defaultPaymentsAR } from "../../../schema/accountsReceivable/paymentAR";
import { getDocRef } from "../../firebaseOperations";
import { nanoid } from "nanoid";

export const fbAddPayment = async (user, paymentDetails) => {
    const paymentId = nanoid();
    const paymentsRef = getDocRef("businesses", user.businessID, "accountsReceivablePayments", paymentId);
    const paymentData = {
        ...defaultPaymentsAR,
        paymentId,
        ...paymentDetails,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdUserId: user?.uid,
        updatedUserId: user?.uid,
        isActive: true
    };
    await setDoc(paymentsRef, paymentData);
    return paymentId;
};
