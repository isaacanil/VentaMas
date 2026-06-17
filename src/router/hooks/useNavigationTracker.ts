import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { pushHistory } from '@/modules/navigation/public';

/**
 * Hook para registrar automáticamente las rutas visitadas en el historial.
 * @returns {void}
 */
export const useNavigationTracker = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      pushHistory({
        pathname: location.pathname,
        search: location.search,
        hash: location.hash,
        state: location.state,
        key: location.key,
      }),
    );
  }, [location, dispatch]);

  return null;
};
