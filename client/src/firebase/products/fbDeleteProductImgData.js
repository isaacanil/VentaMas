import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbDeleteProductImgData = async (user, id) => {
    if(!user || !user?.businessID){return}
    const imgRef = doc(db, "businesses", user?.businessID, "productsImages", id);
    try {
        await deleteDoc(imgRef)
        console.log(id)
    } catch (error) {
        console.log(error)
    }
}