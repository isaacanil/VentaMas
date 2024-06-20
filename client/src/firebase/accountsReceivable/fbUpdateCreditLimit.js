import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export async function fbUpdateCreditLimit({ user, client, creditLimitData }) {
    try {
        if (!user?.businessID) return;
        if (!creditLimitData) return;
        const creditLimitRef = doc(db, 'creditLimit', creditLimitData?.clientId)
        const creditLimit = {
            ...creditLimitData,
            clientId: client?.id,
            updatedBy: user?.uid,
        }
        await updateDoc(creditLimitRef, creditLimit)
        return creditLimit;
    } catch (error) {
        throw error;
    }
}