import { collection, doc } from 'firebase/firestore';
import { db } from './firebaseconfig';



const getFirestoreRef = (...pathSegments) => {
  if (!db || pathSegments.length === 0) {
    throw new Error("Debe proporcionar la base de datos y al menos un segmento de ruta.");
  }

  let ref = db; // Comienza con la referencia a la base de datos
  let isCollection = true; // Empezamos con una colección

  for (const segment of pathSegments) {
    if (typeof segment !== "string") {
      throw new Error("Cada segmento de ruta debe ser una cadena.");
    }

    if (isCollection) {
      ref = collection(ref, segment);
    } else {
      ref = doc(ref, segment);
    }

    isCollection = !isCollection; // Alterna entre colección y documento
  }

  return ref;
};

// Funciones relacionadas con clientes
const clientsData = (businessID) => getFirestoreRef('businesses', businessID, 'clients');
const providersData = (businessID) => getFirestoreRef('businesses', businessID, 'providers');

// Funciones relacionadas con productos
const productCategoriesData = (businessID) => getFirestoreRef('businesses', businessID, 'categories');
const productsData = (businessID) => getFirestoreRef('businesses', businessID, 'products');
const productImagesData = (businessID) => getFirestoreRef('businesses', businessID, 'productImages');
const productOutflowData = (businessID) => getFirestoreRef('businesses', businessID, 'productOutflow');

// Funciones relacionadas con compras y pedidos
const purchasesData = (businessID) => getFirestoreRef('businesses', businessID, 'purchases');
const ordersData = (businessID) => getFirestoreRef('businesses', businessID, 'orders');

// Funciones relacionadas con contadores
const countersData = (businessID) => getFirestoreRef('businesses', businessID, 'counters');

// Funciones relacionadas con configuraciones
const settingsData = (businessID) => getFirestoreRef('businesses', businessID, 'settings');

// Funciones relacionadas con efectivo
const cashCountsData = (businessID) => getFirestoreRef('businesses', businessID, 'cashCounts');

// Funciones relacionadas con cuentas por cobrar
const accountsReceivableData = (businessID, id = null) =>  getFirestoreRef('businesses', businessID, 'accountsReceivable');
const accountsReceivablePaymentsData = (businessID) => getFirestoreRef('businesses', businessID, 'accountsReceivablePayments');
const accountsReceivableInstallmentsData = (businessID, accountReceivableID) => getFirestoreRef('businesses', businessID, 'accountsReceivable', accountReceivableID, 'installments');

export {
    getFirestoreRef,
  clientsData,
  providersData,
  productCategoriesData,
  productsData,
  productImagesData,
  productOutflowData,
  purchasesData,
  ordersData,
  countersData,
  settingsData,
  cashCountsData,
  accountsReceivableData,
  accountsReceivablePaymentsData,
  accountsReceivableInstallmentsData
};
