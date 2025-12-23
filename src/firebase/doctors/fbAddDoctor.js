import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';

export const fbAddDoctor = async (doctor, user) => {
  if (!user || !user?.businessID) return;

  const doctorData = {
    ...doctor,
    id: nanoid(10),
    createdAt: Timestamp.now(),
    status: 'active',
  };

  try {
    const doctorRef = doc(
      db,
      'businesses',
      user.businessID,
      'doctors',
      doctorData.id,
    );
    await setDoc(doctorRef, doctorData);
    console.info('Doctor created successfully');
    return doctorData.id;
  } catch (error) {
    console.error('Error adding doctor: ', error);
    throw error;
  }
};
