// Importamos Firestore
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import type {
  CollectionReference,
  DocumentReference,
  FirestoreError,
  Unsubscribe,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { ProductSaleUnit } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';

type SaleUnitInput = Partial<ProductSaleUnit> &
  Record<string, unknown> & { id?: string };

type SaleUnitRecord = ProductSaleUnit & Record<string, unknown>;

const getSaleUnitsCollectionRef = (
  businessID: string,
  productId: string,
): CollectionReference<SaleUnitRecord> =>
  collection(
    db,
    'businesses',
    businessID,
    'products',
    productId,
    'saleUnits',
  ) as CollectionReference<SaleUnitRecord>;

const readSaleUnitsFromSubcollection = async (
  businessID: string,
  productId: string,
): Promise<SaleUnitRecord[]> => {
  const saleUnitsRef = getSaleUnitsCollectionRef(businessID, productId);
  const snapshot = await getDocs(saleUnitsRef);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

const syncProductSaleUnitsCache = async (
  productRef: DocumentReference,
  businessID: string,
  productId: string,
) => {
  const saleUnits = await readSaleUnitsFromSubcollection(
    businessID,
    productId,
  );
  await updateDoc(productRef, {
    saleUnits,
    saleUnitsCount: saleUnits.length,
  });
};

// Función para actualizar o crear una unidad de venta en la subcolección saleUnits
export const fbUpsetSaleUnits = async (
  user: UserWithBusiness | null | undefined,
  productId: string,
  newSaleUnit: SaleUnitInput,
) => {
  try {
    if (!user || !productId || !newSaleUnit) {
      console.error(
        'Parámetros insuficientes para actualizar o crear la unidad de venta.',
      );
      return;
    }

    // Referencia al producto
    const productRef = doc(
      db,
      'businesses',
      user.businessID,
      'products',
      productId,
    );
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      console.error('El producto no existe en la base de datos.');
      return;
    }

    const saleUnitId = newSaleUnit.id ?? nanoid();
    newSaleUnit.id = saleUnitId;

    // Referencia a la subcolección saleUnits dentro del producto específico
    const saleUnitRef = doc(
      db,
      'businesses',
      user.businessID,
      'products',
      productId,
      'saleUnits',
      saleUnitId,
    );
    const saleUnitSnap = await getDoc(saleUnitRef);

    if (saleUnitSnap.exists()) {
      // Si la unidad de venta existe, actualizamos la unidad de venta
      console.log('Actualizando la unidad de venta en la base de datos.');
      await updateDoc(saleUnitRef, newSaleUnit);
    } else {
      // Si la unidad de venta no existe, la creamos
      console.log('Creando la unidad de venta en la base de datos.');
      await setDoc(saleUnitRef, newSaleUnit);
    }

    await syncProductSaleUnitsCache(productRef, user.businessID, productId);
    console.log(
      'Unidad de venta actualizada o creada con éxito en la base de datos.',
    );
  } catch (error) {
    console.error('Error actualizando o creando la unidad de venta: ', error);
  }
};

// Función para eliminar una unidad de venta en la subcolección saleUnits
export const fbDeleteSaleUnit = async (
  user: UserWithBusiness | null | undefined,
  productId: string,
  saleUnitId: string,
) => {
  try {
    if (!user || !productId || !saleUnitId) {
      console.error(
        'Parámetros insuficientes para eliminar la unidad de venta.',
      );
      return;
    }

    // Referencia a la subcolección saleUnits dentro del producto específico
    const saleUnitRef = doc(
      db,
      'businesses',
      user.businessID,
      'products',
      productId,
      'saleUnits',
      saleUnitId,
    );
    await deleteDoc(saleUnitRef);

    // Actualizamos el contador de unidades de venta en el producto
    const productRef = doc(
      db,
      'businesses',
      user.businessID,
      'products',
      productId,
    );
    await syncProductSaleUnitsCache(productRef, user.businessID, productId);
    console.log('Unidad de venta eliminada con éxito de la base de datos.');
  } catch (error) {
    console.error('Error eliminando la unidad de venta: ', error);
  }
};

// Función para escuchar cambios en las unidades de venta en tiempo real
export const fbListenSaleUnits = (
  user: UserWithBusiness | null | undefined,
  productId: string,
  callback: (saleUnits: SaleUnitRecord[]) => void,
): Unsubscribe | undefined => {
  try {
    if (!user || !productId) {
      console.error(
        'Parámetros insuficientes para escuchar las unidades de venta.',
      );
      return;
    }

    // Referencia a la subcolección saleUnits dentro del producto específico
    const saleUnitsRef = getSaleUnitsCollectionRef(user.businessID, productId);
    return onSnapshot(saleUnitsRef, (snapshot) => {
      const saleUnits = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(saleUnits);
    });
  } catch (error) {
    console.error('Error escuchando las unidades de venta: ', error);
  }
};

// Hook para escuchar cambios en las unidades de venta en tiempo real
type SaleUnitsSnapshotState = {
  scopeKey: string | null;
  data: SaleUnitRecord[];
  error: unknown | null;
};

export const useListenSaleUnits = (productId: string | null | undefined) => {
  const [snapshotState, setSnapshotState] = useState<SaleUnitsSnapshotState>({
    scopeKey: null,
    data: [],
    error: null,
  });
  const user = useSelector(selectUser) as UserWithBusiness | null | undefined;
  const businessID = user?.businessID ?? null;
  const scopeKey = businessID && productId ? `${businessID}:${productId}` : null;

  useEffect(() => {
    if (!businessID || !productId || !scopeKey) {
      return undefined;
    }

    // Referencia a la subcolección saleUnits dentro del producto específico
    const saleUnitsRef = getSaleUnitsCollectionRef(businessID, productId);
    const unsubscribe = onSnapshot(
      saleUnitsRef,
      (snapshot) => {
        const saleUnitsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSnapshotState({
          scopeKey,
          data: saleUnitsData,
          error: null,
        });
      },
      (err: FirestoreError) => {
        console.error('Error escuchando las unidades de venta: ', err);
        setSnapshotState({
          scopeKey,
          data: [],
          error: err,
        });
      },
    );

    return () => unsubscribe();
  }, [businessID, productId, scopeKey]);

  const isCurrentSnapshot = snapshotState.scopeKey === scopeKey;
  const data = scopeKey && isCurrentSnapshot ? snapshotState.data : [];
  const loading = Boolean(scopeKey) && !isCurrentSnapshot;
  const error = !scopeKey
    ? 'Parámetros insuficientes para escuchar las unidades de venta.'
    : isCurrentSnapshot
      ? snapshotState.error
      : null;

  return { data, loading, error };
};
