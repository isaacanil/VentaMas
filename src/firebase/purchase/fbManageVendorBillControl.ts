import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';
import type {
  VendorBillApprovalStatus,
  VendorBillControlAction,
  VendorBillControlState,
  VendorBillStatus,
} from '@/domain/accountsPayable/vendorBills/types';
import type { UserIdentity } from '@/types/users';

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export type ManageVendorBillControlAction = VendorBillControlAction;

export interface ManageVendorBillControlInput {
  action: ManageVendorBillControlAction;
  businessId?: string | null;
  evidenceNote?: string | null;
  evidenceUrls?: string[] | null;
  purchaseId?: string | null;
  reason?: string | null;
  vendorBillId?: string | null;
}

export interface ManageVendorBillControlResult {
  ok: boolean;
  action: ManageVendorBillControlAction;
  businessId: string;
  vendorBillId: string;
  purchaseId: string;
  controlEventId: string;
  status: VendorBillStatus;
  approvalStatus: VendorBillApprovalStatus | null;
  paymentHold?: VendorBillControlState | null;
  dispute?: VendorBillControlState | null;
  control?: {
    approvalStatus?: VendorBillApprovalStatus | null;
    paymentHold?: VendorBillControlState | null;
    dispute?: VendorBillControlState | null;
    status?: VendorBillStatus | null;
  } | null;
}

type ManageVendorBillControlPayload = {
  action: ManageVendorBillControlAction;
  businessId: string;
  evidenceNote?: string | null;
  evidenceUrls?: string[];
  purchaseId?: string | null;
  reason: string;
  sessionToken?: string;
  vendorBillId?: string | null;
};

const CONTROL_EVIDENCE_REQUIRED_ACTIONS =
  new Set<ManageVendorBillControlAction>([
    'approve',
    'reject',
    'place_hold',
    'release_hold',
    'open_dispute',
    'resolve_dispute',
    'void',
  ]);

const manageVendorBillControlCallable = createFirebaseCallable<
  ManageVendorBillControlPayload,
  ManageVendorBillControlResult
>('manageVendorBillControl');

export const fbManageVendorBillControl = async (
  user: UserIdentity | null | undefined,
  input: ManageVendorBillControlInput,
): Promise<ManageVendorBillControlResult> => {
  const businessId =
    toCleanString(input.businessId) ??
    user?.businessID ??
    user?.businessId ??
    user?.activeBusinessId ??
    null;
  const vendorBillId = toCleanString(input.vendorBillId);
  const purchaseId = toCleanString(input.purchaseId);
  const reason = toCleanString(input.reason);
  const evidenceNote = toCleanString(input.evidenceNote);
  const evidenceUrls = (
    Array.isArray(input.evidenceUrls) ? input.evidenceUrls : []
  )
    .map((entry) => toCleanString(entry))
    .filter(Boolean) as string[];

  if (!businessId) {
    throw new Error(
      'No hay negocio activo para actualizar la cuenta por pagar.',
    );
  }
  if (!vendorBillId && !purchaseId) {
    throw new Error('Debe indicar una cuenta por pagar o compra válida.');
  }
  if (!reason || reason.length < 5) {
    throw new Error('Debe indicar un motivo con al menos 5 caracteres.');
  }
  if (
    CONTROL_EVIDENCE_REQUIRED_ACTIONS.has(input.action) &&
    !evidenceNote &&
    evidenceUrls.length === 0
  ) {
    throw new Error(
      'Debe indicar una evidencia o referencia para este control de CxP.',
    );
  }

  const { sessionToken } = getStoredSession();
  const result = await manageVendorBillControlCallable({
    action: input.action,
    businessId,
    vendorBillId,
    purchaseId,
    reason,
    evidenceNote: evidenceNote ?? null,
    evidenceUrls,
    ...(sessionToken ? { sessionToken } : {}),
  });

  if (!result?.ok) {
    throw new Error('No se pudo actualizar el control de CxP.');
  }

  return result;
};
