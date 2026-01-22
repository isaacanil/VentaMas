import { collection, getDocs, query, writeBatch } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import {
  convertDecimalToPercentage,
  getPriceWithoutTax,
} from '@/utils/pricing';
import type { InvoiceData, InvoiceProduct } from '@/types/invoice';

type LegacyInvoiceProduct = InvoiceProduct & {
  productName?: string;
  productImageURL?: string;
  barCode?: string;
  qrCode?: string;
  listPrice?: number;
  averagePrice?: number;
  minimumPrice?: number;
  cost?: { unit?: number };
  tax?: { value?: number };
  isVisible?: boolean;
  trackInventory?: boolean;
  netContent?: string;
  size?: string;
  type?: string;
  amountToBuy?: number | { total?: number };
};

type InvoiceDocData = {
  data?: InvoiceData & { products?: LegacyInvoiceProduct[] };
};

const toStringValue = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

// Función asincrónica para actualizar facturas para múltiples negocios
const businessIDs = [
  '2mJ94xMLICgM2KjPgXrD',
  'EDW44d69fhdvE5QmuL2I',
  'G5dFfupqbgUg8tYEqc9o',
  'JnKRSCFwKSkiSNSiIpOM',
  'Lm8GG6YXQJO3zgR9DkGe',
  'TRNykpxKa580PqGc0GtI',
  'tGrRrpnKl2D1ZezyBVQe',
  'vDR3rHX3GDLVnAnorAYz',
  'vvRKlKT9UOK4fX9FgJxN',
];

export const fbFixInvoicesForMultipleBusinesses = async (): Promise<void> => {
  try {
    for (const businessID of businessIDs) {
      console.log(`Procesando negocio ${businessID}...`);

      const invoicesRef = collection(db, 'businesses', businessID, 'invoices');
      const q = query(invoicesRef);

      const snapshot = await getDocs(q);
      console.log(
        `Encontradas ${snapshot.docs.length} facturas para el negocio ${businessID} en el año pasado.`,
      );

      // Dividir en lotes si hay más de 500 facturas
      let batch = writeBatch(db);
      let count = 0;
      let totalUpdated = 0;

      for (let i = 0; i < snapshot.docs.length; i++) {
        const docSnapshot = snapshot.docs[i];
        const invoice = docSnapshot.data() as InvoiceDocData;
        const data = invoice.data;

        if (data && data.products) {
          const productsTransformed = data.products.map((product) => {
            if (product?.productName) {
              const price = product?.price?.unit || 0;
              const taxPercentage =
                convertDecimalToPercentage(product?.tax?.value) || 0;
              const total = getPriceWithoutTax(price, taxPercentage);
              const taxValue =
                typeof product?.tax?.value === 'number' ? product.tax.value : 0;

              return {
                id: product.id,
                name: toStringValue(product.productName),
                category: product.category || '',
                image: product.productImageURL || '',
                pricing: {
                  cost: product?.cost?.unit || 0,
                  listPrice: product?.listPrice || total,
                  avgPrice: product?.averagePrice || total,
                  minPrice: product?.minimumPrice || total,
                  price: total || price,
                  tax: taxValue * 100,
                },
                promotions: {
                  isActive: false,
                  discount: 0,
                  start: null,
                  end: null,
                },
                stock: product.stock || 0,
                barcode: product.barCode || '',
                qrcode: product.qrCode || '',
                isVisible: product.isVisible ?? true,
                trackInventory: product.trackInventory ?? true,
                netContent: product.netContent || '',
                size: toStringValue(product.size),
                type: toStringValue(product.type),
                status: 'disponible',
                amountToBuy:
                  typeof product?.amountToBuy === 'object' &&
                  product?.amountToBuy !== null
                    ? product.amountToBuy.total
                    : product?.amountToBuy,
              };
            } else {
              return product; // Devuelve el producto sin cambios si no tiene nombre
            }
          });

          batch.update(docSnapshot.ref, {
            'data.products': productsTransformed,
          });
          count++;
          totalUpdated++;

          if (count === 500 || i === snapshot.docs.length - 1) {
            await batch.commit();
            console.log(
              `Lote comprometido con ${count} actualizaciones para el negocio ${businessID}.`,
            );
            batch = writeBatch(db); // Reiniciar el batch para el siguiente lote
            count = 0; // Reiniciar el contador para el nuevo lote
          }
        }
      }

      console.log(
        `Total de ${totalUpdated} facturas actualizadas para el negocio ${businessID}.`,
      );
    }
  } catch (error) {
    console.error('Error actualizando facturas para los negocios:', error);
  }
};

// export const fbFixInvoicesForMultipleBusinesses = async () => {
//     try {
//         // Calcula el rango de fechas para el año pasado
//         const startOfLastYear = DateTime.now().minus({ years: 1 }).startOf('year').toJSDate();
//         const endOfLastYear = DateTime.now().minus({ years: 1 }).endOf('year').toJSDate();

//         for (const businessID of businessIDs) {
//             const invoicesRef = collection(db, "businesses", businessID, "invoices");
//             const q = query(invoicesRef,
//                 where("data.date", ">=", startOfLastYear),
//                 where("data.date", "<=", endOfLastYear)
//             );

//             const snapshot = await getDocs(q);
//             const batch = writeBatch(db);

//             snapshot.docs.forEach((docSnapshot) => {
//                 const invoice = docSnapshot.data();
//                 const data = invoice.data;
//                 if (data && data.products) {
//                     const productsTransformed = data.products.map(product => {
//                         // Transforma cada producto aquí según sea necesario
//                         if (product?.productName) {
//                             const price = product?.price?.unit || 0;
//                             const taxPercentage = convertDecimalToPercentage(product?.tax?.value) || 0;
//                             const total = getPriceWithoutTax(price, taxPercentage);

//                             return {
//                                 id: product.id,
//                                 name: product.productName.trim(),
//                                 category: product.category,
//                                 image: product.productImageURL,
//                                 pricing: {
//                                     cost: product?.cost?.unit || 0,
//                                     listPrice: product?.listPrice || total,
//                                     avgPrice: product?.averagePrice || total,
//                                     minPrice: product?.minimumPrice || total,
//                                     price: total,
//                                     tax: product.tax.value * 100
//                                 },
//                                 promotions: {
//                                     isActive: false,
//                                     discount: 0,
//                                     start: null,
//                                     end: null
//                                 },
//                                 stock: product.stock,
//                                 barcode: product.barCode,
//                                 qrcode: product.qrCode,
//                                 isVisible: product.isVisible,
//                                 trackInventory: product.trackInventory,
//                                 netContent: product.netContent,
//                                 size: product.size.trim(),
//                                 type: product.type.trim(),
//                                 status: "disponible",
//                                 amountToBuy: product.amountToBuy.total,
//                             };
//                         } else {
//                             return product; // Devuelve el producto sin cambios si no tiene nombre
//                         }
//                     });

//                     // Actualiza el documento de factura con los productos transformados
//                     batch.update(docSnapshot.ref, { "data.products": productsTransformed });
//                 }
//             });

//             // Comprometer las actualizaciones del batch para el negocio actual
//             await batch.commit();
//             console.log(`Facturas del año pasado actualizadas con éxito para el negocio ${businessID}.`);
//         }
//     } catch (error) {
//         console.error("Error actualizando facturas para los negocios:", error);
//     }
// };
