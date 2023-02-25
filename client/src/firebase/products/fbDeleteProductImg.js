import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbDeleteProductImg = async (id) => {
    console.log(id)
    const imgRef = doc(db, "prodImages", id);
    try {
        await deleteDoc(imgRef)
        console.log(id)
    } catch (error) {
        console.log(error)
    }
}