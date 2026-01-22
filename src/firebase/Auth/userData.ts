import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';

type User = ReturnType<typeof selectUser>;
type HandleNoData = (() => void) | undefined;

const handleNoData = (user: User): HandleNoData => {
  if (!user || !user?.businessID) {
    return () => {
      return;
    };
  }
  return undefined;
};

export const useGetUser = () => {
  const user = useSelector(selectUser);
  return { user, handleNoData: handleNoData(user) };
};
