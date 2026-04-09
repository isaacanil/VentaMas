import { Button, Modal, notification } from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { selectUser } from '@/features/auth/userSlice';
import { fbCashCountChangeState } from '@/firebase/cashCount/closing/fbCashCountClosing';
import { useIsOpenCashReconciliation } from '@/firebase/cashCount/useIsOpenCashReconciliation';
import ROUTES_NAME from '@/router/routes/routesName';
import type { UserIdentity } from '@/types/users';
import { hasManageAllAccess } from '@/utils/access/manageAllAccess';
import { resolveCashCountEmployeeId } from '@/utils/cashCount/resolveEmployeeId';
import type { CashCountRecord } from '@/utils/cashCount/types';

interface CashRegisterAlertModalProps {
  open: boolean;
  onClose: () => void;
  status: string | boolean;
}

export const CashRegisterAlertModal = ({
  open,
  onClose,
  status,
}: CashRegisterAlertModalProps) => {
  const navigate = useNavigate();
  const user = useSelector(selectUser) as UserIdentity | null;
  const { cashCount } = useIsOpenCashReconciliation() as {
    cashCount: CashCountRecord | null;
  };
  const [isReopening, setIsReopening] = useState(false);

  const handleOpenRegister = () => {
    navigate(ROUTES_NAME.CASH_RECONCILIATION_TERM.CASH_RECONCILIATION_OPENING);
    onClose();
  };

  const isClosing = status === 'closing';
  const openingEmployeeId = resolveCashCountEmployeeId(
    cashCount?.opening?.employee,
  );
  const canManageThisCashCount =
    openingEmployeeId === user?.uid || hasManageAllAccess(user);

  const handleReopenRegister = async () => {
    if (!cashCount?.id) {
      notification.error({
        message: 'No se pudo reabrir el cuadre',
        description: 'No se encontró el cuadre de caja en proceso de cierre.',
      });
      return;
    }

    if (!canManageThisCashCount) {
      notification.error({
        message: 'Sin permisos',
        description: 'No tienes permisos para reabrir este cuadre de caja.',
      });
      return;
    }

    setIsReopening(true);

    const result = await fbCashCountChangeState(cashCount, user, 'open');

    setIsReopening(false);

    if (result instanceof Error) {
      notification.error({
        message: 'No se pudo reabrir el cuadre',
        description: result.message || 'Ocurrió un error al cambiar el estado.',
      });
      return;
    }

    notification.success({
      message: 'Cuadre reabierto',
      description: 'La caja volvió a estado abierto y ya puedes continuar.',
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={isClosing ? 'Cierre de caja en proceso' : 'Atención'}
      footer={
        isClosing
          ? [
              <Button key="cancel" onClick={onClose} disabled={isReopening}>
                Ahora no
              </Button>,
              <Button
                key="reopen"
                type="primary"
                onClick={() => void handleReopenRegister()}
                loading={isReopening}
              >
                Reabrir cuadre
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={onClose}>
                Cancelar
              </Button>,
              <Button key="open" type="primary" onClick={handleOpenRegister}>
                Abrir Cuadre
              </Button>,
            ]
      }
    >
      {isClosing ? (
        <>
          <p>Hay un cuadre de caja en proceso de cierre.</p>
          <p>
            En este estado no se pueden realizar nuevas ventas hasta que el
            proceso finalice o se reabra este cuadre.
          </p>
        </>
      ) : (
        <>
          <p>No hay un cuadre de caja abierto para el usuario actual.</p>
          <p>Por favor, abra un cuadre de caja para continuar.</p>
        </>
      )}
    </Modal>
  );
};

