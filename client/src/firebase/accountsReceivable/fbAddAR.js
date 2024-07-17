import { Timestamp, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { nanoid } from "nanoid";
import { db } from "../firebaseconfig";
import { getNextID } from "../Tools/getNextID";

export async function fbAddAR({ user, accountsReceivable }) {
    try {
        if (!user?.businessID) return;
        if (!accountsReceivable) return;
        const id = nanoid();
        const arRef = doc(db, 'businesses', user.businessID, 'accountsReceivable', id)

        const ar = {
            ...accountsReceivable,
            arBalance: accountsReceivable?.totalReceivable,
            numberId: await getNextID(user, "lastAccountReceivableId"),
            id,
            createdBy: user?.uid,
            updatedBy: user?.uid,
        }
        const arData = {
            ...ar,
            createdAt: Timestamp.fromMillis(ar?.createdAt),
            updatedAt: Timestamp.fromMillis(ar?.updatedAt),
            paymentDate: Timestamp.fromMillis(ar?.paymentDate),
            lastPaymentDate: null
        }
        await setDoc(arRef, arData)
        return ar;
    } catch (error) {
        throw error;
    }
}