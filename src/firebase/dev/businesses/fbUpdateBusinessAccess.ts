import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';

export type BusinessAccessStatus =
  | 'active'
  | 'read_only'
  | 'suspended'
  | 'inactive'
  | 'offboarded'
  | 'closed';

export type UpdateBusinessAccessRequest = {
  businessId: string;
  status: BusinessAccessStatus;
  reason: string;
};

export type UpdateBusinessAccessResponse = {
  ok?: boolean;
  businessId?: string;
  status?: BusinessAccessStatus;
  previousStatus?: string | null;
  statusLabel?: string;
  stats?: {
    membersFound?: number;
    membersUpdated?: number;
    usersUpdated?: number;
    usersDeactivated?: number;
    usersReactivated?: number;
    sessionsRevoked?: number;
    batchesCommitted?: number;
  };
};

export const BUSINESS_ACCESS_STATUS_OPTIONS: Array<{
  value: BusinessAccessStatus;
  label: string;
  description: string;
}> = [
  {
    value: 'active',
    label: 'Activo',
    description: 'Permite login y operaciones normales.',
  },
  {
    value: 'read_only',
    label: 'Solo lectura',
    description:
      'Mantiene acceso de consulta y bloquea escrituras por política.',
  },
  {
    value: 'suspended',
    label: 'Suspendido',
    description: 'Bloquea login del negocio y revoca sesiones activas.',
  },
  {
    value: 'inactive',
    label: 'Inactivo',
    description:
      'Bloquea el acceso mientras el negocio está fuera de operación.',
  },
  {
    value: 'offboarded',
    label: 'Offboarding',
    description: 'Marca el negocio en proceso de salida de la plataforma.',
  },
  {
    value: 'closed',
    label: 'Cerrado',
    description: 'Cierra el acceso operativo del negocio.',
  },
];

type UpdateBusinessAccessCallableRequest = UpdateBusinessAccessRequest & {
  sessionToken?: string | null;
};

const clientUpdateBusinessAccessCallable = createFirebaseCallable<
  UpdateBusinessAccessCallableRequest,
  UpdateBusinessAccessResponse
>('clientUpdateBusinessAccess');

export const fbUpdateBusinessAccess = async ({
  businessId,
  status,
  reason,
}: UpdateBusinessAccessRequest): Promise<UpdateBusinessAccessResponse> => {
  const { sessionToken } = getStoredSession();
  if (!sessionToken) {
    throw new Error('Sesión no disponible. Inicia sesión nuevamente.');
  }

  const cleanBusinessId = businessId.trim();
  const cleanReason = reason.trim();
  if (!cleanBusinessId) {
    throw new Error('businessId es requerido.');
  }
  if (!cleanReason) {
    throw new Error('La razón del cambio es requerida.');
  }

  return clientUpdateBusinessAccessCallable({
    businessId: cleanBusinessId,
    status,
    reason: cleanReason,
    sessionToken,
  });
};
