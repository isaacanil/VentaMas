import { setUserNotification } from '@/features/UserNotification/UserNotificationSlice';
import type { NavigateFunction } from 'react-router-dom';

export const handlerExistingCROpen = (
  navigate: NavigateFunction,
  dispatch: (action: unknown) => void,
  resolve: { isExistingOpenCR?: boolean } | null | undefined,
) => {
  if (!resolve?.isExistingOpenCR) return;

  dispatch(
    setUserNotification({
      isOpen: true,
      title: 'Reconciliación de efectivo',
      description:
        'Ya existe una reconciliación de efectivo abierta, ¿desea continuar?',
      onConfirm: () => {
        navigate('/cash-reconciliation');
      },
      btnSubmitName: 'Continuar',
      btnCancelName: 'Cancelar',
    }),
  );
};
