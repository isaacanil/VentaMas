import { getDoc, doc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export const getLocationName = async (user, locationId) => {
  if (!locationId) return 'N/A';
  try {
    const [warehouseId, shelfId, rowId, segmentId] = locationId.split('/');
    let warehouseName = '';
    let shelfName = '';
    let rowName = '';
    let segmentName = '';

    if (warehouseId) {
      const warehouseDoc = await getDoc(
        doc(db, 'businesses', user.businessID, 'warehouses', warehouseId),
      );
      if (warehouseDoc.exists()) warehouseName = warehouseDoc.data().name;
    }

    if (shelfId) {
      const shelfDoc = await getDoc(
        doc(db, 'businesses', user.businessID, 'shelves', shelfId),
      );
      if (shelfDoc.exists()) shelfName = shelfDoc.data().name;
    }

    if (rowId) {
      const rowDoc = await getDoc(
        doc(db, 'businesses', user.businessID, 'rows', rowId),
      );
      if (rowDoc.exists()) rowName = rowDoc.data().name;
    }

    if (segmentId) {
      const segmentDoc = await getDoc(
        doc(db, 'businesses', user.businessID, 'segments', segmentId),
      );
      if (segmentDoc.exists()) segmentName = segmentDoc.data().name;
    }

    // Combinar todos los segmentos de nombre en un solo string
    const labelParts = [warehouseName, shelfName, rowName, segmentName].filter(
      Boolean,
    );
    return labelParts.length
      ? labelParts.join(' / ')
      : 'Ubicación no encontrada';
  } catch (error) {
    console.error('Error getting location name:', error);
    return 'Error al obtener ubicación';
  }
};
