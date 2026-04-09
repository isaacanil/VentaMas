import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { DoctorRecord } from '@/types/doctors';
import type { UserIdentity } from '@/types/users';

export const useFbGetDoctors = () => {
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector(selectUser) as UserIdentity | null | undefined;

  const [prevBusinessID, setPrevBusinessID] = useState(user?.businessID);
  if (user?.businessID !== prevBusinessID) {
    setPrevBusinessID(user?.businessID);
    setDoctors([]);
    if (user?.businessID) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user || !user?.businessID) {
      return undefined;
    }

    const doctorsRef = collection<DoctorRecord>(
      db,
      'businesses',
      user.businessID,
      'doctors',
    );
    const activeQuery = query(doctorsRef, where('status', '==', 'active'));

    const unsubscribe = onSnapshot(
      activeQuery,
      (snapshot) => {
        const doctorsArray = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDoctors(doctorsArray);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching doctors:', error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  return { doctors, loading };
};
