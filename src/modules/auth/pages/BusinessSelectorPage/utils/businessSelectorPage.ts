import { getRoleLabelById } from '@/abilities/roles';
import type { MembershipStatus } from '@/types/models';
import type { AvailableBusinessContext } from '@/utils/auth-adapter';

import type { SubscriptionTone } from '../types';

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  suspended: 'Suspendido',
  revoked: 'Revocado',
  invited: 'Invitado',
};

const SUBSCRIPTION_LABELS: Record<string, string> = {
  none: 'Sin suscripcion',
  active: 'Activa',
  trialing: 'En prueba',
  scheduled: 'Programada',
  past_due: 'Pago pendiente',
  canceled: 'Cancelada',
  paused: 'Pausada',
  unpaid: 'Sin pago',
  deprecated: 'Deprecada',
};

const BLOCKED_SUBSCRIPTION_STATUSES = new Set([
  'past_due',
  'unpaid',
  'canceled',
  'paused',
  'deprecated',
]);

export const CREATE_BUSINESS_TOOLTIP =
  'Registra un nuevo negocio y asignalo a tu cuenta de pago.';

export const CREATE_BUSINESS_LOCKED_TOOLTIP =
  'Solo la cuenta owner puede crear nuevos negocios y consumir el limite del plan.';

export const getStatusLabel = (status?: MembershipStatus): string => {
  const key = String(status || 'active').toLowerCase();
  return STATUS_LABELS[key] || key;
};

export const toCleanString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
};

export const getSubscriptionStatusLabel = (status: string | null): string => {
  if (!status) return 'Sin estado';
  return SUBSCRIPTION_LABELS[status] || status;
};

export const getSubscriptionTone = (
  status: string | null,
): SubscriptionTone => {
  if (!status) return 'neutral';
  if (status === 'active') return 'success';
  if (status === 'trialing') return 'info';
  if (status === 'none' || status === 'scheduled') return 'warning';
  if (status === 'past_due' || status === 'unpaid') return 'warning';
  if (isSubscriptionStatusBlocked(status)) return 'danger';
  return 'neutral';
};

export const isSubscriptionStatusBlocked = (status: string): boolean =>
  BLOCKED_SUBSCRIPTION_STATUSES.has(status);

export const roleLabel = (role: string): string => {
  return getRoleLabelById(role) || role || 'Sin rol';
};

export const sortBusinesses = (
  items: AvailableBusinessContext[],
  activeBusinessId: string | null,
): AvailableBusinessContext[] => {
  return [...items].sort((a, b) => {
    if (a.businessId === activeBusinessId) return -1;
    if (b.businessId === activeBusinessId) return 1;
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
};

export const upsertBusiness = (
  businesses: AvailableBusinessContext[],
  incoming: AvailableBusinessContext,
): AvailableBusinessContext[] => {
  const byBusinessId = new Map(
    businesses.map((business) => [business.businessId, business]),
  );
  const existing = byBusinessId.get(incoming.businessId);

  byBusinessId.set(incoming.businessId, {
    businessId: incoming.businessId,
    name: incoming.name || existing?.name || `Negocio ${incoming.businessId}`,
    role: incoming.role || existing?.role || 'cashier',
    status: incoming.status || existing?.status || 'active',
    isActive:
      typeof incoming.isActive === 'boolean'
        ? incoming.isActive
        : (existing?.isActive ?? true),
  });

  return Array.from(byBusinessId.values());
};

export const resolveInviteErrorMessage = (error: unknown): string => {
  const typedError =
    error && typeof error === 'object'
      ? (error as { code?: string; message?: string })
      : null;
  const code = String(typedError?.code || '').toLowerCase();
  const message = String(typedError?.message || '').toLowerCase();

  if (code.includes('unauthenticated')) {
    return 'Tu sesion expiro. Inicia sesion nuevamente.';
  }
  if (
    code.includes('not-found') ||
    message.includes('codigo de invitacion invalido')
  ) {
    return 'El codigo no es valido. Revisa e intenta otra vez.';
  }
  if (code.includes('failed-precondition')) {
    if (message.includes('expirada')) {
      return 'El codigo ya expiro.';
    }
    if (message.includes('utilizada')) {
      return 'El codigo ya fue utilizado.';
    }
    return 'La invitacion ya no esta disponible.';
  }
  return 'No se pudo canjear el codigo. Intenta nuevamente.';
};

export const resolveBusinessSelectionErrorMessage = (
  error: unknown,
): string => {
  const typedError =
    error && typeof error === 'object'
      ? (error as { code?: string; message?: string })
      : null;
  const code = String(typedError?.code || '').toLowerCase();
  const rawMessage = String(typedError?.message || '').toLowerCase();

  if (
    code.includes('unauthenticated') ||
    code.includes('auth/') ||
    rawMessage.includes('session')
  ) {
    return 'Tu sesion expiro. Vuelve a iniciar sesion e intenta otra vez.';
  }

  if (
    code.includes('permission-denied') ||
    code.includes('forbidden') ||
    rawMessage.includes('permission')
  ) {
    return 'No tienes permisos para acceder a este negocio.';
  }

  if (
    code.includes('unavailable') ||
    code.includes('network') ||
    rawMessage.includes('network') ||
    rawMessage.includes('fetch')
  ) {
    return 'No pudimos cambiar el negocio por un problema de conexion. Intenta de nuevo.';
  }

  if (code.includes('failed-precondition') || rawMessage.includes('inactivo')) {
    return 'Este negocio no esta disponible en este momento.';
  }

  return 'No se pudo cambiar el negocio activo. Intenta nuevamente.';
};
