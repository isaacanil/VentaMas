import { collection, setDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseconfig';

export async function fbAddMultiCategories(user, categories) {
  if (!user || !user?.businessID) {
    console.log("No business ID found. Please contact support."); //TODO: replace with toast
    return;
  }
  const { businessID } = user;
  const categoriesRef = collection(db, "businesses", businessID, "categories");

  const promises = categories.map((category) => {
    const categoryRef = doc(categoriesRef, category.category.id);
    return setDoc(categoryRef, category);
  });

  try {
    await Promise.all(promises);
    promises.forEach((promise, index) => {
      console.log(`Producto ${index + 1} añadido con ID: ${categories[index].category.id}`);
    });
  } catch (error) {
    console.error(`Error al agregar los productos: ${error}`);
  }
}



