import { useState, useEffect } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';

export const useProducts = (db) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const productRef = collection(db, "products");
    const q = query(productRef, orderBy("product.productName", "desc"), orderBy("product.order", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let productsArray = snapshot.docs.map(item => item.data());
      setProducts(productsArray);
    });

    return unsubscribe;
  }, [db]);

  return products;
}