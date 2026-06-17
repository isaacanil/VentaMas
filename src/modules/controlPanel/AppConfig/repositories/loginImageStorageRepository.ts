import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytes,
} from 'firebase/storage';

import { storage } from '@/firebase/firebaseconfig';

import { LOGIN_IMAGE_STORAGE_PATH } from '../utils/loginImageCompression';

interface UploadLoginImageParams {
  file: Blob | Uint8Array | ArrayBuffer;
  fileName: string;
}

const getLoginImageRootRef = () => ref(storage, LOGIN_IMAGE_STORAGE_PATH);

export const getCurrentLoginImageUrl = async (): Promise<string | null> => {
  const files = await listAll(getLoginImageRootRef());
  if (!files.items.length) return null;

  return getDownloadURL(files.items[0]);
};

export const clearLoginImages = async (): Promise<void> => {
  const files = await listAll(getLoginImageRootRef());
  await Promise.all(files.items.map((file) => deleteObject(file)));
};

export const uploadLoginImage = async ({
  file,
  fileName,
}: UploadLoginImageParams): Promise<string> => {
  const rootRef = getLoginImageRootRef();
  await clearLoginImages();

  const imageRef = ref(rootRef, fileName);
  await uploadBytes(imageRef, file);

  return getDownloadURL(imageRef);
};
