import { ref, getBlob } from 'firebase/storage';

import { storage } from '@/firebase/firebaseconfig';

export async function downloadImage(url) {
  const gsPath = url.split('/o/')[1].split('?')[0];
  const decodedPath = decodeURIComponent(gsPath);
  const imageRef = ref(storage, decodedPath);

  const blob = await getBlob(imageRef);

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = (error) =>
      reject(new Error(`Error reading blob: ${error}`));
    reader.readAsDataURL(blob);
  });
}
