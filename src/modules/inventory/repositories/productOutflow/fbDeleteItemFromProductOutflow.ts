import { doc, updateDoc, arrayRemove } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { ProductRecord } from '@/types/products';

type ProductOutflowItem = {
  id?: string;
  product: ProductRecord;
  quantityRemoved: number;
  [key: string]: unknown;
};

export const fbDeleteItemFromProductOutflow = async (
  item: ProductOutflowItem,
  idDoc: string,
): Promise<void> => {
  const productOutflowRef = doc(db, 'productOutflow', idDoc);
  try {
    await updateDoc(productOutflowRef, {
      productList: arrayRemove(item),
    });
    console.log('Producto eliminado de la lista');
  } catch (error) {
    console.log('Lo sentimos Ocurrió un error: ', error);
  }
};
