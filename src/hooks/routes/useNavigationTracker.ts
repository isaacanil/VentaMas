// @ts-nocheck
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { pushHistory } from '@/features/navigation/navigationSlice';

/**
 * Hook para registrar automáticamente las rutas visitadas en el navigationSlice
 * @returns {void}
 */
export const useNavigationTracker = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    // Guardamos la ubicación completa en el historial
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
