import type { CashCountState } from '@/utils/cashCount/types';
import type { InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';

import { getActiveApprovedAuthorizationForInvoice } from '@/firebase/authorizations/invoiceEditAuthorizations';
import { fbGetCashCountState } from '@/firebase/cashCount/fbCashCountStatus';

export type AuthorizationRequest = Record<string, unknown>;

type CashCountStatusResult = {
  exists: boolean;
  state: CashCountState | null;
};

type ResolveInvoiceEditAuthorizationParams = {
  invoice: InvoiceData;
  isOlderThan48h: boolean;
  user: UserIdentity | null;
};

export type InvoiceEditAuthorizationOutcome =
  | {
      type: 'approved';
      authorization: AuthorizationRequest;
    }
  | {
      type: 'blocked';
      message: string;
    }
  | {
      type: 'request-required';
      reasons: string[];
    };

export const MAX_EDIT_WINDOW_SECONDS = 48 * 60 * 60;

const extractTimestampSeconds = (value: unknown) => {
  if (!value) return null;
  if (typeof value === 'number') {
    return value > 1e12 ? value / 1000 : value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return null;
    return parsed > 1e12 ? parsed / 1000 : parsed;
  }
  if (value instanceof Date) {
    return value.getTime() / 1000;
  }
  if (typeof value === 'object' && value !== null) {
    const record = value as { seconds?: unknown; toMillis?: unknown };
    if (typeof record.seconds === 'number') {
      return record.seconds;
    }
    if (typeof record.toMillis === 'function') {
      return (record.toMillis as () => number)() / 1000;
    }
  }
  return null;
};

export const resolveInvoiceTimestamp = (invoice: InvoiceData | null | undefined) =>
  extractTimestampSeconds(invoice?.date) ??
  extractTimestampSeconds(invoice?.createdAt) ??
  extractTimestampSeconds(invoice?.created_at) ??
  extractTimestampSeconds(invoice?.created);

const buildValidationFailures = ({
  isOlderThan48h,
  hasCashCount,
  cashCountInfo,
}: {
  isOlderThan48h: boolean;
  hasCashCount: boolean;
  cashCountInfo: CashCountStatusResult | null;
}) => {
  const reasons = [];
  if (isOlderThan48h) {
    reasons.push(
      'La factura supera el límite de 48 horas para solicitar la edición.',
    );
  }

  if (!hasCashCount) {
    return reasons;
  }

  if (!cashCountInfo) {
    reasons.push(
      'No se pudo verificar el estado del cuadre de caja relacionado.',
    );
    return reasons;
  }

  if (!cashCountInfo.exists) {
    reasons.push('No se encontró el cuadre de caja relacionado.');
    return reasons;
  }

  if (cashCountInfo.state && cashCountInfo.state !== 'open') {
    if (cashCountInfo.state === 'closed') {
      reasons.push('El cuadre de caja relacionado ya está cerrado.');
    } else {
      reasons.push('El cuadre de caja relacionado no está abierto.');
    }
  }

  return reasons;
};

const buildRequestReasons = () => [
  'Se requiere autorización de un supervisor para editar esta factura.',
  'La solicitud será revisada desde la pantalla de autorizaciones.',
];

export async function resolveInvoiceEditAuthorization({
  invoice,
  isOlderThan48h,
  user,
}: ResolveInvoiceEditAuthorizationParams): Promise<InvoiceEditAuthorizationOutcome> {
  const cashCountIdRaw = invoice?.cashCountId ?? invoice?.cashCountID ?? null;
  const cashCountId =
    typeof cashCountIdRaw === 'string' && cashCountIdRaw.trim()
      ? cashCountIdRaw
      : null;
  const hasCashCount = Boolean(cashCountId);
  let cashCountInfo: CashCountStatusResult | null = null;

  if (cashCountId && user?.businessID) {
    try {
      cashCountInfo = await fbGetCashCountState(user, cashCountId);
    } catch (statusError) {
      console.warn(
        'No se pudo verificar el estado del cuadre de caja',
        statusError,
      );
      cashCountInfo = null;
    }
  }

  const validationFailures = buildValidationFailures({
    isOlderThan48h,
    hasCashCount,
    cashCountInfo,
  });

  const approved = (await getActiveApprovedAuthorizationForInvoice(
    user,
    invoice,
  )) as AuthorizationRequest | null;

  if (approved) {
    return {
      type: 'approved',
      authorization: approved,
    };
  }

  if (validationFailures.length) {
    return {
      type: 'blocked',
      message: `No puedes solicitar la edición de esta factura. ${validationFailures.join(' ')}`,
    };
  }

  return {
    type: 'request-required',
    reasons: buildRequestReasons(),
  };
}
