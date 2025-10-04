import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../../../../../features/auth/userSlice';
import {
  listenToAuthorizationsByStatus,
  approveAuthorizationRequest,
  rejectAuthorizationRequest,
} from '../../../../../../firebase/authorizations/invoiceEditAuthorizations';
import { LoadingState, EmptyState, AuthorizationsPanelContent } from './components';
import { useAuthorizationPin } from '../../../../../../hooks/useAuthorizationPin';
import { PinAuthorizationModal } from '../../../../../component/modals/PinAuthorizationModal/PinAuthorizationModal';

const PRIVILEGED_ROLES = new Set(['admin', 'owner', 'dev', 'manager']);

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
  const [authorizations, setAuthorizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

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

  const performPendingAction = useCallback(
    async (authorizer) => {
      if (!pendingAction) return;

      const { id, type } = pendingAction;
      setProcessingId(id);

      try {
        if (type === 'approve') {
          await approveAuthorizationRequest(user, id, authorizer);
        } else {
          await rejectAuthorizationRequest(user, id, authorizer);
        }
      } catch (error) {
        const actionLabel = type === 'approve' ? 'aprobando' : 'rechazando';
        console.error(`Error ${actionLabel}:`, error);
      } finally {
        setProcessingId(null);
        setPendingAction(null);
      }
    },
    [pendingAction, user]
  );

  const { showModal: showPinModal, modalProps } = useAuthorizationPin({
    onAuthorized: performPendingAction,
    module: 'authorizationRequests',
    description: 'Se requiere autorización para aprobar o rechazar esta solicitud.',
    allowedRoles: Array.from(PRIVILEGED_ROLES),
  });

  const handleApprove = useCallback(
    (authId) => {
      setPendingAction({ id: authId, type: 'approve' });
      showPinModal();
    },
    [showPinModal]
  );

  const handleReject = useCallback(
    (authId) => {
      setPendingAction({ id: authId, type: 'reject' });
      showPinModal();
    },
    [showPinModal]
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
      />
      <PinAuthorizationModal
        {...modalProps}
        setIsOpen={(value) => {
          modalProps.setIsOpen(value);
          if (!value) {
            setPendingAction(null);
          }
        }}
      />
    </>
  );
};

export default AuthorizationsPanel;
