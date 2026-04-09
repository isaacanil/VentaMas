import { doc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserWithBusiness } from '@/types/users';

export const fbDeleteDoctor = async (
  doctorId: string,
  user: UserWithBusiness | null | undefined,
): Promise<boolean> => {
  if (!user?.businessID || !doctorId) return false;

  try {
    const doctorRef = doc(
      db,
      'businesses',
      user.businessID,
      'doctors',
      doctorId,
    );
    await updateDoc(doctorRef, {
      status: 'inactive',
    });
    console.info('Doctor deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting doctor: ', error);
    throw error;
  }
};
