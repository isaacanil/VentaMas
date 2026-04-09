import { fbRecordAuthorizationApproval } from '@/firebase/authorization/approvalLogs';
import {
  approveAuthorizationRequest,
  rejectAuthorizationRequest,
} from '@/firebase/authorizations/invoiceEditAuthorizations';

import type { AuthorizationRequest } from './authorizationsPanel';
import { resolveRequestModule } from './authorizationsPanel';

type AuthorizationActionType = 'approve' | 'reject';

type ExecuteAuthorizationRequestActionParams = {
  authId: string;
  authorizations: AuthorizationRequest[];
  currentUser: any;
  type: AuthorizationActionType;
};

export const executeAuthorizationRequestAction = async ({
  authId,
  authorizations,
  currentUser,
  type,
}: ExecuteAuthorizationRequestActionParams) => {
  const requestSnapshot = authorizations.find(
    (item) => item.id === authId || item.key === authId,
  );
  const moduleForLog = resolveRequestModule(requestSnapshot);
  const requestedBySnapshot = requestSnapshot?.requestedBy || null;

  if (type === 'approve') {
    await approveAuthorizationRequest(currentUser, authId, currentUser);
    await fbRecordAuthorizationApproval({
      businessId: currentUser?.businessID,
      module: moduleForLog,
      action: 'authorization-request-approve',
      description:
        requestSnapshot?.note ||
        requestSnapshot?.requestNote ||
        'Aprobación desde panel de notificaciones',
      requestedBy: requestedBySnapshot || currentUser || null,
      authorizer: currentUser,
      targetUser: requestedBySnapshot || null,
      target: {
        type: 'authorizationRequest',
        id: authId,
        name: requestSnapshot?.reference || '',
        details: {
          status: requestSnapshot?.status || 'pending',
          module: moduleForLog,
        },
      } as any,
      metadata: {
        context: 'notification-panel',
        module: moduleForLog,
        reference:
          requestSnapshot?.reference || requestSnapshot?.invoiceNumber || null,
      } as any,
    } as any);

    return {
      feedbackType: 'success' as const,
      message: 'Solicitud aprobada',
    };
  }

  await rejectAuthorizationRequest(currentUser, authId, currentUser);
  await fbRecordAuthorizationApproval({
    businessId: currentUser?.businessID,
    module: moduleForLog,
    action: 'authorization-request-reject',
    description:
      requestSnapshot?.note ||
      requestSnapshot?.requestNote ||
      'Rechazo desde panel de notificaciones',
    requestedBy: requestedBySnapshot || currentUser || null,
    authorizer: currentUser,
    targetUser: requestedBySnapshot || null,
    target: {
      type: 'authorizationRequest',
      id: authId,
      name: requestSnapshot?.reference || '',
      details: {
        status: requestSnapshot?.status || 'pending',
        module: moduleForLog,
      },
    } as any,
    metadata: {
      context: 'notification-panel',
      module: moduleForLog,
      reference:
        requestSnapshot?.reference || requestSnapshot?.invoiceNumber || null,
    } as any,
  } as any);

  return {
    feedbackType: 'info' as const,
    message: 'Solicitud rechazada',
  };
};
