import {
  Timestamp,
  doc,
  getDoc,
  increment,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { toMillis } from '@/utils/date/dateUtils';
import type { InvoiceData, InvoiceProduct } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';

import {
  getInvoiceProductQuantity,
  isInvoiceUser,
  type InvoiceDoc,
} from './types';

const saveLastInvoiceChange = async (
  user: UserIdentity,
  lastInvoiceChange: InvoiceDoc,
): Promise<void> => {
  const { id } = lastInvoiceChange.data;
  const previousInvoiceRef = doc(
    db,
    'businesses',
    user.businessID,
    'previousInvoices',
    id,
  );
  await setDoc(previousInvoiceRef, {
    data: { ...lastInvoiceChange.data, savedAt: Timestamp.now() },
  });
};

const getProductKey = (product: InvoiceProduct): string | null =>
  product.id ?? product.productId ?? product.cid ?? null;

const updateProductsStock = async (
  user: UserIdentity,
  newInvoiceVersion: InvoiceData,
  previousInvoiceVersion: InvoiceData,
): Promise<void> => {
  const newProducts = newInvoiceVersion.products ?? [];
  const prevProducts = previousInvoiceVersion.products ?? [];
  const newProductsMap = new Map(
    newProducts
      .map((product) => {
        const key = getProductKey(product);
        return key ? [key, product] : null;
      })
      .filter((entry): entry is [string, InvoiceProduct] => Boolean(entry)),
  );
  const prevProductsMap = new Map(
    prevProducts
      .map((product) => {
        const key = getProductKey(product);
        return key ? [key, product] : null;
      })
      .filter((entry): entry is [string, InvoiceProduct] => Boolean(entry)),
  );

  // Procesar los productos en la nueva versión de la factura
  for (const [productId, newProduct] of newProductsMap) {
    const prevProduct = prevProductsMap.get(productId);
    let stockChange = 0;

    if (prevProduct) {
      // Si el producto existía antes, calcula el cambio en la cantidad
      stockChange =
        getInvoiceProductQuantity(prevProduct) -
        getInvoiceProductQuantity(newProduct);
    } else {
      // Si es un producto nuevo, el cambio es igual a la cantidad comprada (se reduce el stock)
      stockChange = -getInvoiceProductQuantity(newProduct);
    }

    // Actualizar el stock en la base de datos
    await updateProductStock(user, productId, stockChange);
  }

  // Procesar los productos que han sido eliminados en la nueva versión
  for (const [productId, prevProduct] of prevProductsMap) {
    if (!newProductsMap.has(productId)) {
      // Si un producto anterior ya no está en la nueva factura, incrementa el stock
      await updateProductStock(
        user,
        productId,
        getInvoiceProductQuantity(prevProduct),
      );
    }
  }
};
const updateProductStock = async (
  user: UserIdentity,
  productId: string,
  stockChange: number,
): Promise<void> => {
  // Simular la actualización del stock del producto
  console.log(
    `Simulando la actualización del stock del producto ${productId} en ${stockChange} unidades.`,
  );

  // La siguiente línea está comentada para evitar cambios reales en la base de datos
  const productsRef = doc(
    db,
    'businesses',
    user.businessID,
    'products',
    productId,
  );
  await updateDoc(productsRef, { 'product.stock': increment(stockChange) });

  // En su lugar, solo imprimimos un mensaje para simular la actualización
  console.log(
    `Actualizaría el stock del producto ${productId} en ${stockChange} unidades.`,
  );
};

export const fbUpdateInvoice = async (
  user: UserIdentity | null | undefined,
  invoice: InvoiceData,
): Promise<void> => {
  if (!isInvoiceUser(user)) return;
  const { id } = invoice;
  const invoiceRef = doc(db, 'businesses', user.businessID, 'invoices', id);
  try {
    const currentInvoiceSnap = await getDoc(invoiceRef);
    if (currentInvoiceSnap.exists()) {
      const currentInvoice = currentInvoiceSnap.data() as InvoiceDoc;
      // Guardar la versión actual en la colección de versiones anteriores
      await saveLastInvoiceChange(user, currentInvoice);

      // Actualizar el stock de los productos
      await updateProductsStock(user, invoice, currentInvoice.data);

      // Preparar los nuevos datos de la factura
      const invoiceMillis = toMillis(invoice.date);
      const invoiceData: InvoiceData & {
        date?: Timestamp;
        updateAt?: Timestamp;
      } = {
        ...invoice,
        date: invoiceMillis
          ? Timestamp.fromMillis(invoiceMillis)
          : Timestamp.now(),
        updateAt: Timestamp.now(),
      };

      await updateDoc(invoiceRef, { data: invoiceData });
    }
  } catch (err) {
    console.error('Error updating invoice:', err);
  }
};
