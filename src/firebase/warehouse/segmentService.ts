import { nanoid } from '@reduxjs/toolkit';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  setDoc,
  query,
  where,
  type FirestoreError,
  type Unsubscribe,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../firebaseconfig';
import type { Segment } from '@/models/Warehouse/Segment';
import type { InventoryUser } from '@/utils/inventory/types';

type SegmentRecord = Partial<Segment> & Record<string, unknown>;
type SegmentListener = (segments: SegmentRecord[]) => void;
type SegmentUpdate = SegmentRecord & { id: string };

// Obtener referencia de la colección de segmentos de una fila de estantestante
const getSegmentCollectionRef = (businessId: string) => {
  return collection(db, 'businesses', businessId, 'segments');
};

// Crear un nuevo segmento
const createSegment = async ({
  user,
  segmentData,
}: {
  user: InventoryUser;
  segmentData: SegmentRecord;
}): Promise<SegmentRecord> => {
  const id = nanoid();
  try {
    // Segment data processed
    if (!segmentData.name || typeof segmentData.capacity !== 'number') {
      throw new Error('Datos inválidos para crear un segmento');
    }
    if (!user.businessID) throw new Error('No businessID provided');
    const segmentCollectionRef = getSegmentCollectionRef(user.businessID);
    const segmentDocRef = doc(segmentCollectionRef, id);

    await setDoc(segmentDocRef, {
      ...segmentData,
      id,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });

    return { ...segmentData, id };
  } catch (error) {
    console.error('Error al añadir el documento: ', error);
    throw error;
  }
};

// Obtener todos los segmentos de una fila de estante específica
const getAllSegments = async (
  user: InventoryUser,
  _warehouseId: string,
  _shelfId: string,
  _rowShelfId: string,
): Promise<SegmentRecord[]> => {
  try {
    if (!user.businessID) throw new Error('No businessID provided');
    const segmentCollectionRef = getSegmentCollectionRef(user.businessID);
    const querySnapshot = await getDocs(segmentCollectionRef);
    const segments = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as SegmentRecord),
    }));
    return segments;
  } catch (error) {
    console.error('Error al leer los documentos: ', error);
    throw error;
  }
};

// Escuchar en tiempo real todos los segmentos de una fila de estante específicaa
const listenAllSegments = (
  user: InventoryUser,
  _warehouseId: string,
  _shelfId: string,
  _rowShelfId: string,
  callback: SegmentListener,
  onError?: (error: FirestoreError) => void,
): Unsubscribe => {
  if (
    user.businessID === undefined ||
    _warehouseId === undefined ||
    _shelfId === undefined ||
    _rowShelfId === undefined
  ) {
    console.error(
      'Invalid parameter passed to listenAll',
      user.businessID,
      _warehouseId,
      _shelfId,
      _rowShelfId,
    );
    // eslint_disable-next-line @typescript-eslint/no-empty-function
    return () => {};
  }
  const segmentCollectionRef = getSegmentCollectionRef(
    user.businessID as string,
  );
  const q = query(
    segmentCollectionRef,
    where('warehouseId', '==', _warehouseId),
    where('shelfId', '==', _shelfId),
    where('rowShelfId', '==', _rowShelfId),
    where('isDeleted', '==', false),
  );
  return onSnapshot(
    q,
    (querySnapshot) => {
      const segments = querySnapshot.docs.map(
        (doc) => doc.data() as SegmentRecord,
      );
      callback(segments);
    },
    (error) => {
      console.error('Error al escuchar documentos en tiempo real: ', error);
      if (onError) onError(error);
    },
  );
};

// Actualizar un segmento específico
const updateSegment = async (
  user: InventoryUser,
  data: SegmentUpdate,
): Promise<SegmentUpdate> => {
  try {
    if (!user.businessID) throw new Error('No businessID provided');
    const segmentDocRef = doc(
      db,
      'businesses',
      user.businessID,
      'segments',
      data.id,
    );
    await updateDoc(segmentDocRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });
    return data;
  } catch (error) {
    console.error('Error al actualizar el documento: ', error);
    throw error;
  }
};

// Marcar un segmento como eliminado
const deleteSegment = async (
  user: InventoryUser,
  warehouseId: string,
  shelfId: string,
  rowShelfId: string,
  segmentId: string,
): Promise<string> => {
  try {
    if (!user.businessID) throw new Error('No businessID provided');
    const segmentDocRef = doc(
      db,
      'businesses',
      user.businessID,
      'segments',
      segmentId,
    );
    await updateDoc(segmentDocRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: user.uid,
    });
    return segmentId;
  } catch (error) {
    console.error('Error al marcar el documento como eliminado: ', error);
    throw error;
  }
};

const useListenAllSegments = (
  warehouseId: string | null,
  shelfId: string | null,
  rowShelfId: string | null,
) => {
  const [data, setData] = useState<SegmentRecord[]>([]);
  const [loading, setLoading] = useState(() =>
    Boolean(warehouseId && shelfId && rowShelfId),
  );
  const [error, setError] = useState<unknown | null>(null);
  const user = useSelector(selectUser) as InventoryUser | null;
  useEffect(() => {
    if (!user || !warehouseId || !shelfId || !rowShelfId) {
      return;
    }
    const unsubscribe = listenAllSegments(
      user,
      warehouseId,
      shelfId,
      rowShelfId,
      (data) => {
        setData(data);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [user, warehouseId, shelfId, rowShelfId]);
  return { data, loading, error, setError };
};

export {
  createSegment,
  getAllSegments,
  listenAllSegments,
  updateSegment,
  deleteSegment,
  useListenAllSegments,
};
