import { getFirestore, collection, getDocs, doc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from "../firebaseconfig"; // Asegúrate de importar tu configuración de Firebase

export async function migrateProductsForSpecificBusiness(businessId) {
    // const productsCol = collection(db, "businesses", businessId, "products");


    // const unsubscribe = onSnapshot(productsCol, (snapshot) => {

    //     for (const productDoc of snapshot.docs) {
    //         const productWrapper = productDoc.data();
    //         const productData = productWrapper.product; // Accede a la propiedad 'product'

    //         console.log(productWrapper)

    //         const product = {
    //             ...productData,
    //             cost: { unit: productData.cost, total: productData.cost },
    //             amountToBuy: { unit: 1, total: 1 },
    //             shippingCost: { unit: 0, total: 0 }, // costo de envío
    //             baseCost: { unit: productData.cost, total: productData.cost }, //  costo base
    //             handlingCost: { unit: 0, total: 0 }, // costo de manejo
    //             price: { unit: productData.price, total: productData.price }, // Precio de venta
    //             listPrice: { unit: productData.price, total: productData.price }, // Precio de lista
    //             averagePrice: { unit: productData.price, total: productData.price }, // Ajusta según la lógica de negocio
    //             minimumPrice: { unit: productData.price, total: productData.price }, // Ajusta según la lógica de negocio
    //             tax: productData.tax === 0.18 ? { value: 0.18, ref: "18%", unit: 0, total: 0 } :
    //                 productData.tax === 0.16 ? { value: 0.16, ref: "16%", unit: 0, total: 0 } :
    //                     productData.tax === 0 ? { value: 0, ref: "Exento", unit: 0, total: 0 } : null
    //             // Tasa de impuesto
    //         }

    //         console.log(product);
    //         const productRef = doc(db, `businesses/${businessId}/products`, productDoc.id);

    //         // // Calcula la cantidad de impuestos si es necesario
    //         // const taxRate = productData.tax?.value ?? 0;
    //         // const taxAmount = productData.price * taxRate;

    //         // const updatedProductData = {
    //         //     product: { // Actualiza la propiedad 'product' del documento
    //         //         ...productData,
    //         //         // Asegúrate de que estos campos estén correctamente calculados o asignados
    //         //         cost: productData.cost,
    //         //         amountToBuy: 1,
    //         //         shippingCost: 0, // Añade el valor adecuado
    //         //         baseCost: productData.cost, // Asume que esto es el costo base
    //         //         handlingCost: 0, // Añade el valor adecuado
    //         //         totalCost: productData.cost, // Suma de todos los costos
    //         //         price: productData.price, // Precio de venta
    //         //         listPrice: productData.listPrice, // Precio de lista
    //         //         averagePrice: productData.averagePrice, // Ajusta según la lógica de negocio
    //         //         minimumPrice: productData.minimumPrice, // Ajusta según la lógica de negocio
    //         //         tax: {
    //         //             ...productData.tax,
    //         //             value: taxRate, // Tasa de impuesto
    //         //             amount: taxAmount // Cantidad de impuesto calculada
    //         //         }
    //         //     }
    //         // };

    //        // setDoc(productRef, { product });
    //     }
    // });

    // return () => {
    //     unsubscribe();
    // };

}

// Ejemplo de uso

// for (const productDoc of productsSnapshot.docs) {
//     const productWrapper = productDoc.data();
//     const productData = productWrapper.product; // Accede a la propiedad 'product'
//     const productRef = doc(db, `businesses/${businessId}/products`, productDoc.id);

//     // Calcula la cantidad de impuestos si es necesario
//     const taxRate = productData.tax?.value ?? 0;
//     const taxAmount = productData.price * taxRate;

//     const updatedProductData = {
//         product: { // Actualiza la propiedad 'product' del documento
//             ...productData,
//             // Asegúrate de que estos campos estén correctamente calculados o asignados
//             cost: productData.cost,
//             amountToBuy: 1,
//             shippingCost: 0, // Añade el valor adecuado
//             baseCost: productData.cost, // Asume que esto es el costo base
//             handlingCost: 0, // Añade el valor adecuado
//             totalCost: productData.cost, // Suma de todos los costos
//             price: productData.price, // Precio de venta
//             listPrice: productData.listPrice, // Precio de lista
//             averagePrice: productData.averagePrice, // Ajusta según la lógica de negocio
//             minimumPrice: productData.minimumPrice, // Ajusta según la lógica de negocio
//             tax: {
//                 ...productData.tax,
//                 value: taxRate, // Tasa de impuesto
//                 amount: taxAmount // Cantidad de impuesto calculada
//             }
//         }
//     };

//     await updateDoc(productRef, updatedProductData);
// }