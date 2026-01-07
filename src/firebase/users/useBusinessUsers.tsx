// @ts-nocheck
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';

import { fbGetUsers } from './fbGetUsers';

const makeBaseState = (businessID) => ({
  businessID: businessID ?? null,
  users: [],
  loading: Boolean(businessID),
  error: null,
});

export function useBusinessUsers() {
  const currentUser = useSelector(selectUser);
  const businessID = currentUser?.businessID ?? null;

  const [snapshot, setSnapshot] = useState(() => makeBaseState(businessID));

  const isSameBusiness = snapshot.businessID === businessID;

  const users = !businessID ? [] : isSameBusiness ? snapshot.users : [];
  const loading = !businessID ? false : isSameBusiness ? snapshot.loading : true;
  const error = !businessID ? null : isSameBusiness ? snapshot.error : null;

  useEffect(() => {
    if (!businessID) return undefined;

    let unsubscribe;
    let cancelled = false;

      unsubscribe = fbGetUsers(
        { businessID },
        (usersArray) => {
          if (cancelled) return;
          setSnapshot({
            businessID,
            users: usersArray,
            loading: false,
            error: null,
          });
        },
        (err) => {
          if (cancelled) return;
          setSnapshot((prevState) => ({
            ...prevState,
            loading: false,
            error: err,
          }));
        },
      );
  

    return () => {
      cancelled = true;
       unsubscribe?.();
    };
  }, [businessID]);
  
  return { users, loading, error };
}
