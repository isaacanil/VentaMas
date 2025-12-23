import { doc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export const fbDeleteDoctor = async (doctorId, user) => {
  if (!user || !user?.businessID || !doctorId) return;

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
