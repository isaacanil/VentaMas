import { message } from 'antd';
import { DateTime } from 'luxon';
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { selectUser } from '../../../../../features/auth/userSlice';
import {
  clearCashCount,
  selectCashCount,
  setCashCountOpeningBanknotes,
  setCashCountOpeningComments,
} from '../../../../../features/cashCount/cashCountManagementSlice';
import { fbRecordAuthorizationApproval } from '../../../../../firebase/authorization/approvalLogs';
import { fbCashCountOpening } from '../../../../../firebase/cashCount/opening/fbCashCountOpening';
import { useAuthorizationModules } from '../../../../../hooks/useAuthorizationModules';
import { useAuthorizationPin } from '../../../../../hooks/useAuthorizationPin';
import { PeerReviewAuthorization } from '../../../../component/modals/PeerReviewAuthorization/PeerReviewAuthorization';
import { PinAuthorizationModal } from '../../../../component/modals/PinAuthorizationModal/PinAuthorizationModal';
import { CashDenominationCalculator } from '../../resource/CashDenominationCalculator/CashDenominationCalculator';
import { Comments } from '../CashRegisterClosure/Comments/Comments';
import { DateSection } from '../CashRegisterClosure/components/Header/DateSection';

import { Footer } from './components/Footer/Footer';
import { Header } from './components/Headers/Header';

export const CashRegisterOpening = () => {
  const cashCount = useSelector(selectCashCount);
  const { banknotes } = cashCount.opening;
  const [openingDate] = useState(DateTime.now());
  const [calculatorIsOpen, setCalculatorIsOpen] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const dispatch = useDispatch();
  const actualUser = useSelector(selectUser);
  const { shouldUsePinForModule } = useAuthorizationModules();
  const usePinAuth = shouldUsePinForModule('accountsReceivable');

  const handleChangesBanknotes = (banknotes) => {
    dispatch(setCashCountOpeningBanknotes(banknotes));
  };
  const handleChangesComments = (comments) => {
    dispatch(setCashCountOpeningComments(comments));
  };

  const handleAuthorizationSuccess = useCallback(
    async (approvalEmployee) => {
      try {
        if (!approvalEmployee?.uid) {
          throw new Error('No se pudo identificar al autorizador.');
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

        await fbRecordAuthorizationApproval({
          businessId: actualUser.businessID,
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
      } catch (error) {
        const errorMessage =
          error?.message || 'No se pudo autorizar la apertura.';
        message.error(errorMessage);
      }
    },
    [actualUser, cashCount, dispatch, navigate, openingDate],
  );

  const { showModal: showPinModal, modalProps: pinModalProps } =
    useAuthorizationPin({
      onAuthorized: handleAuthorizationSuccess,
      module: 'accountsReceivable',
      allowedRoles: ['admin', 'owner', 'dev', 'manager', 'cashier'],
      description:
        'Autoriza la apertura del cuadre de caja con tu PIN o contraseña.',
    });

  // Handler para autorización con contraseña clásica
  const handlePasswordAuth = async (user) => {
    setShowPasswordModal(false);
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
    if (location.state?.from === 'factura') {
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
  background-color: #f5f5f5;
  height: 100vh;
  overflow-y: scroll;
`;
const Container = styled.div`
  max-width: 500px;
  height: 100%;
  position: relative;
  margin: 0 auto;
  display: grid;
  align-items: start;
  align-content: start;
  gap: 0.8em;
  padding: 1em;
`;
