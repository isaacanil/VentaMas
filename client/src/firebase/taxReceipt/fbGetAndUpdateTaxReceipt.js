import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebaseconfig";
import { generateNCFCode } from "../../utils/taxReceipt";
import { fbGetDocs, fbUpdateDoc } from "../firebaseOperations";

export const fbGetAndUpdateTaxReceipt = async (user, taxReceiptName, transaction = null) => {
    const taxReceiptRef = collection(db, 'businesses', user.businessID, 'taxReceipts');
    const q = query(taxReceiptRef, where('data.name', '==', taxReceiptName));
    try {
        const querySnapshot = await fbGetDocs(q); 
        if (!querySnapshot.empty) {
            for (const doc of querySnapshot.docs) {
                console.log('Tax Receipt Data: ', doc.data());
                const docRef = doc.ref;
                const taxReceiptData = doc.data();
                const { ncfCode, updatedData } = generateNCFCode(taxReceiptData);
              
                // Update the tax receipt data
                // await updateDoc(docRef, { data: updatedData });
                await fbUpdateDoc(docRef, { data: updatedData }, transaction);

                return ncfCode;  // Returns the NCF code of the first document found
            }
        } else {
            console.log('Tax Receipt not found');
            return null;  // Return null or appropriate value if no documents found
        }
    } catch (error) {
        console.error('Error updating Tax Receipt: ', error);
        return null;  // Return null or appropriate error handling
    }
}
