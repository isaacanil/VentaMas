import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "../firebaseconfig"
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { nanoid } from 'nanoid';

export const fbUpdateBusinessInfo = async (user, businessInfo) => {
    if (!user || !user.businessID) return;

    const businessInfoRef = doc(db, "businesses", user.businessID);
    try {
        const businessDoc = await getDoc(businessInfoRef);

        if (!businessDoc.exists()) {
            await setDoc(businessInfoRef, { business: { ...businessInfo } });
        } else {
            await updateDoc(businessInfoRef, { business: { ...businessInfo } });
        }
    } catch (error) {
    }
};

export const fbUpdateBusinessLogo = async (user, newLogoFile) => {
    if (!user || !user.businessID) return;

    const storage = getStorage();
    const businessInfoRef = doc(db, "businesses", user.businessID);
    const sectionName = 'logo'; // podemos usar esto para diferentes secciones de imágenes

    try {
        const businessDoc = await getDoc(businessInfoRef);
        const currentData = businessDoc.data();

        if (currentData?.business?.logoUrl) {
            const oldLogoRef = ref(storage, currentData.business.logoUrl);
            try {
                await deleteObject(oldLogoRef);
            } catch (error) {
            }
        }

        const storageRef = ref(storage, `businesses/${user.businessID}/${sectionName}/${newLogoFile.name}`);
        await uploadBytes(storageRef, newLogoFile);

        const downloadURL = await getDownloadURL(storageRef);

        await updateDoc(businessInfoRef, {
            'business.logoUrl': downloadURL
        });

        return downloadURL;
    } catch (error) {
        console.error("Error updating business logo:", error);
        throw error;
    }
};

export const fbUpdateInvoiceType = async (user, invoiceType) => {
    if (!user || !user.businessID) return;

    const businessInfoRef = doc(db, "businesses", user.businessID);
    try {
        await updateDoc(businessInfoRef, {
            'business.invoice.invoiceType': invoiceType
        });
        return true;
    } catch (error) {
        console.error("Error updating invoice type:", error);
        throw error;
    }
};
