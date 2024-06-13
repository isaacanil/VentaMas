import { doc, getDoc } from "firebase/firestore";
import { db } from '../firebaseconfig';

export async function fbGetCreditLimit({ user, clientId }) {
    try {
        if (!user?.businessID) return null;
        if (!clientId) return null;

        const creditLimitRef = doc(db, 'businesses', user.businessID, 'creditLimit', clientId);
        const docSnapshot = await getDoc(creditLimitRef);

        if (docSnapshot.exists()) {
            return docSnapshot.data();
        } else {
            console.log('No such document!');
            return null;
        }
    } catch (error) {
        throw error;
    }
}
