import { doc, getDoc, increment, updateDoc } from "firebase/firestore";
import { db } from "../firebaseconfig";
const getProduct = async (product) => {
    const { id } = product;
    const productRef = doc(db, "products", id); 
    try {
      const productSnapshot = await getDoc(productRef);
      
      if (productSnapshot.exists()) {
        const productData = productSnapshot.data();
        return console.log(productData);
      } else {
        console.log("Product does not exist");
        return null;
      }
    } catch (error) {
      console.error("Error getting product:", error);
      return null;
    }
  };

export const fbRemoveOutputRestoreQuantity = (item) => {
    const {product, totalRemovedQuantity} = item
    const restoredQuantity = product.stock + totalRemovedQuantity
    const productRef = doc(db, "products", product.id);
  //getProduct(product.id)
    console.log(product.stock, '========', totalRemovedQuantity, '========', restoredQuantity)
    try {
        updateDoc(productRef, {
            "product.stock": increment(totalRemovedQuantity),
        })
    } catch (error) {
        console.log("Lo sentimos Ocurrió un error: ", error)
    }
}
