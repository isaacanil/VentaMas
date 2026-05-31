import { getDownloadURL, listAll, ref } from 'firebase/storage';

import { storage } from '@/firebase/firebaseconfig';

const LOGIN_IMAGE_PATH = 'app-config/login-image';

export const fetchAuthBackgroundImageUrl = async (): Promise<string | null> => {
  const loginImageRef = ref(storage, LOGIN_IMAGE_PATH);
  const files = await listAll(loginImageRef);

  if (!files.items.length) {
    return null;
  }

  return getDownloadURL(files.items[0]);
};
