import { collection, query, where, getDocs } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export const fbCheckDoctorExists = async (
  businessID: string,
  name: string | null | undefined,
  specialty: string | null | undefined,
  currentDoctorId: string | null = null,
): Promise<{ exists: boolean; message?: string }> => {
  const doctorsRef = collection(db, 'businesses', businessID, 'doctors');

  // Check for name and specialty combination (case insensitive)
  const doctorQuery = query(
    doctorsRef,
    where('name', '==', name),
    where('specialty', '==', specialty),
    where('status', '==', 'active'),
  );
  const doctorSnapshot = await getDocs(doctorQuery);

  const duplicates: { exists: boolean; message?: string } = {
    exists: false,
  };

  doctorSnapshot.forEach((doc) => {
    if (doc.id !== currentDoctorId) {
      duplicates.exists = true;
      duplicates.message = `Ya existe un doctor con el nombre "${name}" y especialidad "${specialty}"`;
    }
  });

  return duplicates;
};
