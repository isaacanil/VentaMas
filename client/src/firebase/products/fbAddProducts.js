import { collection, writeBatch, doc, getDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseconfig";

// Función para subir productos y categorías a Firestore en lotes
export const fbAddProducts = async (user, products, maxProducts = 10000) => {
  const maxBatchSize = 500;
  const maxAllowedProducts = 10000;

  const limitedProducts = products.slice(0, Math.min(maxProducts, maxAllowedProducts));

  const productsCollection = collection(db, 'businesses', user.businessID, 'products');
  const categoriesCollection = collection(db, 'businesses', user.businessID, 'categories');

  try {
    const existingProductsSnapshot = await getDocs(productsCollection);
    const existingProductsByName = new Map();
    existingProductsSnapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      const nameLowerCase = data.name?.toLowerCase();
      if (nameLowerCase) {
        existingProductsByName.set(nameLowerCase, { docSnapshot, data });
      }
    });

    const existingCategoriesSnapshot = await getDocs(categoriesCollection);
    const existingCategoriesByName = new Map();
    existingCategoriesSnapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      const nameLowerCase = data.name?.toLowerCase();
      if (nameLowerCase) {
        existingCategoriesByName.set(nameLowerCase, { docSnapshot, data });
      }
    });

    const batchCommits = [];
    let batch = writeBatch(db);
    let operationCount = 0;

    for (const product of limitedProducts) {
      const productNameLowerCase = product.name?.toLowerCase();

      if (productNameLowerCase) {
        if (existingProductsByName.has(productNameLowerCase)) {
          const { docSnapshot, data: existingData } = existingProductsByName.get(productNameLowerCase);

          let docRef = docSnapshot.ref;
          const existingImage = existingData.image;

          // Eliminar producto existente en el batch, excepto el campo 'image'
          batch.delete(docRef);
          operationCount++;

          // Crear un nuevo documento y restaurar la imagen
          const updatedProduct = { ...product, image: existingImage };
          batch.set(docRef, updatedProduct);
          operationCount++;
          console.log(`Producto actualizado y se mantuvo 'image': ${product.name}`);

        } else {
          let docRef;
          if (product.id) {
            docRef = doc(productsCollection, product.id);
            const docSnapshot = await getDoc(docRef);

            if (!docSnapshot.exists()) {
              // Documento no existe, se procede
              batch.set(docRef, product);
              operationCount++;
            } else {
              console.log(`Actualizando producto existente con id: ${product.id}`);
            }
          } else {
            docRef = doc(productsCollection);
            product.id = docRef.id;
            batch.set(docRef, product);
            operationCount++;
          }
        }

        if (product.category) {
          const categoryNameLowerCase = product.category.toLowerCase();
          if (!existingCategoriesByName.has(categoryNameLowerCase)) {
            const categoryDocRef = doc(categoriesCollection);
            const category = {
              id: categoryDocRef.id,
              name: product.category,
              createdAt: serverTimestamp(),
            };
            batch.set(categoryDocRef, category);
            operationCount++;
            existingCategoriesByName.set(categoryNameLowerCase, { docSnapshot: categoryDocRef, data: category });
            console.log(`Categoría agregada: ${product.category}`);
          }
        }
      } else {
        console.log(`Producto omitido: no se proporcionó nombre.`);
      }

      if (operationCount >= maxBatchSize) {
        batchCommits.push(batch.commit());
        batch = writeBatch(db);
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      batchCommits.push(batch.commit());
    }

    await Promise.all(batchCommits);
    console.log('Todos los productos y categorías fueron subidos exitosamente.');
  } catch (error) {
    console.error('Error al subir los productos y categorías:', error);
  }
};