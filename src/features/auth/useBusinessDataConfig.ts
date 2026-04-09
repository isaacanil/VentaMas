import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  subscribeToBusinessInfo,
  type BusinessInfoData,
} from '@/firebase/businessInfo/fbGetBusinessInfo';
import { fbStopDeveloperBusinessImpersonation } from '@/firebase/Auth/fbAuthV2/fbSwitchDeveloperBusiness';

import { setBusiness, type Business } from './businessSlice';
import {
  returnToOriginalBusiness,
  selectOriginalBusinessId,
  selectUser,
} from './userSlice';

const isPermissionDeniedError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' && code.includes('permission-denied');
};

export const useBusinessDataConfig = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const businessID = user?.businessID;
  const originalBusinessId = useSelector(selectOriginalBusinessId);

  useEffect(() => {
    if (!businessID) {
      dispatch(setBusiness(null));
      return;
    }

    const normalizeBusiness = (
      business: BusinessInfoData | null,
      id: string,
    ): Business | null => {
      if (!business || typeof business !== 'object') return null;
      const record = business as Record<string, unknown>;
      const name = typeof record.name === 'string' ? record.name : '';
      return { id, name, ...record };
    };

    const unsubscribe = subscribeToBusinessInfo(
      businessID,
      (business) => {
        dispatch(setBusiness(normalizeBusiness(business, businessID)));
      },
      (error) => {
        console.error('Error al obtener la información del negocio:', error);

        // Si el negocio activo fue forzado en modo temporal y ahora quedó sin permiso,
        // volver al negocio original para recuperar contexto válido.
        if (
          isPermissionDeniedError(error) &&
          originalBusinessId &&
          businessID !== originalBusinessId
        ) {
          void (async () => {
            try {
              await fbStopDeveloperBusinessImpersonation();
            } catch (stopError) {
              console.error(
                'No se pudo detener la impersonación en backend:',
                stopError,
              );
            } finally {
              dispatch(returnToOriginalBusiness());
            }
          })();
          return;
        }

        // En errores (permission/network), conservar el último negocio en store
        // para evitar flicker a "Tu negocio". Si el doc no existe, el onNext(null)
        // se encarga de limpiar el store.
      },
    );

    return unsubscribe;
  }, [businessID, dispatch, originalBusinessId, user?.uid]);
};
