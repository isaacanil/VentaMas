import { message } from 'antd';
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { useDialog } from '@/Context/Dialog';
import { selectUser } from '@/features/auth/userSlice';
import { selectCashReconciliation } from '@/features/cashCount/cashStateSlice';
import { fbCashCountChangeState } from '@/firebase/cashCount/closing/fbCashCountClosing';

const dialogConfig = {
  title: 'Cierre de caja en proceso',
  type: 'warning',
  confirmButtonText: 'Reabrir cuadre',
  cancelButtonText: 'Mantener cierre',
};

export const useCashCountClosingPrompt = () => {
  const { state, cashCount } = useSelector(selectCashReconciliation);
  const user = useSelector(selectUser);
  const { setDialogConfirm } = useDialog();
  const promptedCashCountId = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const cashCountId = cashCount?.id;
    const isCashReconciliationRoute =
      location.pathname === '/cash-reconciliation' ||
      location.pathname.startsWith('/cash-reconciliation/');

    if (
      isCashReconciliationRoute ||
      state !== 'closing' ||
      !cashCountId ||
      !user?.uid
    ) {
      promptedCashCountId.current = null;
      return;
    }

    if (promptedCashCountId.current === cashCountId) {
      return;
    }

    promptedCashCountId.current = cashCountId;

    setDialogConfirm({
      ...dialogConfig,
      isOpen: true,
      message:
        'Tu cuadre de caja está en proceso de cierre. ¿Deseas reabrirlo para continuar trabajando?',
      onConfirm: async () => {
        const response = await fbCashCountChangeState(cashCount, user, 'open');

        if (response === 'success') {
          message.success('Cuadre de caja reabierto.');
          promptedCashCountId.current = null;
          return;
        }

        const errorMessage =
          response?.message || 'No se pudo reabrir el cuadre de caja.';
        message.error(errorMessage);
      },
      onCancel: () => {
        message.info('El cuadre de caja seguirá cerrando.');
      },
    });
  }, [state, cashCount, user, setDialogConfirm, location.pathname]);
};
