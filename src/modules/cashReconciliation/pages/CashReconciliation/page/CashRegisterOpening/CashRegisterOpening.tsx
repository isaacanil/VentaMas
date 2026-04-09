import { message } from 'antd';
import { DateTime } from 'luxon';
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { selectUser } from '@/features/auth/userSlice';
import {
  clearCashCount,
  selectCashCount,
  setCashCountOpeningBanknotes,
  setCashCountOpeningComments,
} from '@/features/cashCount/cashCountManagementSlice';
import { fbRecordAuthorizationApproval } from '@/firebase/authorization/approvalLogs';
import { fbCashCountOpening } from '@/firebase/cashCount/opening/fbCashCountOpening';
import { useAuthorizationModules } from '@/hooks/useAuthorizationModules';
import { useAuthorizationPin } from '@/hooks/useAuthorizationPin';
import { PeerReviewAuthorization } from '@/components/modals/PeerReviewAuthorization/PeerReviewAuthorization';
import { PinAuthorizationModal } from '@/components/modals/PinAuthorizationModal/PinAuthorizationModal';
import { Comments } from '@/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/Comments/Comments';
import { DateSection } from '@/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterClosure/components/Header/DateSection';
import { CashDenominationCalculator } from '@/modules/cashReconciliation/pages/CashReconciliation/resource/CashDenominationCalculator/CashDenominationCalculator';
import type { UserIdentity } from '@/types/users';
import type {
  CashCountBanknote,
  CashCountRecord,
} from '@/utils/cashCount/types';
import { CASH_COUNT_AUTHORIZATION_ROLES } from '@/utils/roles/roleGroups';
import { resolveUserIdentityBusinessId } from '@/utils/users/userIdentityAccess';

import { Footer } from './components/Footer/Footer';
import { Header } from './components/Headers/Header';

export const CashRegisterOpening: React.FC = () => {
  const cashCount = useSelector(selectCashCount) as CashCountRecord;
  const banknotes = cashCount.opening?.banknotes || [];
  const [openingDate] = useState(DateTime.now());
  const [calculatorIsOpen, setCalculatorIsOpen] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const dispatch = useDispatch();
  const actualUser = useSelector(selectUser) as UserIdentity | null;
  const { shouldUsePinForModule } = useAuthorizationModules();
  const usePinAuth = shouldUsePinForModule('accountsReceivable');

  const handleChangesBanknotes = (nextBanknotes: CashCountBanknote[]) => {
    dispatch(setCashCountOpeningBanknotes(nextBanknotes));
  };
  const handleChangesComments = (comments: string) => {
    dispatch(setCashCountOpeningComments(comments));
  };

  const handleAuthorizationSuccess = useCallback(
    async (approvalEmployee: UserIdentity) => {
      if (!approvalEmployee?.uid) {
        throw new Error('No se pudo identificar al autorizador.');
      }
      if (!actualUser?.uid) {
        throw new Error('No se pudo identificar al usuario actual.');
      }
      const businessId = resolveUserIdentityBusinessId(actualUser);
      if (!businessId) {
        throw new Error('No se pudo identificar el negocio actual.');
      }

      const response = await fbCashCountOpening(
        actualUser,
        cashCount,
        actualUser.uid,
        approvalEmployee.uid,
        openingDate.toMillis(),
      );

      if (response !== 'success') {
        throw response instanceof Error
          ? response
          : new Error('No se pudo autorizar la apertura.');
      }

      await (fbRecordAuthorizationApproval as any)({
        businessId,
        module: 'cashRegister',
        action: 'cash-register-opening',
        description: 'Apertura del cuadre de caja',
        requestedBy: actualUser,
        authorizer: approvalEmployee,
        targetUser: actualUser,
        target: {
          type: 'cashCount',
          id: cashCount?.id || '',
          details: { stage: 'opening' },
        },
        metadata: {
          openingDate:
            openingDate?.toISO?.() || openingDate?.toString?.() || null,
        },
      });

      message.success('Apertura autorizada correctamente.');
      dispatch(clearCashCount());
      navigate(-1);
    },
    [actualUser, cashCount, dispatch, navigate, openingDate],
  );

  const { showModal: showPinModal, modalProps: pinModalProps } =
    useAuthorizationPin({
      onAuthorized: handleAuthorizationSuccess,
      module: 'accountsReceivable',
      allowedRoles: [...CASH_COUNT_AUTHORIZATION_ROLES],
      description:
        'Autoriza la apertura del cuadre de caja con tu PIN o contraseña.',
    });

  const handlePasswordAuth = async (user: UserIdentity) => {
    await handleAuthorizationSuccess(user);
  };

  const handleOpenAuthorization = () => {
    if (usePinAuth) {
      showPinModal();
    } else {
      setShowPasswordModal(true);
    }
  };

  const handleCancel = () => {
    if ((location.state as { from?: string } | null)?.from === 'factura') {
      navigate('/sales');
    } else {
      navigate(-1);
    }
    dispatch(clearCashCount());
  };

  return (
    <Backdrop>
      <Container>
        <Header />
        <CashDenominationCalculator
          title={'Efectivo para apertura'}
          banknotes={banknotes}
          datetime={<DateSection date={openingDate} />}
          setBanknotes={handleChangesBanknotes}
          isExpanded={calculatorIsOpen}
          setIsExpanded={setCalculatorIsOpen}
        />
        <Comments
          label="Comentario de Apertura"
          onChange={(e) => handleChangesComments(e.target.value)}
        />
        <Footer onSubmit={handleOpenAuthorization} onCancel={handleCancel} />
      </Container>
      {usePinAuth ? (
        <PinAuthorizationModal {...pinModalProps} />
      ) : (
        <PeerReviewAuthorization
          isOpen={showPasswordModal}
          setIsOpen={setShowPasswordModal}
          onSubmit={handlePasswordAuth}
          description="Autoriza la apertura del cuadre de caja con tu contraseña."
        />
      )}
    </Backdrop>
  );
};
const Backdrop = styled.div`
  height: 100vh;
  overflow-y: scroll;
  background-color: #f5f5f5;
`;
const Container = styled.div`
  position: relative;
  display: grid;
  gap: 0.8em;
  align-content: start;
  align-items: start;
  max-width: 500px;
  height: 100%;
  padding: 1em;
  margin: 0 auto;
`;
