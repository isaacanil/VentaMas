// @ts-nocheck
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';

const handleNoData = (user) => {
  if (!user || !user?.businessID) {
    return () => {
      return;
    };
  }
};

export const useGetUser = () => {
  const user = useSelector(selectUser);
  return { user, handleNoData: handleNoData(user) };
};
