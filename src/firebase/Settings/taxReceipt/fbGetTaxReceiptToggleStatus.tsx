import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { setTaxReceiptEnabled } from '@/features/cart/cartSlice';
import { toggleTaxReceiptSettings } from '@/features/taxReceipt/taxReceiptSlice';
import { db } from '@/firebase/firebaseconfig';

type UserRootState = Parameters<typeof selectUser>[0];

type TaxReceiptSettingsDoc = {
  taxReceiptEnabled?: boolean;
};

export const useFbTaxReceiptToggleStatus = () => {
  const user = useSelector<UserRootState, ReturnType<typeof selectUser>>(
    selectUser,
  );
  const dispatch = useDispatch();
  const businessId = user?.businessID;

  useEffect(() => {
    if (!businessId) return undefined;

    const settingRef = doc(
      db,
      'businesses',
      businessId,
      'settings',
      'taxReceipt',
    );

    // Usar onSnapshot para escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(
      settingRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as TaxReceiptSettingsDoc;
          const enabled = Boolean(data.taxReceiptEnabled);
          dispatch(toggleTaxReceiptSettings(enabled));
          dispatch(setTaxReceiptEnabled(enabled));
        } else {
          dispatch(toggleTaxReceiptSettings(false));
          dispatch(setTaxReceiptEnabled(false));
        }
      },
      (error) => {
        console.error(
          'Ocurrio un error al obtener el comprobante fiscal:',
          error,
        );
      },
    );

    // Limpiar la suscripcion cuando el componente se desmonta
    return () => unsubscribe();
  }, [businessId, dispatch]); // Dependencias del efecto
};
