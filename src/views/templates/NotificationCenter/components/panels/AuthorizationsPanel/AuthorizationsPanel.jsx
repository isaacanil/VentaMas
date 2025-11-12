import { message, Modal } from 'antd';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { selectUser } from '../../../../../../features/auth/userSlice';
import { closeNotificationCenter } from '../../../../../../features/notification/notificationCenterSlice';
import { fbRecordAuthorizationApproval } from '../../../../../../firebase/authorization/approvalLogs';
import {
  listenToAuthorizationsByStatus,
  approveAuthorizationRequest,
  rejectAuthorizationRequest,
} from '../../../../../../firebase/authorizations/invoiceEditAuthorizations';
import ROUTES_PATH from '../../../../../../routes/routesName';

import { LoadingState, EmptyState, AuthorizationsPanelContent } from './components';

const PRIVILEGED_ROLES = new Set(['admin', 'owner', 'dev', 'manager']);

const resolveRequestModule = (request) => {
  if (!request || typeof request !== 'object') return 'authorizationRequests';

  const metadataModule =
    request.metadata && typeof request.metadata === 'object' && typeof request.metadata.module === 'string'
      ? request.metadata.module
      : null;

  return (
    (typeof request.module === 'string' && request.module) ||
    (typeof request.type === 'string' && request.type) ||
    metadataModule ||
    (typeof request.collectionKey === 'string' && request.collectionKey) ||
    'authorizationRequests'
  );
};

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') {
    return value > 1e12 ? value : value * 1000;
  }
  if (typeof value.toMillis === 'function') {
    return value.toMillis();
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return value.seconds * 1000;
  }
  return 0;
};

const sortAuthorizations = (items) =>
  (Array.isArray(items) ? items : [])
    .slice()
    .sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;

      const dateA = toMillis(a.createdAt);
      const dateB = toMillis(b.createdAt);
      return dateB - dateA;
    });

const AuthorizationsPanel = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [authorizations, setAuthorizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const handleNavigateToRequests = useCallback(() => {
    const targetPath = ROUTES_PATH.AUTHORIZATIONS_TERM.AUTHORIZATIONS_LIST;
    dispatch(closeNotificationCenter());
    navigate(`${targetPath}?tab=requests&status=pending`);
  }, [dispatch, navigate]);

  const pendingCount = useMemo(
    () => authorizations.reduce((count, auth) => (auth.status === 'pending' ? count + 1 : count), 0),
    [authorizations]
  );

  const isAdmin = PRIVILEGED_ROLES.has(user?.role ?? '');
  const businessID = user?.businessID;

  useEffect(() => {
    if (!businessID) return;

    const status = 'pending';
    const userId = isAdmin ? null : user?.uid;

    const unsubscribe = listenToAuthorizationsByStatus(
      businessID,
      status,
      userId,
      (data) => {
        setAuthorizations(sortAuthorizations(data));
        setLoading(false);
      },
      (error) => {
        console.error('Error escuchando autorizaciones:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe?.();
  }, [businessID, isAdmin, user?.uid]);

  const executeAction = useCallback(
    async (authId, type) => {
      if (!user) {
        message.warning('Debes iniciar sesión para gestionar autorizaciones.');
        return;
      }

      if (!PRIVILEGED_ROLES.has(user.role ?? '')) {
        message.warning('No tienes permisos para gestionar esta autorización.');
        return;
      }

      setProcessingId(authId);

      try {
        const requestSnapshot = authorizations.find((item) => item.id === authId || item.key === authId);
        const moduleForLog = resolveRequestModule(requestSnapshot);
        const requestedBySnapshot = requestSnapshot?.requestedBy || null;

        if (type === 'approve') {
          await approveAuthorizationRequest(user, authId, user);
          message.success('Solicitud aprobada');
          await fbRecordAuthorizationApproval({
            businessId: user?.businessID,
            module: moduleForLog,
            action: 'authorization-request-approve',
            description:
              requestSnapshot?.note ||
              requestSnapshot?.requestNote ||
              'Aprobación desde panel de notificaciones',
            requestedBy: requestedBySnapshot || user || null,
            authorizer: user,
            targetUser: requestedBySnapshot || null,
            target: {
              type: 'authorizationRequest',
              id: authId,
              name: requestSnapshot?.reference || '',
              details: {
                status: requestSnapshot?.status || 'pending',
                module: moduleForLog,
              },
            },
            metadata: {
              context: 'notification-panel',
              module: moduleForLog,
              reference: requestSnapshot?.reference || requestSnapshot?.invoiceNumber || null,
            },
          });
        } else {
          await rejectAuthorizationRequest(user, authId, user);
          message.info('Solicitud rechazada');
          await fbRecordAuthorizationApproval({
            businessId: user?.businessID,
            module: moduleForLog,
            action: 'authorization-request-reject',
            description:
              requestSnapshot?.note ||
              requestSnapshot?.requestNote ||
              'Rechazo desde panel de notificaciones',
            requestedBy: requestedBySnapshot || user || null,
            authorizer: user,
            targetUser: requestedBySnapshot || null,
            target: {
              type: 'authorizationRequest',
              id: authId,
              name: requestSnapshot?.reference || '',
              details: {
                status: requestSnapshot?.status || 'pending',
                module: moduleForLog,
              },
            },
            metadata: {
              context: 'notification-panel',
              module: moduleForLog,
              reference: requestSnapshot?.reference || requestSnapshot?.invoiceNumber || null,
            },
          });
        }
      } catch (error) {
        const actionLabel = type === 'approve' ? 'aprobar' : 'rechazar';
        console.error(`Error al ${actionLabel} la autorización:`, error);
        message.error(`No se pudo ${actionLabel} la autorización.`);
      } finally {
        setProcessingId(null);
      }
    },
    [authorizations, user]
  );

  const handleApprove = useCallback(
    (authId) => {
      Modal.confirm({
        title: '¿Confirmar autorización?',
        content: 'Esta acción aprobará la solicitud seleccionada y se registrará en el historial.',
        okText: 'Autorizar',
        zIndex: 9999,
        cancelText: 'Cancelar',
        onOk: () => executeAction(authId, 'approve'),
      });
    },
    [executeAction]
  );

  const handleReject = useCallback(
    (authId) => {
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
    [executeAction]
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
