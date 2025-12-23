import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable } from 'firebase/storage';
import { getDownloadURL } from 'firebase/storage';
import { nanoid } from 'nanoid';

import { addNotification } from '@/features/notification/notificationSlice';
import { addReceiptImageToPurchase } from '@/features/purchase/addPurchaseSlice';
import { SaveImg } from '@/features/uploadImg/uploadImageSlice';
import {
  UploadImgLoading,
  UploadProgress,
} from '@/features/uploadImg/uploadImageSlice';
import { db, storage } from '@/firebase/firebaseconfig';

export const fbAddPurchaseReceiptImg = (user, dispatch, file, orderId) => {
  if (!user || !user?.businessID) return;

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
  // dispatch(UploadProgress({ progress: 0 }))
  uploadFile.on(
    'state_changed',
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      // Upload in progress
      dispatch(UploadProgress({ progress }));
    },
    (error) => {
      console.error('Upload error:', error);
      dispatch(UploadImgLoading(false));
    },
    async () => {
      getDownloadURL(storageRef).then((url) => {
        dispatch(UploadImgLoading(false));
        dispatch(addReceiptImageToPurchase(url));
        dispatch(SaveImg({ url }));
        fbAddReceiptImageToOrderDoc(user, orderId, url);
        dispatch(UploadProgress({ progress: 100 }));
      });
    },
  );
};

const fbAddReceiptImageToOrderDoc = (user, orderId, url) => {
  if (!user || !user?.businessID) return;

  const orderRef = doc(db, 'businesses', user.businessID, 'orders', orderId);
  try {
    updateDoc(orderRef, {
      'data.receipt': url,
    });
  } catch (error) {
    console.error('Error updating document: ', error);
  }
};
