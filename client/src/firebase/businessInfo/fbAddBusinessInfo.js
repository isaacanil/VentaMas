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
            console.log('No such document!');
            await setDoc(businessInfoRef, { business: { ...businessInfo } });
        } else {
            await updateDoc(businessInfoRef, { business: { ...businessInfo } });
        }
    } catch (error) {
        console.error("Error updating document:", error);
    }
};

export const fbUpdateBusinessLogo = async (user, newLogoFile) => {
    if (!user || !user.businessID) return;

    const storage = getStorage();
    const businessInfoRef = doc(db, "businesses", user.businessID);
    const sectionName = 'logo'; // podemos usar esto para diferentes secciones de imágenes

    try {
        // Get current business info
        const businessDoc = await getDoc(businessInfoRef);
        const currentData = businessDoc.data();

        // Delete old logo if exists
        if (currentData?.business?.logoUrl) {
            const oldLogoRef = ref(storage, currentData.business.logoUrl);
            try {
                await deleteObject(oldLogoRef);
            } catch (error) {
                console.log("No old logo found or error deleting:", error);
            }
        }

        // Usar directamente el nombre original del archivo
        const storageRef = ref(storage, `businesses/${user.businessID}/${sectionName}/${newLogoFile.name}`);
        await uploadBytes(storageRef, newLogoFile);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);

        // Update business document with new logo URL
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
