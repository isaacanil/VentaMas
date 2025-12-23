import { ref, deleteObject } from 'firebase/storage';

import { storage } from '@/firebase/firebaseconfig';

export const deletePurchaseImg = async (purchaseId) => {
  const storageRef = ref(storage, `purchase/${purchaseId}`);
  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting purchase image:', error);
  }
};
