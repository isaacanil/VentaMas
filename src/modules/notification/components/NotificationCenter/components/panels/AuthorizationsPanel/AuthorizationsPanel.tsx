import { message, Modal } from 'antd';
import { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { selectUser } from '@/features/auth/userSlice';
import { closeNotificationCenter } from '@/features/notification/notificationCenterSlice';
import ROUTES_PATH from '@/router/routes/routesName';
import { hasAuthorizationApproveAccess } from '@/utils/access/authorizationAccess';

import { usePendingAuthorizations } from './hooks/usePendingAuthorizations';
import { executeAuthorizationRequestAction } from './utils/executeAuthorizationRequestAction';
import type { AuthorizationRequest } from './utils/authorizationsPanel';
import LoadingState from './components/LoadingState';
import EmptyState from './components/EmptyState';
import AuthorizationsPanelContent from './components/AuthorizationsPanelContent';

const AuthorizationsPanel = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleNavigateToRequests = useCallback(() => {
    const targetPath = ROUTES_PATH.AUTHORIZATIONS_TERM.AUTHORIZATIONS_LIST;
    dispatch(closeNotificationCenter());
    navigate(`${targetPath}?tab=requests&status=pending`);
  }, [dispatch, navigate]);

  const isAdmin = hasAuthorizationApproveAccess(user);
  const businessID = user?.businessID;
  const { authorizations, loading } = usePendingAuthorizations({
    businessID,
    isAdmin,
    userId: user?.uid,
  });
  const pendingCount = useMemo(
    () =>
      authorizations.reduce(
        (count, auth) => (auth.status === 'pending' ? count + 1 : count),
        0,
      ),
    [authorizations],
  );

  const executeAction = useCallback(
    async (authId: string, type: 'approve' | 'reject') => {
      if (!user) {
        message.warning('Debes iniciar sesión para gestionar autorizaciones.');
        return;
      }

      if (!hasAuthorizationApproveAccess(user)) {
        message.warning('No tienes permisos para gestionar esta autorización.');
        return;
      }

      setProcessingId(authId);

      try {
        const result = await executeAuthorizationRequestAction({
          authId,
          authorizations,
          currentUser: user,
          type,
        });

        if (result.feedbackType === 'success') {
          message.success(result.message);
        } else {
          message.info(result.message);
        }
      } catch (error) {
        const actionLabel = type === 'approve' ? 'aprobar' : 'rechazar';
        console.error(`Error al ${actionLabel} la autorización:`, error);
        message.error(`No se pudo ${actionLabel} la autorización.`);
      }

      setProcessingId(null);
    },
    [authorizations, user],
  );

  const handleApprove = useCallback(
    (authId: string) => {
      Modal.confirm({
        title: '¿Confirmar autorización?',
        content:
          'Esta acción aprobará la solicitud seleccionada y se registrará en el historial.',
        okText: 'Autorizar',
        zIndex: 9999,
        cancelText: 'Cancelar',
        onOk: () => executeAction(authId, 'approve'),
      });
    },
    [executeAction],
  );

  const handleReject = useCallback(
    (authId: string) => {
      Modal.confirm({
        title: '¿Rechazar solicitud?',
        content: 'Esta acción rechazará la solicitud y no podrá deshacerse.',
        okText: 'Rechazar',
        cancelText: 'Cancelar',
        zIndex: 9999,
        okButtonProps: { danger: true },
        onOk: () => executeAction(authId, 'reject'),
      });
    },
    [executeAction],
  );

  if (loading) {
    return <LoadingState />;
  }

  if (authorizations.length === 0) {
    return <EmptyState isAdmin={isAdmin} />;
  }

  return (
    <>
      <AuthorizationsPanelContent
        authorizations={authorizations}
        pendingCount={pendingCount}
        isAdmin={isAdmin}
        processingId={processingId}
        onApprove={handleApprove}
        onReject={handleReject}
        onNavigateToRequests={handleNavigateToRequests}
      />
    </>
  );
};

export default AuthorizationsPanel;
