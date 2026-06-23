import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { printFrozenPaginatedDocument } from '@/components/DocumentPagination/browser';
import type { PaginationRuntimeState } from '@/components/DocumentPagination';
import { FiscalDocumentPagination } from '@/modules/invoice/public';
import type { InvoiceBusinessInfo, InvoiceData } from '@/types/invoice';

import * as Styles from './PaginatedInvoicePrintHost.styles';
import {
  formatPaginatedPrintFallbackReason,
  type PaginatedPrintFallbackCode,
} from './paginatedPrintFallbackReason';

type RuntimeStateSnapshot = {
  invoiceKey: string;
  state: PaginationRuntimeState;
};

type PaginatedInvoicePrintHostProps = {
  business?: InvoiceBusinessInfo | null;
  invoice?: InvoiceData | null;
  onPrintBlocked: (reason: string) => void;
  onPrinted: () => void;
  pending: boolean;
  printFrozenDocument?: typeof printFrozenPaginatedDocument;
  readyTimeoutMs?: number;
};

const PRINT_READY_TIMEOUT_MS = 4_000;
const PRINT_TIMEOUT_RESULT = 'timeout' as const;

const createInvoiceKey = (invoice: InvoiceData | null | undefined) => {
  if (!invoice) return null;
  return String(invoice.id ?? invoice.numberID ?? invoice.NCF ?? 'pending');
};

const hasBlockingState = (state: PaginationRuntimeState) =>
  (state.chromeOverflowRoles.length > 0 ||
    state.duplicateBlockIds.length > 0 ||
    state.overflowBlockIds.length > 0 ||
    state.unmeasuredBlockIds.length > 0);

const hasTerminalBlockingState = (state: PaginationRuntimeState) =>
  state.measured &&
  state.stable &&
  !state.readyToPrint &&
  hasBlockingState(state);

const canPrintFrozenDocument = (state: PaginationRuntimeState) =>
  state.readyToPrint ||
  (state.measured && state.pageCount > 0 && !hasBlockingState(state));

const isSourceReadyForStrictPrint = (
  source: HTMLElement,
  state: PaginationRuntimeState,
) =>
  !state.readyToPrint || source.dataset.printPaginationReady === 'true';

const resolveFallbackReason = (
  code: PaginatedPrintFallbackCode,
  state?: PaginationRuntimeState | null,
  detail?: string | null,
) => {
  const stateReason = formatPaginatedPrintFallbackReason({ code, state });
  return detail ? `${stateReason}; ${detail}` : stateReason;
};

const waitForFrozenPrintResult = async (
  printPromise: Promise<boolean>,
  timeoutMs: number,
) => {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<typeof PRINT_TIMEOUT_RESULT>((resolve) => {
    timeoutId = window.setTimeout(() => resolve(PRINT_TIMEOUT_RESULT), timeoutMs);
  });

  try {
    return await Promise.race([printPromise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  }
};

export const PaginatedInvoicePrintHost = ({
  business,
  invoice,
  onPrintBlocked,
  onPrinted,
  pending,
  printFrozenDocument = printFrozenPaginatedDocument,
  readyTimeoutMs = PRINT_READY_TIMEOUT_MS,
}: PaginatedInvoicePrintHostProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const handledRequestKeyRef = useRef<string | null>(null);
  const invoiceKey = createInvoiceKey(invoice);
  const requestKey = pending && invoiceKey ? invoiceKey : null;
  const [runtimeSnapshot, setRuntimeSnapshot] =
    useState<RuntimeStateSnapshot | null>(null);
  const currentRuntimeState =
    runtimeSnapshot?.invoiceKey === invoiceKey ? runtimeSnapshot.state : null;

  const markRequestHandled = useCallback(() => {
    if (!requestKey || handledRequestKeyRef.current === requestKey) {
      return false;
    }

    handledRequestKeyRef.current = requestKey;
    return true;
  }, [requestKey]);

  const handlePaginationStateChange = useCallback(
    (state: PaginationRuntimeState) => {
      if (!invoiceKey) return;
      setRuntimeSnapshot({ invoiceKey, state });
    },
    [invoiceKey],
  );

  const printTitle = useMemo(() => {
    const invoiceLabel = invoice?.NCF ?? invoice?.numberID ?? invoice?.id;
    return invoiceLabel ? `Factura ${invoiceLabel}` : 'Factura';
  }, [invoice]);

  useEffect(() => {
    if (!pending || !requestKey) {
      handledRequestKeyRef.current = null;
    }
  }, [pending, requestKey]);

  useEffect(() => {
    if (!pending || !requestKey) return undefined;

    const timeout = window.setTimeout(() => {
      if (!markRequestHandled()) return;
      onPrintBlocked(
        resolveFallbackReason(
          'paginated-print-timeout',
          currentRuntimeState,
        ),
      );
    }, readyTimeoutMs);

    return () => window.clearTimeout(timeout);
  }, [
    currentRuntimeState,
    markRequestHandled,
    onPrintBlocked,
    pending,
    readyTimeoutMs,
    requestKey,
  ]);

  useEffect(() => {
    if (!pending || !requestKey || !invoice || !currentRuntimeState) return;

    if (hasTerminalBlockingState(currentRuntimeState)) {
      if (markRequestHandled()) {
        onPrintBlocked(
          resolveFallbackReason(
            'paginated-print-layout-blocked',
            currentRuntimeState,
          ),
        );
      }
      return;
    }

    if (!canPrintFrozenDocument(currentRuntimeState)) {
      return;
    }

    const source = hostRef.current?.querySelector<HTMLElement>(
      '[data-print-pagination-pages]',
    );

    if (!source) {
      if (markRequestHandled()) {
        onPrintBlocked(
          resolveFallbackReason(
            'paginated-print-source-missing',
            currentRuntimeState,
          ),
        );
      }
      return;
    }

    if (!isSourceReadyForStrictPrint(source, currentRuntimeState)) {
      return;
    }

    if (!markRequestHandled()) {
      return;
    }

    void (async () => {
      let blockedMessage: string | null = null;

      try {
        const printed = await waitForFrozenPrintResult(
          printFrozenDocument({
            allowConservativeSnapshot: !currentRuntimeState.readyToPrint,
            onBlocked: (message) => {
              blockedMessage = message;
            },
            source,
            title: printTitle,
          }),
          readyTimeoutMs,
        );

        if (printed === PRINT_TIMEOUT_RESULT) {
          onPrintBlocked(
            resolveFallbackReason(
              'paginated-print-timeout',
              currentRuntimeState,
            ),
          );
          return;
        }

        if (printed) {
          onPrinted();
          return;
        }

        onPrintBlocked(
          resolveFallbackReason(
            'paginated-print-freeze-blocked',
            currentRuntimeState,
            blockedMessage,
          ),
        );
      } catch (error) {
        console.warn('[InvoicePanel] paginated print failed', error);
        onPrintBlocked(
          resolveFallbackReason('paginated-print-error', currentRuntimeState),
        );
      }
    })();
  }, [
    currentRuntimeState,
    invoice,
    markRequestHandled,
    onPrintBlocked,
    onPrinted,
    pending,
    printFrozenDocument,
    printTitle,
    readyTimeoutMs,
    requestKey,
  ]);

  if (!pending || !invoice) {
    return null;
  }

  return (
    <Styles.HiddenHost ref={hostRef} aria-hidden="true">
      <FiscalDocumentPagination
        business={business}
        data={invoice}
        onPaginationStateChange={handlePaginationStateChange}
      />
    </Styles.HiddenHost>
  );
};
