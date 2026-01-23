import { doc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { DoctorRecord } from '@/types/doctors';
import type { UserWithBusiness } from '@/types/users';

export const fbUpdateDoctor = async (
  doctor: DoctorRecord,
  user: UserWithBusiness | null | undefined,
): Promise<boolean> => {
  if (!user?.businessID) return false;
  if (!doctor?.id) return false;

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
