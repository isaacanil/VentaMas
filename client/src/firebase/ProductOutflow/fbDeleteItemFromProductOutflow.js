import { doc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "../firebaseconfig";

export const fbDeleteItemFromProductOutflow = async (item, idDoc) => {

    const productOutflowRef = doc(db, "productOutflow", idDoc);
    try {
      await updateDoc(productOutflowRef, {
        productList: arrayRemove(item)
      });
      console.log("Producto eliminado de la lista");
    } catch (error) {
      console.log("Lo sentimos Ocurrió un error: ", error)
    }
  }
