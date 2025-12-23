import { Timestamp, doc, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { fbUploadFiles } from '@/firebase/img/fbUploadFileAndGetURL';

import { fbUpdateProdStockForReplenish } from './fbUpdateProdStockForReplenish';

const updateOrder = async (user, order) => {
  const orderRef = doc(db, 'businesses', user.businessID, 'orders', order.id);
  const providerRef = doc(
    db,
    'businesses',
    user.businessID,
    'providers',
    order.provider.id,
  );
  await updateDoc(orderRef, {
    'data.state': 'state_3',
    'data.provider': providerRef,
  });
};
export const fbTransformOrderToPurchase = async (
  user,
  data,
  filesList,
  setLoading,
) => {
  if (!user || !user.businessID) {
    throw new Error('No user or businessID');
  }
  setLoading({
    isOpen: true,
    message: 'Iniciando proceso de registro de Compra',
  });
  const providerRef = doc(
    db,
    'businesses',
    user.businessID,
    'providers',
    data.provider.id,
  );
  const purchaseRef = doc(
    db,
    'businesses',
    user.businessID,
    'purchases',
    data.id,
  );

  let dataModified = {
    ...data,
    state: 'state_3',
    provider: providerRef,
    type: 'Associated',
    dates: {
      ...data.dates,
      createdAt: Timestamp.fromMillis(data?.dates?.createdAt),
      deliveryDate: Timestamp.fromMillis(data?.dates?.deliveryDate),
      paymentDate: Timestamp.fromMillis(data?.dates?.paymentDate),
      updatedAt: Timestamp.now(),
    },
  };

  if (filesList.length > 0) {
    setLoading({ isOpen: true, message: 'Subiendo recibo al servidor...' });
    dataModified.fileList = await fbUploadFiles(
      user,
      'purchaseReceipts',
      filesList,
    );
    data.fileList = [...(data?.fileList || []), ...dataModified.fileList];
  }

  setLoading({ isOpen: true, message: 'Actualizando stock de productos...' });
  await fbUpdateProdStockForReplenish(user, data.replenishments);

  setLoading({ isOpen: true, message: 'Actualizando estado de orden...' });
  await updateOrder(user, data);

  setLoading({
    isOpen: true,
    message: 'Registrando detalles de la compra en la base de datos...',
  });
  await setDoc(purchaseRef, { data: dataModified });
};
