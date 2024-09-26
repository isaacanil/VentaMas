import { collection, writeBatch, doc, getDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseconfig";

// Función para subir productos y categorías a Firestore en lotes
export const fbAddProducts = async (user, products, maxProducts = 10000) => {
  const maxBatchSize = 500; // Tamaño máximo del lote permitido por Firestore
  const maxAllowedProducts = 10000; // Límite máximo de productos por seguridad

  // Limitar el número total de productos a subir
  const limitedProducts = products.slice(0, Math.min(maxProducts, maxAllowedProducts));

  const productsCollection = collection(db, 'businesses', user.businessID, 'products');
  const categoriesCollection = collection(db, 'businesses', user.businessID, 'categories');

  try {
    // Obtener todos los productos existentes para verificar duplicados por nombre
    const existingProductsSnapshot = await getDocs(productsCollection);
    const existingProductsByName = new Map();
    existingProductsSnapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      const nameLowerCase = data.name?.toLowerCase();
      if (nameLowerCase) {
        existingProductsByName.set(nameLowerCase, { docSnapshot, data });
      }
    });

    // Obtener todas las categorías existentes para evitar duplicados
    const existingCategoriesSnapshot = await getDocs(categoriesCollection);
    const existingCategoriesByName = new Map();
    existingCategoriesSnapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      const nameLowerCase = data.name?.toLowerCase();
      if (nameLowerCase) {
        existingCategoriesByName.set(nameLowerCase, { docSnapshot, data });
      }
    });

    // Arreglo para almacenar las promesas de commit de cada batch
    const batchCommits = [];
    let batch = writeBatch(db);
    let operationCount = 0;

    for (const product of limitedProducts) {
      const productNameLowerCase = product.name?.toLowerCase();

      if (productNameLowerCase) {
        if (existingProductsByName.has(productNameLowerCase)) {
          // El producto ya existe en la base de datos (por nombre)
          const { docSnapshot, data: existingData } = existingProductsByName.get(productNameLowerCase);

          // Verificar si el producto existente tiene una propiedad 'id'
          if (!existingData.id) {
            // El producto existente no tiene la propiedad 'id'
            // Eliminar el documento existente en el batch
            batch.delete(docSnapshot.ref);
            operationCount++;
            console.log(`Eliminado producto existente sin 'id': ${product.name}`);

            // Crear un nuevo documento con los mismos datos pero agregando la propiedad 'id'
            let docRef;
            if (product.id) {
              docRef = doc(productsCollection, product.id);
            } else {
              docRef = doc(productsCollection); // Generar nuevo ID
              product.id = docRef.id;
            }
            batch.set(docRef, product);
            operationCount++;
            console.log(`Creado nuevo producto con 'id': ${product.name}`);
          } else {
            // El producto existente tiene la propiedad 'id'
            // Por ahora, lo omitimos
            console.log(`Producto ya existe con 'id': ${product.name}. Se omite.`);
          }
        } else {
          // El producto no existe en la base de datos
          // Proceder a agregarlo
          let docRef;
          if (product.id) {
            docRef = doc(productsCollection, product.id);
            const docSnapshot = await getDoc(docRef);

            if (!docSnapshot.exists()) {
              // El documento no existe, podemos proceder
              // Ya tenemos el 'id' asignado
            } else {
              // Documento con este ID ya existe
              // Decidir cómo manejar este caso. Por ahora, lo actualizamos.
              console.log(`Actualizando producto existente con id: ${product.id}`);
            }
          } else {
            // Generar un nuevo ID
            docRef = doc(productsCollection);
            product.id = docRef.id;
          }
          batch.set(docRef, product);
          operationCount++;
        }

        // Procesar la categoría del producto
        if (product.category) {
          const categoryNameLowerCase = product.category.toLowerCase();
          if (!existingCategoriesByName.has(categoryNameLowerCase)) {
            // La categoría no existe, agregarla
            const categoryDocRef = doc(categoriesCollection); // Generar nuevo ID para la categoría
            const category = {
              id: categoryDocRef.id,
              name: product.category,
              createdAt: serverTimestamp(),
              // Puedes agregar más campos si es necesario
            };
            batch.set(categoryDocRef, {category});
            operationCount++;
            existingCategoriesByName.set(categoryNameLowerCase, { docSnapshot: categoryDocRef, data: category });
            console.log(`Categoría agregada: ${product.category}`);
          }
          // Si la categoría ya existe, no hacemos nada
        }
      } else {
        console.log(`Producto omitido: no se proporcionó nombre.`);
      }

      // Verificar si el batch está lleno
      if (operationCount >= maxBatchSize) {
        batchCommits.push(batch.commit());
        batch = writeBatch(db);
        operationCount = 0;
      }
    }

    // Hacer commit de cualquier operación restante en el batch
    if (operationCount > 0) {
      batchCommits.push(batch.commit());
    }

    await Promise.all(batchCommits);
    console.log('Todos los productos y categorías fueron subidos exitosamente.');
  } catch (error) {
    console.error('Error al subir los productos y categorías:', error);
  }
};
