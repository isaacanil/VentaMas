import { doc, setDoc, updateDoc, getDoc, Timestamp } from "firebase/firestore";
import { db } from '../firebaseconfig';
import { nanoid } from "nanoid";

export async function fbUpsertCreditLimit({ user, client, creditLimitData }) {
    console.log('fbUpsertCreditLimit', user, client, creditLimitData)
    try {
        if (!user?.businessID) return;
        if (!creditLimitData) return;
        if (!client?.id) return;

        let creditLimit = {
            ...creditLimitData,
            updatedBy: user?.uid,
            updatedAt: Timestamp.now()
        };

        const creditLimitRef = doc(db, 'businesses', user.businessID, 'creditLimit', client?.id);

        const docSnapshot = await getDoc(creditLimitRef);

        if (docSnapshot.exists()) {
            await updateDoc(creditLimitRef, {
                ...creditLimit,
                id: docSnapshot.data().id,
                clientId: docSnapshot.data().clientId,
                createdAt: docSnapshot.data().createdAt,
                createdBy: docSnapshot.data().createdBy
            });
        } else {
            creditLimit = {
                ...creditLimit,
                id: client?.id,  // Usamos el id del cliente como id del documento
                clientId: client?.id,
                createdAt: Timestamp.now(),
                createdBy: user?.uid
            };
            await setDoc(creditLimitRef, creditLimit);
        }

        return creditLimit;
    } catch (error) {
        throw error;
    }
}
