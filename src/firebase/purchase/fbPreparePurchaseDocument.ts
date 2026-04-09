import { Timestamp, doc, setDoc, updateDoc } from 'firebase/firestore';
import type { DocumentData, DocumentReference } from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import { fbUploadFiles } from '@/firebase/img/fbUploadFileAndGetURL';
import { toMillis } from '@/utils/date/toMillis';
import type { UserIdentity } from '@/types/users';
import type {
  Purchase,
  PurchaseDates,
  PurchaseReplenishment,
} from '@/utils/purchase/types';
import { fbUpdateProdStockForReplenish } from './fbUpdateProdStockForReplenish';

interface LoadingState {
  isOpen: boolean;
  message: string;
}

interface ProviderRefLike {
  id: string;
  [key: string]: unknown;
}

interface OrderToPurchaseInput extends Purchase {
  provider: ProviderRefLike;
  dates: PurchaseDates & {
    createdAt?: number;
    deliveryDate?: number;
    paymentDate?: number;
    updatedAt?: number;
  };
  replenishments: PurchaseReplenishment[];
}

interface OrderToPurchaseRecord extends Purchase {
  provider: DocumentReference<DocumentData>;
  dates: PurchaseDates & {
    createdAt?: Timestamp;
    deliveryDate?: Timestamp;
    paymentDate?: Timestamp;
    updatedAt?: Timestamp;
  };
  replenishments: PurchaseReplenishment[];
  fileList?: unknown[];
}

const updateOrder = async (user: UserIdentity, order: OrderToPurchaseInput) => {
  if (!user?.businessID) {
    throw new Error('No user or businessID provided');
  }
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
  user: UserIdentity,
  data: OrderToPurchaseInput,
  filesList: File[],
  setLoading: (state: LoadingState) => void,
) => {
  if (!user?.businessID) {
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

  const createdAtMillis = toMillis(data?.dates?.createdAt) ?? Date.now();
  const deliveryDateMillis = toMillis(data?.dates?.deliveryDate) ?? Date.now();
  const paymentDateMillis = toMillis(data?.dates?.paymentDate) ?? Date.now();

  const dataModified: OrderToPurchaseRecord = {
    ...data,
    state: 'state_3',
    provider: providerRef,
    type: 'Associated',
    dates: {
      ...data.dates,
      createdAt: Timestamp.fromMillis(createdAtMillis),
      deliveryDate: Timestamp.fromMillis(deliveryDateMillis),
      paymentDate: Timestamp.fromMillis(paymentDateMillis),
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
    const existingFileList = (data as { fileList?: unknown[] }).fileList ?? [];
    data.fileList = [...existingFileList, ...dataModified.fileList];
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
