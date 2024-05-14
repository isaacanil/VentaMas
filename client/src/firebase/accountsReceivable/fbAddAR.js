import { Timestamp, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { nanoid } from "nanoid";
import { db } from "../firebaseconfig";

export async function fbAddAR({ user, accountsReceivable }) {
    try {
        if (!user?.businessID) return;
        if (!accountsReceivable) return;
        const arId = nanoid();
        const arRef = doc(db, 'businesses', user.businessID, 'accountsReceivable', arId)

        const ar = {
            ...accountsReceivable,
            arBalance: accountsReceivable?.totalReceivable,
            arId,
            createdBy: user?.uid,
            updatedBy: user?.uid,
        }
        const arData = {
            ...ar,
            createdAt: Timestamp.fromMillis(ar?.createdAt),
            updatedAt: Timestamp.fromMillis(ar?.updatedAt),
            paymentDate: Timestamp.fromMillis(ar?.paymentDate),
        }
        await setDoc(arRef, arData)
        return ar;
    } catch (error) {
        throw error;
    }
}