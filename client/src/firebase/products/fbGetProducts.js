import { useSelector } from "react-redux"
import { selectUser } from "../../features/auth/userSlice"
import { db } from "../firebaseconfig"
import { collection, query, orderBy, where, onSnapshot } from "firebase/firestore"
import { useEffect, useState } from "react"
import { SelectCategoryList, SelectCategoryStatus } from "../../features/category/categorySlicer"

export function useGetProducts(trackInventory = false) {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
  
    const user = useSelector(selectUser);
    const { businessID } = user;
  console.log("businessID--------------", businessID)
    const categoriesArray = useSelector(SelectCategoryList);
    const categoriesStatus = useSelector(SelectCategoryStatus)
    
    useEffect(() => {
      if (!businessID) {
        console.log("No business ID found. Please contact support."); //TODO: replace with toast
        return;
      }
  
      //const productsRef = collection(db,`businesses/${user.businessID}/products`);
      const productsRef = collection(db, "businesses", String(user.businessID), "products");
  
      //filtros por defecto
      const constraints = [
        orderBy("product.productName", "desc"),
        orderBy("product.order", "asc"),
      ];
      /*--------------------------------------------------------------------------------------------- */
      if (trackInventory) {
        constraints.push(where("product.trackInventory", "==", true));
      }
      if(categoriesArray.length > 0 && categoriesStatus){
        constraints.push(where("product.category", "in", categoriesArray));
      }
      /*----------------------------------------------------------------------------------------------- */
      const q = query(productsRef, ...constraints);
  
      const unsubscribe = onSnapshot(productsRef, (snapshot) => {
        if (snapshot.empty) {
          setProducts([]);
          setLoading(false);
          return;
        }
        let productsArray = snapshot.docs.map((item) => item.data());
        setProducts(productsArray);
        setLoading(false);
      });
  
      return () => {
        unsubscribe();
      };
    }, [businessID, trackInventory]);
  
    return { products, loading, setLoading };
  }