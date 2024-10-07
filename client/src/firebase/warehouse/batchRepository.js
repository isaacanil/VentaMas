import { nanoid } from 'nanoid'; // Importación correcta de nanoid
import { db } from '../firebaseconfig';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  setDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

// Obtener referencia de la colección de batches para un negocio específico
const getBatchCollectionRef = (businessID) => 
  collection(db, 'businesses', businessID, 'batches');

// Crear un nuevo batch
const create = async (user, batchData) => {
  const id = nanoid(); // Generar ID único
  try {
    const batchCollectionRef = getBatchCollectionRef(user.businessID);
    const batchDocRef = doc(batchCollectionRef, id);

    await setDoc(batchDocRef, {
      ...batchData,
      id,
      isDeleted: false,
      audit: {
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      },
    });

    return { ...batchData, id };
  } catch (error) {
    console.error('Error al añadir el batch:', error);
    throw error;
  }
};

// Leer todos los batches de un negocio, opcionalmente filtrados por productId
const readAll = async (user, productID = null) => {
  try {
    const batchCollectionRef = getBatchCollectionRef(user.businessID);
    let q;

    if (productID) {
      // Si se proporciona productID, filtrar los batches por este campo
      q = query(
        batchCollectionRef,
        where('productId', '==', productID),
        where('audit.isDeleted', '==', null)
      );
    } else {
      // Sin filtro de productId, obtener todos los batches no eliminados
      q = query(batchCollectionRef, where('audit.isDeleted', '==', false));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error al obtener los batches:', error);
    throw error;
  }
};

// Escuchar en tiempo real todos los batches de un negocio específico, opcionalmente filtrados por productId
const listenAll = (user, productID = null, callback) => {
  try {
    const batchCollectionRef = getBatchCollectionRef(user.businessID);
    let q;
    console.log(
      '\nproductID ------- :', productID,
      '\nuser.businessID:', user.businessID
    )

    if (productID) {
      q = query(
        batchCollectionRef,
        where('productId', '==', productID),
 
      );
    } 

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const batches = querySnapshot.docs.map(doc => doc.data());
        callback(batches);
      },
      (error) => {
        console.error('Error al escuchar documentos en tiempo real:', error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Error al escuchar documentos en tiempo real:', error);
    throw error;
  }
};

// Function to listen to specific batches by their IDs
export const listenAllBatchesByIds = (user, batchIDs = [], callback) => {
  try {
    // Verificar que user y user.businessID estén definidos
    if (!user || !user.businessID) {
      console.error('User o user.businessID no están definidos');
      return () => {}; // Retorna una función de limpieza vacía
    }

    // Verificar que batchIDs es un array válido y no está vacío
    if (!Array.isArray(batchIDs) || batchIDs.length === 0) {
      console.warn('No se proporcionaron batch IDs para escuchar');
      return () => {};
    }

    const unsubscribeFuncs = [];

    // Iterar sobre cada batchID y crear un listener para cada uno
    batchIDs.forEach((batchID) => {
      if (!batchID) {
        console.warn('Skipping invalid batchID:', batchID);
        return;
      }

      const batchDocRef = doc(db, 'businesses', user.businessID, 'batches', batchID);

      const unsubscribe = onSnapshot(
        batchDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const updatedBatch = docSnapshot.data();
            console.log('Updated batch:', updatedBatch);

            // Actualizar el estado de los batches
            callback((prevBatches) => {
              // Si prevBatches es undefined, inicializarlo como un array vacío
              const previous = prevBatches || [];
              // Actualizar o agregar el batch
              const batchExists = previous.some(batch => batch.id === updatedBatch.id);
              if (batchExists) {
                return previous.map((batch) =>
                  batch.id === updatedBatch.id ? updatedBatch : batch
                );
              } else {
                return [...previous, updatedBatch];
              }
            });
          } else {
            console.warn(`Batch con ID ${batchID} no existe en la base de datos.`);
          }
        },
        (error) => {
          console.error('Error escuchando batch por ID:', error);
        }
      );

      unsubscribeFuncs.push(unsubscribe);
    });

    // Retornar una función de limpieza que cancela todos los listeners
    return () => {
      unsubscribeFuncs.forEach((unsubscribe) => unsubscribe());
    };
  } catch (error) {
    console.error('Error in listenAllBatchesByIds service:', error);
    throw error;
  }
};


// Actualizar un batch existente
const update = async (user, data) => {
  try {
    const batchDocRef = doc(db, 'businesses', user.businessID, 'batches', data.id);
    await updateDoc(batchDocRef, {
      ...data,
      audit: {
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      },
    });
    return data;
  } catch (error) {
    console.error('Error al actualizar el batch:', error);
    throw error;
  }
};

// Marcar un batch como eliminado
const remove = async (user, batchID) => {
  try {
    const batchDocRef = doc(db, 'businesses', user.businessID, 'batches', batchID);
    await updateDoc(batchDocRef, {
      isDeleted: true,
      audit: {
        deletedAt: serverTimestamp(),
        deletedBy: user.uid,
      },
    });
    return batchID;
  } catch (error) {
    console.error('Error al marcar el batch como eliminado:', error);
    throw error;
  }
};

export const batchRepository = {
  create,
  readAll,
  listenAll,
  listenAllBatchesByIds,
  update,
  remove,
};
