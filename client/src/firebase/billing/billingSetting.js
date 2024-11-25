import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig';

export const setBillingSettings = async (user, setting) => {
    if (!user?.businessID) {
        return;
    }
    try {
        const userDocRef = doc(db, 'businesses', user.businessID, "settings", "billing");

        const docSnapshot = await getDoc(userDocRef);

        if (docSnapshot.exists()) {
            await updateDoc(userDocRef, setting);
        } else {
            await setDoc(userDocRef, setting);
        }

    } catch (error) {
        console.error('Error al actualizar la configuración de facturación:', error);
    }
};


export const fbBillingSettings = {
    setBillingSettings
}