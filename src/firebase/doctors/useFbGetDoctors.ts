import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { DoctorRecord } from '@/types/doctors';
import type { UserIdentity } from '@/types/users';

type DoctorsSnapshotState = {
  businessID: string | null;
  doctors: DoctorRecord[];
};

export const useFbGetDoctors = () => {
  const [snapshotState, setSnapshotState] = useState<DoctorsSnapshotState>({
    businessID: null,
    doctors: [],
  });
  const user = useSelector(selectUser) as UserIdentity | null | undefined;
  const businessID = user?.businessID ?? null;

  useEffect(() => {
    if (!businessID) {
      return undefined;
    }

    const doctorsRef = collection(
      db,
      'businesses',
      businessID,
      'doctors',
    );
    const activeQuery = query(doctorsRef, where('status', '==', 'active'));

    const unsubscribe = onSnapshot(
      activeQuery,
      (snapshot) => {
        const doctorsArray = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as DoctorRecord),
        }));
        setSnapshotState({
          businessID,
          doctors: doctorsArray,
        });
      },
      (error) => {
        console.error('Error fetching doctors:', error);
        setSnapshotState({
          businessID,
          doctors: [],
        });
      },
    );

    return unsubscribe;
  }, [businessID]);

  const isCurrentSnapshot = snapshotState.businessID === businessID;
  const doctors = businessID && isCurrentSnapshot ? snapshotState.doctors : [];
  const loading = Boolean(businessID) && !isCurrentSnapshot;

  return { doctors, loading };
};
