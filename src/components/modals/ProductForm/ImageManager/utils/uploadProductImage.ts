import { fbAddProductImg } from '@/firebase/products/productsImg/fbAddProductImg';
import { fbAddProductImgData } from '@/firebase/products/productsImg/fbAddProductImgData';
import type { UserIdentity } from '@/types/users';

import type { RcFile, UploadFile } from 'antd/es/upload/interface';

type UploadProductImageSuccess = {
  status: 'success';
  uploadFile: UploadFile;
};

type UploadProductImageError = {
  errorMessage: string;
  status: 'error';
  uploadFile: UploadFile | null;
};

export type UploadProductImageResult =
  | UploadProductImageSuccess
  | UploadProductImageError;

export const uploadProductImage = async ({
  file,
  onProgress,
  user,
}: {
  file: RcFile;
  onProgress: (progress: number) => void;
  user: UserIdentity | null;
}): Promise<UploadProductImageResult> => {
  const uploadFile: UploadFile = {
    uid: file.uid,
    name: file.name,
    percent: 0,
    status: 'uploading',
  };

  try {
    const url = await fbAddProductImg(user, file, onProgress);
    await fbAddProductImgData(user, url);

    return {
      status: 'success',
      uploadFile: {
        ...uploadFile,
        status: 'done',
        url,
      },
    };
  } catch (error) {
    console.error('Error al cargar la imagen', error);
    return {
      errorMessage: 'Error al cargar la imagen',
      status: 'error',
      uploadFile: {
        ...uploadFile,
        status: 'error',
      },
    };
  }
};
