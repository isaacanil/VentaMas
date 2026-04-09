import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { DateTime } from 'luxon';

// Asumiendo que estas funciones están implementadas correctamente
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
  promotions?: {
    isActive?: boolean;
    discount?: number;
    start?: unknown;
    end?: unknown;
  };
  isVisible?: boolean;
  trackInventory?: boolean;
  netContent?: string;
  size?: string;
  type?: string;
  amountToBuy?: number | { total?: number };
};

type InvoiceDocData = {
  data?: Omit<InvoiceData, 'products'> & { products?: LegacyInvoiceProduct[] };
};

export const fbFixInvoices = async (businessID: string): Promise<void> => {
  try {
    const _transformedProducts = [];
    const startOfThisMonth = DateTime.now().minus({ years: 1 }).startOf('year');
    const endOfThisMonth = DateTime.now(); // O utiliza endOfThisMonth = DateTime.now().endOf('month') para incluir todo el mes

    const invoicesRef = collection(db, 'businesses', businessID, 'invoices');
    const q = query(
      invoicesRef,
      where('data.date', '>=', startOfThisMonth.toJSDate()),
      where('data.date', '<=', endOfThisMonth.toJSDate()),
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    for (const docSnapshot of snapshot.docs) {
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
              category: product?.category || '',
              image: product?.productImageURL || '',
              pricing: {
                cost: product?.cost?.unit || 0,
                listPrice: product?.listPrice || total,
                avgPrice: product?.averagePrice || total,
                minPrice: product?.minimumPrice || total,
                price: total,
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
              size: toStringValue(product?.size),
              type: toStringValue(product?.type),
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

        // Actualiza el documento de factura con los productos transformados
        batch.update(docSnapshot.ref, { 'data.products': productsTransformed });
      }
    }

    // Comprometer las actualizaciones del batch
    await batch.commit();

    console.log('Facturas de este mes actualizadas con éxito.');
  } catch (error) {
    console.error('Error actualizando facturas de este mes:', error);
  }
};

export const isString = (value: unknown): value is string =>
  typeof value === 'string';

const toStringValue = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export const fbPreviewProcessedInvoice = async (
  businessID: string,
  invoiceID: string,
): Promise<InvoiceDocData | null> => {
  try {
    // Referencia al documento específico de la factura
    const invoiceRef = doc(db, 'businesses', businessID, 'invoices', invoiceID);

    // Recuperar el documento de la factura
    const docSnapshot = await getDoc(invoiceRef);

    if (docSnapshot.exists()) {
      const invoice = docSnapshot.data() as InvoiceDocData;
      const data = invoice.data;
      if (data && data.products) {
        const productsTransformed = data.products.map((product) => {
          // Tu lógica de transformación se mantiene igual aquí
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
              category: product?.category || '',
              image: product?.productImageURL || '',
              pricing: {
                cost: product?.cost?.unit || 0,
                listPrice: product?.listPrice || total,
                avgPrice: product?.averagePrice || total,
                minPrice: product?.minimumPrice || total,
                price: total,
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
              size: toStringValue(product?.size),
              type: toStringValue(product?.type),
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

        // Construye el objeto de la factura con los productos transformados para la visualización
        const processedInvoice = {
          ...invoice, // Copia las propiedades existentes de la factura
          data: {
            ...data, // Copia las propiedades existentes de data
            products: productsTransformed, // Sustituye con los productos transformados
          },
        };

        // Imprime la factura procesada en la consola
        console.log('Factura procesada:', processedInvoice);
        return processedInvoice; // Devuelve la factura procesada para revisión
      }
    } else {
      console.log('No se encontró la factura especificada.');
      return null; // Devuelve null si no existe la factura
    }
  } catch (error) {
    console.error('Error procesando la factura:', error);
    return null; // Devuelve null en caso de error
  }
};
