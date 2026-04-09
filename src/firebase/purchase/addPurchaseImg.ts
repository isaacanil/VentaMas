import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { nanoid } from 'nanoid';
import { addNotification } from '@/features/notification/notificationSlice';
import { addAttachmentToPurchase } from '@/features/purchase/addPurchaseSlice';
import {
  SaveImg,
  UploadImgLoading,
  UploadProgress,
} from '@/features/uploadImg/uploadImageSlice';
import { db, storage } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

export const fbAddPurchaseReceiptImg = (
  user: UserIdentity,
  dispatch: (action: unknown) => void,
  file?: File | null,
  orderId?: string,
) => {
  if (!user?.businessID) return;
  if (!file || !file.type || !file.type.startsWith('image/')) {
    dispatch(
      addNotification({
        title: 'Error',
        message: 'El archivo seleccionado no es una imagen',
        type: 'error',
      }),
    );
    return;
  }

  const storageRef = ref(
    storage,
    `/businesses/${user.businessID}/purchaseOrderReceipt/${nanoid(12)}.jpg`,
  );
  const uploadFile = uploadBytesResumable(storageRef, file);
  dispatch(UploadImgLoading(true));

  uploadFile.on(
    'state_changed',
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      dispatch(UploadProgress({ progress }));
    },
    (error) => {
      console.error('Upload error:', error);
      dispatch(UploadImgLoading(false));
    },
    async () => {
      const url = await getDownloadURL(storageRef);
      dispatch(UploadImgLoading(false));
      dispatch(
        addAttachmentToPurchase({
          url,
          location: 'remote',
          type: 'receipt',
        }),
      );
      dispatch(SaveImg({ url }));
      if (orderId) {
        fbAddReceiptImageToOrderDoc(user, orderId, url);
      }
      dispatch(UploadProgress({ progress: 100 }));
    },
  );
};

const fbAddReceiptImageToOrderDoc = (
  user: UserIdentity,
  orderId: string,
  url: string,
) => {
  if (!user?.businessID) return;

  const orderRef = doc(db, 'businesses', user.businessID, 'orders', orderId);
  try {
    updateDoc(orderRef, {
      'data.receipt': url,
    });
  } catch (error) {
    console.error('Error updating document: ', error);
  }
};
