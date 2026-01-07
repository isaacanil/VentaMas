// @ts-nocheck
import { collection, query, where, getDocs } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export const fbCheckDoctorExists = async (
  businessID,
  name,
  specialty,
  currentDoctorId = null,
) => {
  const doctorsRef = collection(db, 'businesses', businessID, 'doctors');

  // Check for name and specialty combination (case insensitive)
  const doctorQuery = query(
    doctorsRef,
    where('name', '==', name),
    where('specialty', '==', specialty),
    where('status', '==', 'active'),
  );
  const doctorSnapshot = await getDocs(doctorQuery);

  const duplicates = {
    exists: false,
    message: '',
  };

  doctorSnapshot.forEach((doc) => {
    if (doc.id !== currentDoctorId) {
      duplicates.exists = true;
      duplicates.message = `Ya existe un doctor con el nombre "${name}" y especialidad "${specialty}"`;
    }
  });

  return duplicates;
};
