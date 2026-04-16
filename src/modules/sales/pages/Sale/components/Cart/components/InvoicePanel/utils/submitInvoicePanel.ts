import { notification } from 'antd';
import type { FormInstance } from 'antd';

import {
  lockTaxReceiptType,
  unlockTaxReceiptType,
} from '@/features/taxReceipt/taxReceiptSlice';
import { openProductStockSimple } from '@/features/productStock/productStockSimpleSlice';
import { getCashCountStrategy } from '@/notification/cashCountNotification/cashCountNotificacion';
import logInvoiceAuthorizations from '@/services/invoice/logInvoiceAuthorizations';
import type {
  InvoiceAttemptResult,
  InvoiceProcessParams,
  InvoiceServiceError,
} from '@/services/invoice/types';
import type { InvoiceData } from '@/types/invoice';
import type { TaxReceiptItem } from '@/types/taxReceipt';
import type { UserIdentity } from '@/types/users';
import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';
import { measure } from '@/utils/perf/measure';

import type { DocumentCurrencyContext } from '../components/Body/components/DocumentCurrencySelector';
import { calculateDueDate } from './calculateDueDate';
import { getInvoiceErrorNotification } from './getInvoiceErrorNotification';
import { getTaxReceiptAvailability } from './getTaxReceiptAvailability';
import { isTaxReceiptDepletedError } from './isTaxReceiptDepletedError';
import { validateInvoiceSubmissionGuards } from './validateInvoiceSubmissionGuards';

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
  idempotencyKey: string;
  insuranceAR: unknown;
  insuranceAuth: unknown;
  insuranceEnabled: boolean;
  invoiceComment: string | null;
  isTestMode: boolean;
  monetaryContext?: DocumentCurrencyContext | null;
  ncfType: string | null;
  resolvedBusinessId: string | null;
  runInvoice: (params: InvoiceProcessParams) => Promise<InvoiceAttemptResult>;
  setInvoice: (invoice: InvoiceData | null) => void;
  setLoading: (loading: LoadingState) => void;
  setSubmitted: (value: boolean) => void;
  setTaxReceiptModalOpen: (value: boolean) => void;
  shouldPrintInvoice: boolean;
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
  monetaryContext,
  ncfType,
  resolvedBusinessId,
  runInvoice,
  setInvoice,
  setLoading,
  setSubmitted,
  setTaxReceiptModalOpen,
  shouldPrintInvoice,
  taxReceiptData,
  taxReceiptEnabled,
  user,
}: SubmitInvoicePanelArgs) => {
  try {
    const effectiveTaxReceiptEnabled = taxReceiptEnabled;

    if (effectiveTaxReceiptEnabled) {
      const { depleted } = getTaxReceiptAvailability(taxReceiptData, ncfType);
      if (depleted) {
        setTaxReceiptModalOpen(true);
        dispatch(unlockTaxReceiptType());
        return;
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
      return;
    }

    const guardResult = await validateInvoiceSubmissionGuards({
      cart: monetaryContext ? { ...cart, ...monetaryContext } : cart,
      user,
    });

    if (!guardResult.ok) {
      dispatch(unlockTaxReceiptType());

      if (guardResult.code === 'cash-count') {
        getCashCountStrategy(
          guardResult.cashCountState,
          dispatch as Parameters<typeof getCashCountStrategy>[1],
        ).handleConfirm();
        return;
      }

      notification.warning({
        message: guardResult.message,
        description: guardResult.description,
        duration: 6,
      });
      dispatch(openProductStockSimple(guardResult.product));
      return;
    }

    setLoading({ status: true, message: '' });

    if (cart?.isAddedToReceivables) {
      await form.validateFields();
    }

    const dueDate = calculateDueDate(duePeriod, hasDueDate);
    const businessId = resolvedBusinessId;
    if (!businessId) {
      throw new Error(
        'No se encontró el negocio asociado para procesar la factura.',
      );
    }

    // Merge monetary context into cart so resolveRequestedMonetaryContext picks it up
    const effectiveCart = monetaryContext ? { ...cart, ...monetaryContext } : cart;

    console.info('[InvoicePanel] processInvoice -> started', {
      cartId: cart?.id ?? cart?.cartId ?? cart?.cartIdRef ?? null,
      businessId,
      userId: user?.uid ?? null,
      testMode: Boolean(isTestMode),
      taxReceiptEnabled: effectiveTaxReceiptEnabled,
      idempotencyKey,
      invoice: cart,
    });

    const invoiceResult = (await measure('processInvoice', () =>
      runInvoice({
        cart: effectiveCart,
        user,
        client,
        accountsReceivable,
        taxReceiptEnabled: effectiveTaxReceiptEnabled,
        ncfType: effectiveTaxReceiptEnabled ? ncfType : null,
        dueDate,
        insuranceEnabled,
        insuranceAR,
        insuranceAuth,
        invoiceComment,
        isTestMode,
        businessId,
        business,
        idempotencyKey,
      }),
    )) as InvoiceAttemptResult;
    const createdInvoice = (invoiceResult?.invoice ?? null) as InvoiceData | null;
    if (!createdInvoice) {
      throw new Error(
        'No se pudo recuperar la factura generada desde el backend.',
      );
    }

    if (invoiceResult?.status !== 'test-preview') {
      await logInvoiceAuthorizations({
        user,
        invoice: createdInvoice,
        authorizationContext: cart?.authorizationContext,
        cart,
      });
    }

    const invoiceStatus = invoiceResult?.status ?? null;
    const invoiceReused = Boolean(invoiceResult?.reused);

    if (invoiceReused) {
      notification.info({
        message: 'Factura reutilizada',
        description:
          'Detectamos que esta venta ya estaba en proceso y reutilizamos la factura existente para evitar duplicados.',
        duration: 6,
      });
    }

    if (invoiceStatus && invoiceStatus !== 'committed') {
      const statusMessages = {
        frontend_ready: {
          message: 'Factura en proceso',
          description:
            'Seguimos finalizando la factura en segundo plano. Los totales se actualizarán en breve.',
        },
        'test-preview': {
          message: 'Modo prueba activo',
          description:
            'Generamos una vista previa de la factura, pero no se guardó en la base de datos.',
        },
      };

      const info = statusMessages[invoiceStatus];
      notification.info({
        message: info?.message ?? 'Estado de factura',
        description:
          info?.description ??
          `La factura quedó en estado "${invoiceStatus}".`,
        duration: 6,
      });
    }

    console.info('[InvoicePanel] processInvoice -> completed', {
      invoiceId: createdInvoice?.id ?? invoiceResult?.invoiceId ?? null,
      status: invoiceResult?.status ?? null,
      reused: Boolean(invoiceResult?.reused),
      invoice: createdInvoice,
    });

    if (shouldPrintInvoice) {
      setInvoice(createdInvoice);
      await measure('handleInvoicePrinting', () =>
        handleInvoicePrinting(createdInvoice),
      );
      return;
    }

    setInvoice(null);
    handleAfterPrint();
  } catch (error) {
    const typedError = error as InvoiceServiceError;
    const taxReceiptDepleted = isTaxReceiptDepletedError(typedError);

    if (!taxReceiptDepleted) {
      const errorNotification = getInvoiceErrorNotification(typedError);
      notification.error({
        message: errorNotification.message,
        description: errorNotification.description,
        duration: errorNotification.duration ?? 6,
      });
    }

    setLoading({ status: false, message: '' });
    setSubmitted(false);

    console.error(
      '[InvoicePanel] processInvoice -> failed',
      {
        message: typedError?.message,
        code: typedError?.code,
        invoiceId:
          typedError?.invoiceId ??
          (typedError?.invoice &&
            typeof typedError.invoice === 'object' &&
            'id' in typedError.invoice
            ? (typedError.invoice as { id?: string }).id
            : null),
        idempotencyKey: typedError?.idempotencyKey ?? null,
        reused: typedError?.reused ?? null,
        failedTask: typedError?.failedTask ?? null,
        invoiceMeta: typedError?.invoiceMeta ?? null,
      },
      typedError,
    );

    dispatch(unlockTaxReceiptType());
    if (taxReceiptDepleted) {
      setTaxReceiptModalOpen(true);
    }
  }
};
