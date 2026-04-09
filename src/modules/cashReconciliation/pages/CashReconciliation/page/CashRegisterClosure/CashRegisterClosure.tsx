import { notification, message } from 'antd';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  clearCashCount,
  selectCashCount,
  addPropertiesToCashCount,
} from '@/features/cashCount/cashCountManagementSlice';
import { fbCashCountChangeState } from '@/firebase/cashCount/closing/fbCashCountClosing';
import { useFbGetCashCount } from '@/firebase/cashCount/fbGetCashCount';
import { useAuthorizationModules } from '@/hooks/useAuthorizationModules';
import { useAuthorizationPin } from '@/hooks/useAuthorizationPin';
import { PeerReviewAuthorization } from '@/components/modals/PeerReviewAuthorization/PeerReviewAuthorization';
import { PinAuthorizationModal } from '@/components/modals/PinAuthorizationModal/PinAuthorizationModal';
import { selectUser } from '@/features/auth/userSlice';
import type { CashCountRecord } from '@/utils/cashCount/types';
import type { UserIdentity } from '@/types/users';
import { hasManageAllAccess } from '@/utils/access/manageAllAccess';
import type { TimestampLike } from '@/utils/date/types';
import { CASH_COUNT_AUTHORIZATION_ROLES } from '@/utils/roles/roleGroups';

import { Body } from './components/Body/Body';
import { Footer } from './components/Footer/Footer';
import { Header } from './components/Header/Header';
import { completeCashRegisterClosure } from './utils/completeCashRegisterClosure';

interface CashCountDocSnapshot {
  cashCount?: CashCountRecord;
}

export const CashRegisterClosure: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [closingDate] = useState(() => DateTime.now());
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const actualUser = useSelector(selectUser) as UserIdentity | null;
  const cashCount = useSelector(selectCashCount) as CashCountRecord;
  const { shouldUsePinForModule } = useAuthorizationModules();
  const usePinAuth = shouldUsePinForModule('accountsReceivable');

  const cashCountIsOpen = cashCount?.state === 'open';
  const cashCountIsClosed = cashCount?.state === 'closed';
  const actualUserId = actualUser ? actualUser.uid : null;
  const cashCountOpeningEmployee = cashCount?.opening?.employee;
  const cashCountOpeningEmployeeId = cashCountOpeningEmployee
    ? cashCountOpeningEmployee.id
    : null;
  const canManageThisCashCount =
    cashCountOpeningEmployeeId === actualUserId || hasManageAllAccess(actualUser);

  const cashCountActual = useFbGetCashCount(
    cashCount?.id,
  ) as CashCountDocSnapshot | null;

  useEffect(() => {
    if (!cashCountActual?.cashCount) return;

    const hasNewPayments =
      (cashCountActual.cashCount.receivablePayments?.length || 0) !==
      (cashCount.receivablePayments?.length || 0);

    if (!hasNewPayments) return;

    const sanitizedPayments = (
      cashCountActual.cashCount.receivablePayments || []
    ).map((payment: Record<string, unknown> & { date?: TimestampLike }) => ({
      ...payment,
      date:
        payment.date &&
        typeof (payment.date as { toDate?: () => Date }).toDate === 'function'
          ? (payment.date as { toDate: () => Date }).toDate().toISOString()
          : payment.date &&
              typeof (payment.date as { toMillis?: () => number }).toMillis ===
                'function'
            ? new Date(
                (payment.date as { toMillis: () => number }).toMillis(),
              ).toISOString()
            : payment.date,
    }));

    dispatch(
      addPropertiesToCashCount({
        receivablePayments: sanitizedPayments,
      }),
    );
  }, [cashCountActual, cashCount.receivablePayments, dispatch]);

  useEffect(() => {
    if (!cashCount?.opening?.initialized) {
      navigate('/cash-reconciliation');
    }
  }, [cashCount, navigate]);

  const handleCancel = async () => {
    if (cashCount.state === 'closing' || cashCount.state === 'open') {
      if (!canManageThisCashCount) {
        notification.error({
          message: 'Sin permisos',
          description:
            'No tienes permisos para cambiar el estado de este cuadre de caja.',
        });
        return;
      }

      const result = await fbCashCountChangeState(cashCount, actualUser, 'open');
      if (result instanceof Error) {
        notification.error({
          message: 'No se pudo restaurar el cuadre',
          description: result.message || 'Ocurrió un error al cambiar el estado.',
        });
        return;
      }
    }
    dispatch(clearCashCount());
    navigate('/cash-reconciliation');
  };

  const handleAuthorizationSuccess = (approvalEmployee: UserIdentity) => {
    if (!actualUser) {
      throw new Error('No se pudo identificar al usuario actual.');
    }

    return completeCashRegisterClosure({
      actualUser,
      approvalEmployee,
      cashCount,
      closingDateIso:
        closingDate?.toISO?.() || closingDate?.toString?.() || null,
      closingDateMillis: closingDate.toMillis(),
    }).then((result) => {
      if (result.status === 'error') {
        throw new Error(result.errorMessage);
      }

      message.success('Cierre autorizado correctamente.');
      dispatch(clearCashCount());
      navigate(-1);
    });
  };

  const { showModal: showPinModal, modalProps: pinModalProps } =
    useAuthorizationPin({
      onAuthorized: handleAuthorizationSuccess,
      module: 'accountsReceivable',
      allowedRoles: [...CASH_COUNT_AUTHORIZATION_ROLES],
      description:
        'Autoriza el cierre del cuadre de caja con tu PIN o contraseña.',
    });

  const handlePasswordAuth = (user: UserIdentity) => handleAuthorizationSuccess(user);

  const handleOpenAuthorizationModal = () => {
    if (!canManageThisCashCount) {
      notification.error({
        message: 'Error',
        description: 'No tienes permisos para realizar esta acción',
      });
      return;
    }

    if (cashCountIsOpen) {
      fbCashCountChangeState(cashCount, actualUser, 'closing');
    }

    if (usePinAuth) {
      showPinModal();
    } else {
      setShowPasswordModal(true);
    }
  };

  return (
    <Backdrop>
      <Container>
        <Header state={cashCountActual?.cashCount?.state} />
        <Body closingDate={closingDate} />
        <Footer
          onSubmit={!cashCountIsClosed ? handleOpenAuthorizationModal : null}
          onCancel={handleCancel}
        />
      </Container>
      {usePinAuth ? (
        <PinAuthorizationModal {...pinModalProps} />
      ) : (
        <PeerReviewAuthorization
          isOpen={showPasswordModal}
          setIsOpen={setShowPasswordModal}
          onSubmit={handlePasswordAuth}
          description="Autoriza el cierre del cuadre de caja con tu contraseña."
        />
      )}
    </Backdrop>
  );
};
const Backdrop = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  background-color: #f0f0f0;
`;
const Container = styled.div`
  display: grid;
  gap: 0.4em;
  width: 100%;
  max-width: 1000px;
  height: 100%;
  padding: 0.4em;
  margin: 0 auto;
`;
