import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseconfig";

export const fbGetProductsImg = async (user, SetAllImg) => {
  if (!user || !user?.businessID) { return }
  const imageRef = collection(db, "businesses", user.businessID, "productsImages");
 
  onSnapshot(imageRef, (querySnapshot) => {
    const img = [];
    querySnapshot.forEach((doc) => {
      img.push(doc.data());
    });
   
    SetAllImg(img)
  });
}