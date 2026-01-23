import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import type { ProductRecord } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';

import { fbUpdateStock } from './fbUpdateStock';

type UserWithBusinessAndUid = UserWithBusiness & { uid: string };

type ProductOutflowItem = {
  id?: string;
  product: ProductRecord;
  quantityRemoved: number;
};

type ProductOutflow = {
  id?: string;
  productList: ProductOutflowItem[];
  [key: string]: unknown;
};

type StockUpdate = {
  product: ProductRecord;
  quantityRemoved: number;
};

export const fbAddProductOutFlow = async (user, productOutflow) => {
  if (!user?.businessID || !user?.uid) {
    console.error(
      'Información requerida para la operación faltante o inválida',
    );
    return;
  }

  // Processing product outflow

  const updates = productOutflow.productList.map((product) => ({
    product: product.product,
    quantityRemoved: -product.quantityRemoved, // Asume que quieres decrementar el stock
  }));

  const productOutflowData = {
    ...productOutflow,
    id: nanoid(10),
    createdAt: serverTimestamp(),
    createdBy: user.uid,
    isDeleted: false,
  };
  // Product outflow data processed
  const productOutFlowRef = doc(
    db,
    'businesses',
    user.businessID,
    'productOutflow',
    productOutflowData.id,
  );

  try {
    await setDoc(productOutFlowRef, productOutflowData);

    await fbUpdateStock(user, updates);
  } catch (error) {
    console.error('Error en fbAddProductOutFlow:', error);
  }
};
