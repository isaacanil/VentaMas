import { collection, setDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseconfig';



export async function fbAddMultiProducts(user, productsData) {
  if (!user || !user?.businessID) {
    return;
  }
  const { businessID } = user;
  const productsCollectionRef = collection(db, "businesses", businessID, "products");

  const promises = productsData.map((productData) => {
    const productRef = doc(productsCollectionRef, productData.product.id);
    return setDoc(productRef, productData);
  });

  try {
    await Promise.all(promises);
    promises.forEach((promise, index) => {
    });
  } catch (error) {
  }
}



