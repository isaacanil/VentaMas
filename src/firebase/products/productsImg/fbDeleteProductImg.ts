import { deleteObject, getDownloadURL, ref } from 'firebase/storage';

import { storage } from '@/firebase/firebaseconfig';
import type { ProductImageRecord } from '@/types/products';
import type { UserWithBusiness } from '@/types/users';

import { fbDeleteProductImgData } from './fbDeleteProductImgData';

export const fbDeleteProductImg = (
  user: UserWithBusiness | null | undefined,
  img: ProductImageRecord,
) => {
  const imgRef = ref(storage, img.url);

  getDownloadURL(imgRef)
    .then(() => {
      // El archivo existe, procedemos a eliminarlo
      deleteObject(imgRef)
        .then(() => {
          console.log(`deleted ${img}`);
          fbDeleteProductImgData(user, img.id);
        })
        .catch((error: unknown) => {
          console.log(`Error deleting image: ${error}`);
        });
    })
    .catch((error: unknown) => {
      // El archivo no existe, procedemos a eliminar el documento
      console.log(`Image does not exist, deleting document: ${error}`);
      fbDeleteProductImgData(user, img.id);
    });
};
