import { notification, message } from 'antd';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  clearCashCount,
  selectCashCount,
  addPropertiesToCashCount,
} from '@/features/cashCount/cashCountManagementSlice';
import { fbRecordAuthorizationApproval } from '@/firebase/authorization/approvalLogs';
import { fbCashCountClosed } from '@/firebase/cashCount/closing/fbCashCountClosed';
import { fbCashCountChangeState } from '@/firebase/cashCount/closing/fbCashCountClosing';
import { useFbGetCashCount } from '@/firebase/cashCount/fbGetCashCount';
import { useAuthorizationModules } from '@/hooks/useAuthorizationModules';
import { useAuthorizationPin } from '@/hooks/useAuthorizationPin';
import { PeerReviewAuthorization } from '@/components/modals/PeerReviewAuthorization/PeerReviewAuthorization';
import { PinAuthorizationModal } from '@/components/modals/PinAuthorizationModal/PinAuthorizationModal';
import { selectUser } from '@/features/auth/userSlice';
import type { CashCountRecord } from '@/utils/cashCount/types';
import type { UserIdentity } from '@/types/users';
import type { TimestampLike } from '@/utils/date/types';

import { Body } from './components/Body/Body';
import { Footer } from './components/Footer/Footer';
import { Header } from './components/Header/Header';

interface CashCountDocSnapshot {
  cashCount?: CashCountRecord;
}

export const CashRegisterClosure: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [closingDate] = useState(DateTime.now());
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const actualUser = useSelector(selectUser) as UserIdentity | null;
  const cashCount = useSelector(selectCashCount) as CashCountRecord;
  const { shouldUsePinForModule } = useAuthorizationModules();
  const usePinAuth = shouldUsePinForModule('accountsReceivable');

  const cashCountIsOpen = cashCount?.state === 'open';
  const cashCountIsClosed = cashCount?.state === 'closed';

  const cashCountActual = useFbGetCashCount(cashCount?.id) as CashCountDocSnapshot | null;

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
        payment.date && typeof (payment.date as { toDate?: () => Date }).toDate === 'function'
          ? (payment.date as { toDate: () => Date }).toDate().toISOString()
          : payment.date && typeof (payment.date as { toMillis?: () => number }).toMillis === 'function'
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
    if (cashCountIsOpen) {
      fbCashCountChangeState(cashCount, actualUser, 'closing');
    }
  }, [cashCountIsOpen, cashCount, actualUser]);

  useEffect(() => {
    if (!cashCount?.opening?.initialized) {
      navigate('/cash-reconciliation');
    }
  }, [cashCount, navigate]);

  const handleCancel = async () => {
    if (cashCount.state === 'closing' || cashCount.state === 'open') {
      fbCashCountChangeState(cashCount, actualUser, 'open');
    }
    dispatch(clearCashCount());
    navigate('/cash-reconciliation');
  };

  const handleAuthorizationSuccess = useCallback(
    async (approvalEmployee: UserIdentity) => {
      try {
        if (!approvalEmployee?.uid) {
          throw new Error('No se pudo identificar al autorizador.');
        }
        if (!actualUser?.uid) {
          throw new Error('No se pudo identificar al usuario actual.');
        }

        const response = await fbCashCountClosed(
          actualUser,
          cashCount,
          actualUser.uid,
          approvalEmployee.uid,
          closingDate.toMillis(),
        );

        if (response !== 'success') {
          throw response instanceof Error
            ? response
            : new Error('No se pudo autorizar el cierre.');
        }

        await fbRecordAuthorizationApproval({
          businessId: actualUser.businessID,
          module: 'cashRegister',
          action: 'cash-register-closing',
          description: 'Cierre del cuadre de caja',
          requestedBy: actualUser,
          authorizer: approvalEmployee,
          targetUser: actualUser,
          target: {
            type: 'cashCount',
            id: cashCount?.id || '',
            details: { stage: 'closing' },
          },
          metadata: {
            closingDate: closingDate?.toISO?.() || closingDate?.toString?.() || null,
          },
        });

        message.success('Cierre autorizado correctamente.');
        dispatch(clearCashCount());
        navigate(-1);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'No se pudo autorizar el cierre.';
        message.error(errorMessage);
      }
    },
    [actualUser, cashCount, closingDate, dispatch, navigate],
  );

  const { showModal: showPinModal, modalProps: pinModalProps } =
    useAuthorizationPin({
      onAuthorized: handleAuthorizationSuccess,
      module: 'accountsReceivable',
      allowedRoles: ['admin', 'owner', 'dev', 'manager', 'cashier'],
      description:
        'Autoriza el cierre del cuadre de caja con tu PIN o contraseña.',
    });

  const handlePasswordAuth = async (user: UserIdentity) => {
    setShowPasswordModal(false);
    await handleAuthorizationSuccess(user);
  };

  const handleOpenAuthorizationModal = () => {
    if (
      cashCount.opening?.employee?.id !== actualUser?.uid &&
      actualUser?.role !== 'admin'
    ) {
      notification.error({
        message: 'Error',
        description: 'No tienes permisos para realizar esta acción',
      });
      return;
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
