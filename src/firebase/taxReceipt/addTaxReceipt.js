import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseconfig"; // Asegúrate que la ruta sea correcta

/**
 * Creates a new tax receipt document in Firestore within a 'data' field.
 *
 * @async
 * @function addTaxReceipt
 * @param {object} user - The user object containing the businessID.
 * @param {object} data - The tax receipt data to add.
 * @throws {Error} Throws an error if the creation operation fails or inputs are invalid.
 * @returns {Promise<DocumentReference>} A promise that resolves with the DocumentReference of the newly created document.
 */
export const addTaxReceipt = async (user, data) => {
    // Input validation
    if (!user?.businessID || typeof user?.businessID !== 'string') {
        throw new Error("Invalid or missing businessID provided.");
    }
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        throw new Error("Invalid or empty data provided for creation.");
    }

    try {
        const receiptsCollectionRef = collection(db, "businesses", user.businessID, "taxReceipts");

        // Add the new document with the data nested under a 'data' field
        const docRef = await addDoc(receiptsCollectionRef, { data: data }); 
        
        console.info(`Tax receipt created successfully`);
        return docRef; // Return the reference to the new document

    } catch (error) {
        console.error("Error creating tax receipt:", error);
        throw new Error("Failed to create tax receipt.");
    }
};
