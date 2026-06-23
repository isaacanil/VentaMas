import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { printFrozenPaginatedDocument } from '@/components/DocumentPagination/browser';
import type { PaginationRuntimeState } from '@/components/DocumentPagination';
import type { InvoiceBusinessInfo, InvoiceData } from '@/types/invoice';

import { FiscalDocumentPagination } from './FiscalDocumentPagination';
import * as Styles from './FiscalDocumentPaginatedPrintHost.styles';

type RuntimeStateSnapshot = {
  invoiceKey: string;
  state: PaginationRuntimeState;
};

type FiscalDocumentPaginatedPrintHostProps = {
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

const resolvePrintTitlePrefix = (invoice: InvoiceData | null | undefined) => {
  const kind = invoice?.documentKind ?? invoice?.type;

  if (kind === 'creditNote') return 'Nota de crédito';
  if (kind === 'debitNote') return 'Nota de débito';
  return 'Factura';
};

const hasBlockingState = (state: PaginationRuntimeState) =>
  state.chromeOverflowRoles.length > 0 ||
  state.duplicateBlockIds.length > 0 ||
  state.overflowBlockIds.length > 0 ||
  state.unmeasuredBlockIds.length > 0;

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
) => !state.readyToPrint || source.dataset.printPaginationReady === 'true';

const joinValues = (values: string[]) => values.filter(Boolean).join(', ');

const formatRuntimeState = (state: PaginationRuntimeState) => {
  const parts = [
    `measured=${state.measured ? 'yes' : 'no'}`,
    `stable=${state.stable ? 'yes' : 'no'}`,
    `ready=${state.readyToPrint ? 'yes' : 'no'}`,
    `pages=${state.pageCount}`,
  ];

  if (state.overflowBlockIds.length) {
    parts.push(`overflowBlocks=${joinValues(state.overflowBlockIds)}`);
  }
  if (state.chromeOverflowRoles.length) {
    parts.push(`chromeOverflowRoles=${joinValues(state.chromeOverflowRoles)}`);
  }
  if (state.duplicateBlockIds.length) {
    parts.push(`duplicateBlocks=${joinValues(state.duplicateBlockIds)}`);
  }
  if (state.unmeasuredBlockIds.length) {
    parts.push(`unmeasuredBlocks=${joinValues(state.unmeasuredBlockIds)}`);
  }

  return parts.join('; ');
};

const resolveFallbackReason = (
  code: string,
  state?: PaginationRuntimeState | null,
  detail?: string | null,
) => {
  const stateReason = state ? `${code}: ${formatRuntimeState(state)}` : code;
  return detail ? `${stateReason}; ${detail}` : stateReason;
};

const waitForFrozenPrintResult = async (
  printPromise: Promise<boolean>,
  timeoutMs: number,
) => {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<typeof PRINT_TIMEOUT_RESULT>((resolve) => {
    timeoutId = window.setTimeout(
      () => resolve(PRINT_TIMEOUT_RESULT),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([printPromise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  }
};

export const FiscalDocumentPaginatedPrintHost = ({
  business,
  invoice,
  onPrintBlocked,
  onPrinted,
  pending,
  printFrozenDocument = printFrozenPaginatedDocument,
  readyTimeoutMs = PRINT_READY_TIMEOUT_MS,
}: FiscalDocumentPaginatedPrintHostProps) => {
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
    const titlePrefix = resolvePrintTitlePrefix(invoice);
    return invoiceLabel ? `${titlePrefix} ${invoiceLabel}` : titlePrefix;
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
        resolveFallbackReason('paginated-print-timeout', currentRuntimeState),
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
        console.warn('[FiscalDocumentPaginatedPrintHost] print failed', error);
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
