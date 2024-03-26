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
                console.log("No product data")
            }
        } else {
            console.log("No such document!");
        }
    }
    catch (e) {
        console.error("Error updating document: ", e);
    }


}