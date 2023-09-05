import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebaseconfig"

export const fbUpdateBusinessInfo = async (user, businessInfo) => {
    if (!user || !user.businessID) return;

    const businessInfoRef = doc(db, "businesses", user.businessID);
    try {
        const businessDoc = await getDoc(businessInfoRef);

        if (!businessDoc.exists()) {
            console.log('No such document!');
            await setDoc(businessInfoRef, { business: { ...businessInfo } });
        } else {
            await updateDoc(businessInfoRef, { business: { ...businessInfo } });
        }
    } catch (error) {
        console.error("Error updating document:", error);
    }
};
