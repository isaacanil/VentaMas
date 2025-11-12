import { doc, getDoc, setDoc } from "firebase/firestore"

import { db } from "../firebaseconfig";

export const fbUpdateProductStructure = async (user, id) => {
    const docRef = doc(db, "businesses", user?.businessID, `products`, id)
    try {

        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data().product
            if (data){
                const newProduct = {
                    ...data
                }

                await setDoc(docRef, newProduct)
            }else{
                console.warn("No product data found");
            }
        } else {
            console.warn("Product document not found");
        }
    }
    catch (e) {
        console.error("Error updating document: ", e);
    }


}