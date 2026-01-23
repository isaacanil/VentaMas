import { doc, getDoc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { getTax } from '@/utils/pricing';
import type { ProductRecord } from '@/types/products';

export async function fbUpdateProductToNewFormat(
  businessID: string,
  productID: string,
): Promise<void> {
  try {
    // Starting product update

    // Referencia al documento del producto
    const productRef = doc(db, 'businesses', businessID, 'products', productID);

    // Obtener el documento del producto
    const docSnapshot = await getDoc(productRef);
    if (!docSnapshot.exists()) {
      console.warn('Product not found. Aborting update.');
      return;
    }

    const product = (docSnapshot.data() as { product?: ProductRecord }).product;

    if (product) {
      updateDoc(productRef, product);
    }
  } catch (error) {
    console.error('Error actualizando el producto:', error);
  }
}

function _transformProductToNewSchema(
  product: ProductRecord & {
    tax?: { unit?: number };
    price?: { unit?: number };
    cost?: { unit?: number };
    listPrice?: number;
    minimumPrice?: number;
    averagePrice?: number;
  },
): ProductRecord {
  // Suponiendo que la estructura de "product" ya contiene los campos necesarios
  // y solo necesitamos ajustarlos o calcular nuevos valores como el precio sin impuestos.
  const taxPercentage = convertDecimalToPercentage(product.tax?.unit ?? 0);
  const tax = getTax(product.price?.unit ?? 0, taxPercentage);
  const price = (product.price?.unit ?? 0) - tax;

  return {
    ...product,
    pricing: {
      cost: product.cost?.unit ?? 0,
      price: price,
      listPrice: product.listPrice ?? price,
      minPrice: product.minimumPrice ?? price,
      avgPrice: product.averagePrice ?? price,
      tax: taxPercentage,
    },
    promotions: {
      isActive: false,
      discount: 0,
      start: null,
      end: null,
    },
    // Asegúrate de incluir todos los campos necesarios en la nueva estructura aquí
  };
}

function convertDecimalToPercentage(valorDecimal: number): number {
  return typeof valorDecimal === 'number' &&
    valorDecimal >= 0 &&
    valorDecimal <= 1
    ? valorDecimal * 100
    : 0;
}
