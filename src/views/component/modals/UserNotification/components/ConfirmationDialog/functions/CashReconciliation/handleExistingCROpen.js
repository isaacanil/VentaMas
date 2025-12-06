import { setUserNotification } from '@features/UserNotification/UserNotificationSlice';

export const handlerExistingCROpen = (navigate, dispatch, resolve) => {
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
    }),
  );
};
