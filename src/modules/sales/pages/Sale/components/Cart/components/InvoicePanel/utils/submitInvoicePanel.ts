import { notification } from 'antd';
import type { FormInstance } from 'antd';

import {
  lockTaxReceiptType,
  unlockTaxReceiptType,
} from '@/features/taxReceipt/taxReceiptSlice';
import { openProductStockSimple } from '@/features/productStock/productStockSimpleSlice';
import { getCashCountStrategy } from '@/features/UserNotification/cashCountNotification';
import logInvoiceAuthorizations from '@/services/invoice/logInvoiceAuthorizations';
import type {
  InvoiceAttemptResult,
  InvoiceProgressStage,
  InvoiceProcessParams,
  InvoiceServiceError,
} from '@/services/invoice/types';
import type { ServiceCommissionsBillingSettings } from '@/domain/commissions/types';
import type { InvoiceData } from '@/types/invoice';
import type { TaxReceiptItem } from '@/types/taxReceipt';
import type { UserIdentity } from '@/types/users';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';
import { resolveBusinessFiscalRollout } from '@/utils/fiscal/fiscalRollout';
import { getTaxReceiptAvailability } from '@/utils/taxReceipt';

import type { DocumentCurrencyContext } from '../components/Body/components/DocumentCurrencySelector';
import { calculateDueDate } from './calculateDueDate';
import { getInvoiceErrorNotification } from './getInvoiceErrorNotification';
import {
  buildInvoiceSubmitTraceContext,
  measureInvoiceSubmitPhase,
  traceInvoiceProcessPhase,
  traceInvoiceSubmitPhase,
} from './invoiceSubmitTrace';
import { isTaxReceiptDepletedError } from './isTaxReceiptDepletedError';
import { resolveInvoiceAccountsReceivable } from './resolveInvoiceAccountsReceivable';
import {
  validateInvoiceSubmissionGuards,
  type InvoiceSubmissionGuardsResult,
} from './validateInvoiceSubmissionGuards';

type BusinessLike = {
  id?: string | null;
  businessID?: string | null;
  businessId?: string | null;
  [key: string]: unknown;
};

type LoadingState = {
  status: boolean;
  message: string;
};

const INVOICE_PROGRESS_MESSAGES: Record<InvoiceProgressStage, string> = {
  'validating-sale': 'Validando venta',
  'registering-sale': 'Registrando venta',
  'confirming-invoice': 'Confirmando factura',
  'preparing-receipt': 'Preparando comprobante/impresión',
};

const INVOICE_STATUS_MESSAGES: Record<
  string,
  { message: string; description: string }
> = {
  frontend_ready: {
    message: 'Factura lista para imprimir',
    description:
      'La factura está lista para imprimir mientras se completan tareas finales en segundo plano.',
  },
  print_ready: {
    message: 'Factura lista para imprimir',
    description:
      'La factura está lista para imprimir mientras se completan tareas finales en segundo plano.',
  },
  print_ready_with_review: {
    message: 'Factura lista para imprimir con revisión pendiente',
    description:
      'Puedes imprimir la factura, pero quedó marcada para revisión operativa en el historial.',
  },
  'test-preview': {
    message: 'Modo prueba activo',
    description:
      'Generamos una vista previa de la factura, pero no se guardó en la base de datos.',
  },
};

type InvoiceSubmissionGuardFailure = Extract<
  InvoiceSubmissionGuardsResult,
  { ok: false }
>;

const DGII_CONSUMER_FINAL_DETAIL_THRESHOLD = 250000;
const GENERIC_CLIENT_IDS = new Set(['GC-0000']);
const GENERIC_CLIENT_NAMES = new Set(['GENERIC CLIENT', 'CLIENTE GENERICO']);

const isInvoiceSubmissionGuardFailure = (
  result: InvoiceSubmissionGuardsResult,
): result is InvoiceSubmissionGuardFailure => result.ok === false;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const stripAccents = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const normalizeToken = (value: unknown) =>
  stripAccents(value)
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ');

const resolveFiscalDocumentType = (value: unknown): string | null => {
  const token = normalizeToken(value);
  if (!token) return null;

  const compact = token.replace(/\s+/g, '');
  if (compact.startsWith('B01') || compact.startsWith('E31')) return 'E31';
  if (compact.startsWith('B02') || compact.startsWith('E32')) return 'E32';
  if (compact.startsWith('B15') || compact.startsWith('E45')) return 'E45';
  if (token.includes('CONSUMIDOR') || token.includes('CONSUMER')) return 'E32';
  if (token.includes('CREDITO FISCAL') || token.includes('TAX CREDIT')) {
    return 'E31';
  }
  if (token.includes('GUBERNAMENTAL') || token.includes('GOVERNMENT')) {
    return 'E45';
  }

  return null;
};

const resolveNumberFromValue = (value: unknown): number | null => {
  return safeNumber(asRecord(value).value);
};

const resolveCartTotal = (cart: Record<string, unknown>): number | null =>
  resolveNumberFromValue(cart.totalPurchase);

const resolveClientIdentificationNumber = (
  client: Record<string, unknown> | null,
): string | null => {
  const clientRecord = asRecord(client);
  const identification = asRecord(clientRecord.identification);

  return (
    toCleanString(clientRecord.rnc) ??
    toCleanString(clientRecord.RNC) ??
    toCleanString(clientRecord.personalID) ??
    toCleanString(clientRecord.personalId) ??
    toCleanString(clientRecord.cedula) ??
    toCleanString(clientRecord.identificationNumber) ??
    toCleanString(clientRecord.taxId) ??
    toCleanString(identification.number) ??
    null
  );
};

const hasFiscalClientIdentity = (
  client: Record<string, unknown> | null,
): boolean => {
  const clientRecord = asRecord(client);
  const clientId = toCleanString(clientRecord.id);
  if (!clientId || GENERIC_CLIENT_IDS.has(clientId.toUpperCase())) {
    return false;
  }

  const clientName = normalizeToken(clientRecord.name);
  if (GENERIC_CLIENT_NAMES.has(clientName)) return false;

  return Boolean(resolveClientIdentificationNumber(client));
};

const requiresFiscalClientIdentity = ({
  cart,
  ncfType,
}: {
  cart: Record<string, unknown>;
  ncfType: string;
}): boolean => {
  const documentType = resolveFiscalDocumentType(ncfType);
  const total = resolveCartTotal(cart);

  if (
    documentType === 'E32' &&
    total !== null &&
    total < DGII_CONSUMER_FINAL_DETAIL_THRESHOLD
  ) {
    return false;
  }

  return true;
};

const toInvoiceRecord = (
  value: unknown,
): NonNullable<InvoiceProcessParams['insuranceAR']> | null => {
  if (!value || typeof value !== 'object') return null;
  return value as NonNullable<InvoiceProcessParams['insuranceAR']>;
};

interface SubmitInvoicePanelArgs {
  accountsReceivable: AccountsReceivableDoc | Record<string, unknown>;
  business: BusinessLike;
  cart: Record<string, unknown>;
  client: Record<string, unknown> | null;
  dispatch: (action: unknown) => void;
  duePeriod: unknown;
  form: FormInstance;
  handleAfterPrint: () => void;
  handleInvoicePrinting: (invoice: InvoiceData) => Promise<void>;
  hasDueDate: boolean;
  idempotencyKey?: string;
  insuranceAR: unknown;
  insuranceAuth: unknown;
  insuranceEnabled: boolean;
  invoiceComment: string | null;
  isTestMode: boolean;
  buildIdempotencyKey?: (payload: {
    dueDate: number | null;
    effectiveAccountsReceivable: unknown;
    effectiveCart: unknown;
  }) => string;
  monetaryContext?: DocumentCurrencyContext | null;
  ncfType: string | null;
  onIdempotencyConflict?: () => void;
  resolvedBusinessId: string | null;
  runInvoice: (params: InvoiceProcessParams) => Promise<InvoiceAttemptResult>;
  setInvoice: (invoice: InvoiceData | null) => void;
  setLoading: (loading: LoadingState) => void;
  setSubmitted: (value: boolean) => void;
  setTaxReceiptModalOpen: (value: boolean) => void;
  shouldPrintInvoice: boolean;
  serviceCommissions?: ServiceCommissionsBillingSettings | null;
  taxReceiptData: TaxReceiptItem[] | null | undefined;
  taxReceiptEnabled: boolean;
  user: UserIdentity | null;
}

export const submitInvoicePanel = async ({
  accountsReceivable,
  business,
  cart,
  client,
  dispatch,
  duePeriod,
  form,
  handleAfterPrint,
  handleInvoicePrinting,
  hasDueDate,
  idempotencyKey,
  insuranceAR,
  insuranceAuth,
  insuranceEnabled,
  invoiceComment,
  isTestMode,
  buildIdempotencyKey,
  monetaryContext,
  ncfType,
  onIdempotencyConflict,
  resolvedBusinessId,
  runInvoice,
  setInvoice,
  setLoading,
  setSubmitted,
  setTaxReceiptModalOpen,
  shouldPrintInvoice,
  serviceCommissions,
  taxReceiptData,
  taxReceiptEnabled,
  user,
}: SubmitInvoicePanelArgs) => {
  const setProgress = (stage: InvoiceProgressStage) => {
    setLoading({ status: true, message: INVOICE_PROGRESS_MESSAGES[stage] });
  };
  const clearProgress = () => {
    setLoading({ status: false, message: '' });
  };
  let traceContext: ReturnType<typeof buildInvoiceSubmitTraceContext> | null =
    null;

  try {
    setProgress('validating-sale');

    const effectiveTaxReceiptEnabled = taxReceiptEnabled;
    const electronicTaxReceiptModelEnabled =
      resolveBusinessFiscalRollout(business).electronicModelEnabled;
    const selectedNcfType = typeof ncfType === 'string' ? ncfType.trim() : '';
    traceContext = buildInvoiceSubmitTraceContext({
      cart,
      client,
      electronicTaxReceiptModelEnabled,
      isTestMode,
      monetaryContext,
      serviceCommissions,
      shouldPrintInvoice,
      taxReceiptEnabled: effectiveTaxReceiptEnabled,
    });

    traceInvoiceSubmitPhase('inicio', 'started', traceContext);
    traceInvoiceSubmitPhase('validaciones previas', 'started', traceContext);

    if (!Array.isArray(cart?.products) || cart.products.length === 0) {
      notification.warning({
        message: 'Venta sin productos',
        description:
          'Agrega al menos un producto al carrito antes de completar la factura.',
        duration: 5,
      });
      dispatch(unlockTaxReceiptType());
      clearProgress();
      traceInvoiceSubmitPhase('validaciones previas', 'blocked', traceContext, {
        reason: 'empty-cart',
      });
      return;
    }

    if (effectiveTaxReceiptEnabled) {
      if (!selectedNcfType) {
        notification.warning({
          message: 'Comprobante requerido',
          description:
            'Selecciona el tipo de comprobante fiscal antes de completar la venta.',
          duration: 6,
        });
        dispatch(unlockTaxReceiptType());
        clearProgress();
        traceInvoiceSubmitPhase('validaciones previas', 'blocked', traceContext, {
          reason: 'missing-tax-receipt-type',
        });
        return;
      }

      if (
        requiresFiscalClientIdentity({
          cart,
          ncfType: selectedNcfType,
        }) &&
        !hasFiscalClientIdentity(client)
      ) {
        notification.warning({
          message: 'Cliente fiscal requerido',
          description:
            'Selecciona o crea un cliente con RNC o cedula antes de completar este comprobante.',
          duration: 6,
        });
        dispatch(unlockTaxReceiptType());
        clearProgress();
        traceInvoiceSubmitPhase('validaciones previas', 'blocked', traceContext, {
          reason: 'missing-fiscal-client',
        });
        return;
      }

      if (!electronicTaxReceiptModelEnabled) {
        const { depleted } = getTaxReceiptAvailability(
          taxReceiptData,
          selectedNcfType,
        );
        if (depleted) {
          setTaxReceiptModalOpen(true);
          dispatch(unlockTaxReceiptType());
          clearProgress();
          traceInvoiceSubmitPhase('validaciones previas', 'blocked', traceContext, {
            reason: 'tax-receipt-depleted',
          });
          return;
        }
      }

      dispatch(lockTaxReceiptType());
    } else {
      dispatch(unlockTaxReceiptType());
    }

    if (monetaryContext?.blockedReason) {
      notification.warning({
        message: 'Moneda del documento no disponible todavía',
        description: monetaryContext.blockedReason,
        duration: 6,
      });
      dispatch(unlockTaxReceiptType());
      clearProgress();
      traceInvoiceSubmitPhase('validaciones previas', 'blocked', traceContext, {
        reason: 'document-currency-blocked',
      });
      return;
    }

    const guardResult = await validateInvoiceSubmissionGuards({
      cart: monetaryContext ? { ...cart, ...monetaryContext } : cart,
      serviceCommissions,
      user,
    });

    if (isInvoiceSubmissionGuardFailure(guardResult)) {
      dispatch(unlockTaxReceiptType());
      clearProgress();
      traceInvoiceSubmitPhase('validaciones previas', 'blocked', traceContext, {
        reason: guardResult.code,
      });

      if (guardResult.code === 'cash-count') {
        getCashCountStrategy(
          guardResult.cashCountState as Parameters<
            typeof getCashCountStrategy
          >[0],
          dispatch as Parameters<typeof getCashCountStrategy>[1],
        ).handleConfirm();
        return;
      }

      notification.warning({
        message: guardResult.message,
        description: guardResult.description,
        duration: 6,
      });
      if (guardResult.code === 'physical-selection') {
        dispatch(
          openProductStockSimple({
            product: guardResult.product,
            initialStocks: guardResult.availableStocks,
          }),
        );
      }
      return;
    }

    if (cart?.isAddedToReceivables) {
      await form.validateFields();
    }

    const dueDate = calculateDueDate(duePeriod, hasDueDate);
    const businessId = resolvedBusinessId;
    if (!businessId) {
      traceInvoiceSubmitPhase('validaciones previas', 'failed', traceContext, {
        reason: 'missing-business-id',
      });
      throw new Error(
        'No se encontró el negocio asociado para procesar la factura.',
      );
    }

    // Merge monetary context into cart so resolveRequestedMonetaryContext picks it up
    const effectiveCart = monetaryContext
      ? { ...cart, ...monetaryContext }
      : cart;

    traceInvoiceSubmitPhase('validaciones previas', 'completed', traceContext, {
      businessResolved: true,
      hasDueDate: Boolean(dueDate),
      taxReceiptSelected: Boolean(selectedNcfType),
    });

    const effectiveAccountsReceivable = cart?.isAddedToReceivables
      ? resolveInvoiceAccountsReceivable({
          accountsReceivable,
          cart,
        })
      : accountsReceivable;
    const resolvedIdempotencyKey =
      buildIdempotencyKey?.({
        dueDate,
        effectiveAccountsReceivable,
        effectiveCart,
      }) || idempotencyKey;

    if (!resolvedIdempotencyKey) {
      throw new Error('No se pudo preparar la llave segura de facturación.');
    }

    setProgress('registering-sale');

    const invoiceResult = (await runInvoice({
      cart: effectiveCart,
      user,
      client,
      accountsReceivable: effectiveAccountsReceivable,
      taxReceiptEnabled: effectiveTaxReceiptEnabled,
      ncfType: effectiveTaxReceiptEnabled ? selectedNcfType : null,
      dueDate,
      insuranceEnabled,
      insuranceAR: toInvoiceRecord(insuranceAR),
      insuranceAuth,
      invoiceComment,
      isTestMode,
      businessId,
      business,
      idempotencyKey: resolvedIdempotencyKey,
      onProgress: setProgress,
      onPhaseTrace: (trace) => traceInvoiceProcessPhase(trace, traceContext),
    })) as InvoiceAttemptResult;
    const createdInvoice = (invoiceResult?.invoice ??
      null) as InvoiceData | null;
    if (!createdInvoice) {
      throw new Error(
        'No se pudo recuperar la factura generada desde el backend.',
      );
    }

    const invoiceStatus = invoiceResult?.status ?? null;
    const invoiceReused = Boolean(invoiceResult?.reused);

    if (invoiceStatus === 'pending') {
      setInvoice(null);
      notification.info({
        message: 'Factura pendiente de confirmación',
        description:
          'La venta fue recibida, pero todavía no hay factura confirmada. Mantuvimos el carrito abierto para evitar perder la venta.',
        duration: 8,
      });
      clearProgress();
      setSubmitted(false);
      dispatch(unlockTaxReceiptType());
      traceInvoiceSubmitPhase('impresion', 'skipped', traceContext, {
        reason: 'invoice-pending',
      });
      traceInvoiceSubmitPhase('cleanup', 'deferred', traceContext, {
        reason: 'invoice-pending',
      });
      return;
    }

    setProgress('preparing-receipt');

    if (invoiceResult?.status !== 'test-preview') {
      await logInvoiceAuthorizations({
        user,
        invoice: createdInvoice,
        authorizationContext: cart?.authorizationContext,
        cart,
      });
    }

    if (invoiceReused) {
      notification.info({
        message: 'Factura reutilizada',
        description:
          'Detectamos que esta venta ya estaba en proceso y reutilizamos la factura existente para evitar duplicados.',
        duration: 6,
      });
    }

    if (invoiceStatus && invoiceStatus !== 'committed') {
      const info = INVOICE_STATUS_MESSAGES[invoiceStatus];
      notification.info({
        message: info?.message ?? 'Estado de factura',
        description:
          info?.description ?? `La factura quedó en estado "${invoiceStatus}".`,
        duration: 6,
      });
    }

    if (shouldPrintInvoice) {
      setInvoice(createdInvoice);
      await measureInvoiceSubmitPhase('impresion', traceContext, () =>
        handleInvoicePrinting(createdInvoice),
        {
          invoiceStatus,
          reused: invoiceReused,
        },
      );
      traceInvoiceSubmitPhase('cleanup', 'deferred', traceContext, {
        reason: 'after-print-callback',
      });
      return;
    }

    traceInvoiceSubmitPhase('impresion', 'skipped', traceContext, {
      reason: 'print-disabled',
    });
    await measureInvoiceSubmitPhase('cleanup', traceContext, () => {
      setInvoice(null);
      handleAfterPrint();
    });
  } catch (error) {
    const typedError = error as InvoiceServiceError;
    const taxReceiptDepleted = isTaxReceiptDepletedError(typedError);
    const normalizedErrorCode =
      typeof typedError?.code === 'string'
        ? typedError.code.replace(/^functions\//, '')
        : null;

    if (normalizedErrorCode === 'already-exists') {
      onIdempotencyConflict?.();
    }

    if (!taxReceiptDepleted) {
      const errorNotification = getInvoiceErrorNotification(typedError);
      notification.error({
        message: errorNotification.message,
        description: errorNotification.description,
        duration: errorNotification.duration ?? 6,
      });
    }

    if (traceContext) {
      traceInvoiceSubmitPhase('cleanup', 'started', traceContext, {
        reason: 'error',
      });
    }

    clearProgress();
    setSubmitted(false);

    if (traceContext) {
      traceInvoiceSubmitPhase('cleanup', 'completed', traceContext, {
        reason: 'error',
        taxReceiptDepleted,
      });
    }

    const failedTask =
      typedError?.failedTask && typeof typedError.failedTask === 'object'
        ? (typedError.failedTask as Record<string, unknown>)
        : null;
    const invoiceIdFromError =
      typedError?.invoiceId ??
      (typedError?.invoice &&
      typeof typedError.invoice === 'object' &&
      'id' in typedError.invoice
        ? (typedError.invoice as { id?: string }).id
        : null);

    console.error(
      '[InvoicePanel] processInvoice -> failed',
      {
        code: typedError?.code ?? null,
        errorName: typedError?.name ?? null,
        failedTaskType:
          typeof failedTask?.type === 'string' ? failedTask.type : null,
        hasIdempotencyKey: Boolean(typedError?.idempotencyKey),
        hasInvoiceId: Boolean(invoiceIdFromError),
        hasInvoiceMeta: Boolean(typedError?.invoiceMeta),
        reused: typedError?.reused ?? null,
        taxReceiptDepleted,
      },
    );

    dispatch(unlockTaxReceiptType());
    if (taxReceiptDepleted) {
      setTaxReceiptModalOpen(true);
    }
  }
};
