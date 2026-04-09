// Importamos Firestore
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import type {
  CollectionReference,
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

    // Verificamos si el producto tiene unidades de venta
    const saleUnitsCount = Number(productSnap.data()?.saleUnitsCount ?? 0);
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

    if (saleUnitsCount > 0) {
      // Si hay unidades de venta, buscamos la unidad específica
      const saleUnitSnap = await getDoc(saleUnitRef);

      if (saleUnitSnap.exists()) {
        // Si la unidad de venta existe, actualizamos la unidad de venta
        console.log('Actualizando la unidad de venta en la base de datos.');
        await updateDoc(saleUnitRef, newSaleUnit);
      } else {
        // Si la unidad de venta no existe, la creamos
        console.log('Creando la unidad de venta en la base de datos.');
        await setDoc(saleUnitRef, newSaleUnit);
        // Actualizamos el contador de unidades de venta en el producto
        await updateDoc(productRef, { saleUnitsCount: increment(1) });
      }
    } else {
      // Si no hay unidades de venta, creamos la primera unidad de venta
      console.log(
        'No existen unidades de venta. Creando la primera unidad de venta en la base de datos.',
      );
      await setDoc(saleUnitRef, newSaleUnit);
      // Actualizamos el contador de unidades de venta en el producto
      await updateDoc(productRef, { saleUnitsCount: increment(1) });
    }
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
    await updateDoc(productRef, { saleUnitsCount: increment(-1) });
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
    const saleUnitsRef = collection(
      db,
      'businesses',
      user.businessID,
      'products',
      productId,
      'saleUnits',
    ) as CollectionReference<SaleUnitRecord>;
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
export const useListenSaleUnits = (productId: string | null | undefined) => {
  const [data, setData] = useState<SaleUnitRecord[]>([]);
  const user = useSelector(selectUser) as UserWithBusiness | null | undefined;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  if ((!user || !productId) && (loading || error)) {
    if (loading) setLoading(false);
    if (!error)
      setError('Parámetros insuficientes para escuchar las unidades de venta.');
  }

  useEffect(() => {
    if (!user || !productId) {
      return undefined;
    }

    // Referencia a la subcolección saleUnits dentro del producto específico
    const saleUnitsRef = collection(
      db,
      'businesses',
      user.businessID,
      'products',
      productId,
      'saleUnits',
    ) as CollectionReference<SaleUnitRecord>;
    const unsubscribe = onSnapshot(
      saleUnitsRef,
      (snapshot) => {
        const saleUnitsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setData(saleUnitsData);
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error('Error escuchando las unidades de venta: ', err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user, productId]);

  return { data, loading, error };
};
