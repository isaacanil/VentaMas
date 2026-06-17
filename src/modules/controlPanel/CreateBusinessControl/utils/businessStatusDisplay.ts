export type BusinessStatusDisplayTone = 'ok' | 'warn' | 'danger' | 'neutral';

type BusinessStatusDisplay = {
  label: string;
  tone: BusinessStatusDisplayTone;
};

type BusinessAccessStatusDisplayOptions = {
  includeLegacyStatusLabels?: boolean;
};

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: 'Activa',
  trialing: 'En prueba',
  past_due: 'Pago pendiente',
  canceled: 'Cancelada',
  paused: 'Pausada',
  unpaid: 'Sin pago',
};

const BUSINESS_ACCESS_ACTION_STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  read_only: 'Solo lectura',
  suspended: 'Suspendido',
  inactive: 'Inactivo',
  offboarded: 'Offboarding',
  closed: 'Cerrado',
};

const BUSINESS_ACCESS_STATUS_LABELS: Record<string, string> = {
  ...BUSINESS_ACCESS_ACTION_STATUS_LABELS,
  disabled: 'Deshabilitado',
  blocked: 'Bloqueado',
};

export const getBusinessSubscriptionStatusDisplay = (
  status?: string | null,
): BusinessStatusDisplay => {
  if (!status) {
    return {
      label: 'Sin suscripción',
      tone: 'neutral',
    };
  }

  if (status === 'active') {
    return {
      label: SUBSCRIPTION_STATUS_LABELS[status],
      tone: 'ok',
    };
  }

  if (status === 'trialing' || status === 'past_due' || status === 'unpaid') {
    return {
      label: SUBSCRIPTION_STATUS_LABELS[status] || status,
      tone: 'warn',
    };
  }

  if (status === 'canceled') {
    return {
      label: SUBSCRIPTION_STATUS_LABELS[status],
      tone: 'danger',
    };
  }

  return {
    label: SUBSCRIPTION_STATUS_LABELS[status] || status,
    tone: 'neutral',
  };
};

export const getBusinessAccessStatusDisplay = (
  status?: string | null,
  { includeLegacyStatusLabels = true }: BusinessAccessStatusDisplayOptions = {},
): BusinessStatusDisplay => {
  const accessStatusLabels = includeLegacyStatusLabels
    ? BUSINESS_ACCESS_STATUS_LABELS
    : BUSINESS_ACCESS_ACTION_STATUS_LABELS;

  if (!status || status === 'active') {
    return {
      label: accessStatusLabels.active,
      tone: 'ok',
    };
  }

  if (status === 'read_only') {
    return {
      label: accessStatusLabels[status],
      tone: 'warn',
    };
  }

  if (
    status === 'suspended' ||
    status === 'inactive' ||
    status === 'offboarded' ||
    status === 'closed' ||
    status === 'disabled' ||
    status === 'blocked'
  ) {
    return {
      label: accessStatusLabels[status] || status,
      tone: 'danger',
    };
  }

  return {
    label: accessStatusLabels[status] || status,
    tone: 'neutral',
  };
};
