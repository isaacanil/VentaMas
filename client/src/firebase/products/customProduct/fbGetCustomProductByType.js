import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "../../firebaseconfig";

export const fbGetProductsQueryByType = async (setProducts, type, size, user) => {
    if(!user && user.businessID){return}
    const productsRef = collection(db, "businesses", user.businessID, "products")
    const q = query(productsRef, where("product.type", "==", type), where("product.size", "==", size), orderBy("product.productName", "asc"));
    const { docs } = await getDocs(q);
    const array = docs.map((item) => item.data());
    console.log(array)
    setProducts(array)
}