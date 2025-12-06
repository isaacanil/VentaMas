import { doc, updateDoc } from 'firebase/firestore';

import { db } from '../firebaseconfig';

export const fbUpdateDoctor = async (doctor, user) => {
  if (!user || !user?.businessID) return;

  try {
    const doctorRef = doc(
      db,
      'businesses',
      user.businessID,
      'doctors',
      doctor.id,
    );
    await updateDoc(doctorRef, doctor);
    console.info('Doctor updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating doctor: ', error);
    throw error;
  }
};
