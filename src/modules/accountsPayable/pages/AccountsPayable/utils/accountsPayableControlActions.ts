import type { ManageVendorBillControlAction } from '@/firebase/purchase/fbManageVendorBillControl';

import type { AccountsPayableRow } from './accountsPayableDashboard';

export type AccountsPayableControlActionTone =
  | 'danger'
  | 'primary'
  | 'warning'
  | 'neutral';

export interface AccountsPayableControlActionDefinition {
  action: ManageVendorBillControlAction;
  confirmLabel: string;
  description: string;
  evidenceLabel: string;
  evidencePlaceholder: string;
  label: string;
  reasonLabel: string;
  reasonPlaceholder: string;
  requiresEvidence: boolean;
  title: string;
  tone: AccountsPayableControlActionTone;
}

const PAYMENT_ACTIVITY_THRESHOLD = 0.01;

const ACTION_DEFINITIONS: Record<
  ManageVendorBillControlAction,
  AccountsPayableControlActionDefinition
> = {
  approve: {
    action: 'approve',
    confirmLabel: 'Aprobar',
    description:
      'La cuenta por pagar quedará disponible para pago si no tiene hold o disputa activa.',
    evidenceLabel: 'Referencia de aprobación',
    evidencePlaceholder: 'Ej. Validado contra factura física y orden de compra',
    label: 'Aprobar para pago',
    reasonLabel: 'Motivo de aprobación',
    reasonPlaceholder: 'Ej. Factura y recepción validadas por contabilidad',
    requiresEvidence: true,
    title: 'Aprobar cuenta por pagar',
    tone: 'primary',
  },
  request_approval: {
    action: 'request_approval',
    confirmLabel: 'Enviar a aprobación',
    description:
      'La cuenta por pagar quedará bloqueada para pago hasta completar aprobación.',
    evidenceLabel: 'Referencia de revisión',
    evidencePlaceholder: 'Ej. Requiere revisión de gerencia por monto',
    label: 'Enviar a aprobación',
    reasonLabel: 'Motivo de solicitud',
    reasonPlaceholder: 'Ej. Requiere aprobación antes de pago por política',
    requiresEvidence: false,
    title: 'Enviar cuenta por pagar a aprobación',
    tone: 'neutral',
  },
  reject: {
    action: 'reject',
    confirmLabel: 'Rechazar',
    description:
      'La cuenta por pagar quedará bloqueada para pago hasta que se corrija o apruebe de nuevo.',
    evidenceLabel: 'Evidencia o referencia',
    evidencePlaceholder: 'Ej. Diferencia documentada en recepción R-124',
    label: 'Rechazar aprobación',
    reasonLabel: 'Motivo de rechazo',
    reasonPlaceholder: 'Ej. La factura no coincide con la recepción',
    requiresEvidence: true,
    title: 'Rechazar cuenta por pagar',
    tone: 'danger',
  },
  place_hold: {
    action: 'place_hold',
    confirmLabel: 'Poner en hold',
    description:
      'El pago quedará retenido hasta que otro usuario autorizado libere el hold.',
    evidenceLabel: 'Evidencia o referencia',
    evidencePlaceholder: 'Ej. Factura fiscal pendiente de entrega',
    label: 'Poner en hold',
    reasonLabel: 'Motivo del hold',
    reasonPlaceholder: 'Ej. Falta comprobante fiscal válido del proveedor',
    requiresEvidence: true,
    title: 'Poner cuenta por pagar en hold',
    tone: 'warning',
  },
  release_hold: {
    action: 'release_hold',
    confirmLabel: 'Liberar hold',
    description:
      'El hold se cerrará con trazabilidad y la cuenta podrá pagarse si está aprobada.',
    evidenceLabel: 'Referencia de liberación',
    evidencePlaceholder: 'Ej. Factura fiscal recibida y archivada',
    label: 'Liberar hold',
    reasonLabel: 'Motivo de liberación',
    reasonPlaceholder: 'Ej. Se recibió y validó la evidencia pendiente',
    requiresEvidence: true,
    title: 'Liberar hold de CxP',
    tone: 'primary',
  },
  open_dispute: {
    action: 'open_dispute',
    confirmLabel: 'Abrir disputa',
    description:
      'La cuenta por pagar quedará en disputa y no admitirá pagos hasta resolverla.',
    evidenceLabel: 'Evidencia o referencia',
    evidencePlaceholder: 'Ej. Diferencia de precio en línea 3 de la factura',
    label: 'Abrir disputa',
    reasonLabel: 'Motivo de disputa',
    reasonPlaceholder: 'Ej. Monto facturado no coincide con orden aprobada',
    requiresEvidence: true,
    title: 'Abrir disputa de CxP',
    tone: 'danger',
  },
  resolve_dispute: {
    action: 'resolve_dispute',
    confirmLabel: 'Resolver disputa',
    description:
      'La disputa se cerrará con trazabilidad y la cuenta volverá a su estado pagable si aplica.',
    evidenceLabel: 'Referencia de resolución',
    evidencePlaceholder: 'Ej. Nota de crédito recibida o factura corregida',
    label: 'Resolver disputa',
    reasonLabel: 'Motivo de resolución',
    reasonPlaceholder: 'Ej. El proveedor emitió factura corregida',
    requiresEvidence: true,
    title: 'Resolver disputa de CxP',
    tone: 'primary',
  },
  void: {
    action: 'void',
    confirmLabel: 'Anular CxP',
    description:
      'La cuenta por pagar quedará cerrada y no admitirá pagos ni nuevos controles.',
    evidenceLabel: 'Evidencia o referencia',
    evidencePlaceholder:
      'Ej. Factura duplicada, anulada por suplidor o acta AP-34',
    label: 'Anular CxP',
    reasonLabel: 'Motivo de anulación',
    reasonPlaceholder: 'Ej. Factura duplicada recibida del proveedor',
    requiresEvidence: true,
    title: 'Anular cuenta por pagar',
    tone: 'danger',
  },
};

export const getAccountsPayableControlActionDefinition = (
  action: ManageVendorBillControlAction,
) => ACTION_DEFINITIONS[action];

export const isAccountsPayableControlActionEvidenceRequired = (
  action: ManageVendorBillControlAction,
) => ACTION_DEFINITIONS[action].requiresEvidence;

export const getAccountsPayableControlActions = (
  row: AccountsPayableRow,
): AccountsPayableControlActionDefinition[] => {
  const status = row.paymentControl.status;
  const hasPaymentActivity =
    Number(row.paidAmount ?? 0) > PAYMENT_ACTIVITY_THRESHOLD ||
    Number(row.paymentCount ?? 0) > 0;
  const voidAction = hasPaymentActivity ? [] : [ACTION_DEFINITIONS.void];

  if (status === 'closed') {
    return [];
  }

  if (status === 'pending_approval') {
    return [
      ACTION_DEFINITIONS.approve,
      ACTION_DEFINITIONS.reject,
      ACTION_DEFINITIONS.place_hold,
      ACTION_DEFINITIONS.open_dispute,
      ...voidAction,
    ];
  }

  if (status === 'on_hold') {
    return [
      ACTION_DEFINITIONS.release_hold,
      ACTION_DEFINITIONS.open_dispute,
      ...voidAction,
    ];
  }

  if (status === 'disputed') {
    return [
      ACTION_DEFINITIONS.resolve_dispute,
      ACTION_DEFINITIONS.place_hold,
      ...voidAction,
    ];
  }

  return [
    ACTION_DEFINITIONS.request_approval,
    ACTION_DEFINITIONS.place_hold,
    ACTION_DEFINITIONS.open_dispute,
    ...voidAction,
  ];
};
