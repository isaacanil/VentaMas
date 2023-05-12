import { doc, setDoc } from "firebase/firestore";
import { nanoid } from "nanoid";
import { db } from "../../firebaseconfig";

export const fbAddProductImgData = async (user, url) => {
    if(!user || !user?.businessID) {return}
    let id = nanoid(10)
    const imgRef = doc(db, "businesses", user.businessID, "productsImages", id);
    try {
      await setDoc(imgRef, {
        id: id,
        url: url
  
      });
    } catch (error) {
      console.log(error)
    }
  }