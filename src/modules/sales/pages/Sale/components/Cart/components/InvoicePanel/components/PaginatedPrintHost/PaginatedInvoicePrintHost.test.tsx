import { act, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PaginationRuntimeState } from '@/components/DocumentPagination';
import { printFrozenPaginatedDocument } from '@/components/DocumentPagination/browser';

import { PaginatedInvoicePrintHost } from './PaginatedInvoicePrintHost';

const readyRuntimeState: PaginationRuntimeState = {
  chromeOverflowRoles: [],
  duplicateBlockIds: [],
  measured: true,
  overflowBlockIds: [],
  pageCount: 1,
  readyToPrint: true,
  stable: true,
  unmeasuredBlockIds: [],
};

const blockedRuntimeState: PaginationRuntimeState = {
  ...readyRuntimeState,
  overflowBlockIds: ['product-line-1'],
  readyToPrint: false,
};

const unstableRuntimeState: PaginationRuntimeState = {
  ...readyRuntimeState,
  pageCount: 2,
  readyToPrint: false,
  stable: false,
  unmeasuredBlockIds: ['notes'],
};

const mockRuntime = vi.hoisted(() => ({
  emitState: null as ((state: PaginationRuntimeState) => void) | null,
  renderSource: true,
  sourceReady: null as boolean | null,
  state: null as PaginationRuntimeState | null,
}));

vi.mock('@/components/DocumentPagination/browser', () => ({
  printFrozenPaginatedDocument: vi.fn(),
}));

vi.mock('@/modules/invoice/public', async () => {
  const React = await import('react');

  return {
    FiscalDocumentPagination: ({
      onPaginationStateChange,
    }: {
      onPaginationStateChange?: (state: PaginationRuntimeState) => void;
    }) => {
      React.useEffect(() => {
        mockRuntime.emitState = onPaginationStateChange ?? null;

        return () => {
          if (mockRuntime.emitState === onPaginationStateChange) {
            mockRuntime.emitState = null;
          }
        };
      }, [onPaginationStateChange]);

      React.useEffect(() => {
        if (mockRuntime.state) {
          onPaginationStateChange?.(mockRuntime.state);
        }
      }, [onPaginationStateChange]);

      const sourceReady =
        mockRuntime.sourceReady ?? Boolean(mockRuntime.state?.readyToPrint);

      return React.createElement(
        'section',
        { 'data-testid': 'fiscal-pagination' },
        mockRuntime.renderSource
          ? React.createElement('div', {
              'data-print-pagination-pages': true,
              'data-print-pagination-ready': sourceReady ? 'true' : 'false',
            })
          : null,
      );
    },
  };
});

const invoice = {
  id: 'invoice-1',
  NCF: 'B010000000001',
  products: [],
};

describe('PaginatedInvoicePrintHost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRuntime.emitState = null;
    mockRuntime.renderSource = true;
    mockRuntime.sourceReady = null;
    mockRuntime.state = readyRuntimeState;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('prints the frozen paginated document when the runtime state is ready', async () => {
    const onPrinted = vi.fn();
    const onPrintBlocked = vi.fn();
    vi.mocked(printFrozenPaginatedDocument).mockResolvedValue(true);

    render(
      <PaginatedInvoicePrintHost
        business={{ name: 'VentaMas Demo' }}
        invoice={invoice}
        pending
        onPrintBlocked={onPrintBlocked}
        onPrinted={onPrinted}
      />,
    );

    await waitFor(() => {
      expect(printFrozenPaginatedDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          source: expect.any(HTMLElement),
          title: 'Factura B010000000001',
        }),
      );
    });
    await waitFor(() => expect(onPrinted).toHaveBeenCalledTimes(1));
    expect(printFrozenPaginatedDocument).toHaveBeenCalledTimes(1);
    expect(onPrintBlocked).not.toHaveBeenCalled();
  });

  it('reports a blocked print when the paginated layout reports terminal overflow', async () => {
    const onPrinted = vi.fn();
    const onPrintBlocked = vi.fn();
    mockRuntime.state = blockedRuntimeState;

    render(
      <PaginatedInvoicePrintHost
        business={{ name: 'VentaMas Demo' }}
        invoice={invoice}
        pending
        onPrintBlocked={onPrintBlocked}
        onPrinted={onPrinted}
      />,
    );

    await waitFor(() => {
      expect(onPrintBlocked).toHaveBeenCalledWith(
        expect.stringContaining('paginated-print-layout-blocked'),
      );
    });
    expect(onPrintBlocked).toHaveBeenCalledTimes(1);
    expect(onPrintBlocked).toHaveBeenCalledWith(
      expect.stringContaining('overflowBlocks=product-line-1'),
    );
    expect(printFrozenPaginatedDocument).not.toHaveBeenCalled();
    expect(onPrinted).not.toHaveBeenCalled();
  });

  it('reports a blocked print when the frozen print helper blocks printing', async () => {
    const onPrinted = vi.fn();
    const onPrintBlocked = vi.fn();
    vi.mocked(printFrozenPaginatedDocument).mockResolvedValue(false);

    render(
      <PaginatedInvoicePrintHost
        business={{ name: 'VentaMas Demo' }}
        invoice={invoice}
        pending
        onPrintBlocked={onPrintBlocked}
        onPrinted={onPrinted}
      />,
    );

    await waitFor(() => {
      expect(onPrintBlocked).toHaveBeenCalledWith(
        expect.stringContaining('paginated-print-freeze-blocked'),
      );
    });
    expect(onPrintBlocked).toHaveBeenCalledTimes(1);
    expect(printFrozenPaginatedDocument).toHaveBeenCalledTimes(2);
    expect(onPrintBlocked).toHaveBeenCalledWith(
      expect.stringContaining('ready=yes'),
    );
    expect(onPrinted).not.toHaveBeenCalled();
  });

  it('retries the frozen paginated print before reporting success', async () => {
    const onPrinted = vi.fn();
    const onPrintBlocked = vi.fn();
    vi.mocked(printFrozenPaginatedDocument)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    render(
      <PaginatedInvoicePrintHost
        business={{ name: 'VentaMas Demo' }}
        invoice={invoice}
        pending
        readyTimeoutMs={10}
        onPrintBlocked={onPrintBlocked}
        onPrinted={onPrinted}
      />,
    );

    await waitFor(() => {
      expect(printFrozenPaginatedDocument).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => expect(onPrinted).toHaveBeenCalledTimes(1));
    expect(onPrintBlocked).not.toHaveBeenCalled();
  });

  it('waits for a fresh ready DOM source before reprinting the same invoice', async () => {
    const onPrinted = vi.fn();
    const onPrintBlocked = vi.fn();
    vi.mocked(printFrozenPaginatedDocument).mockResolvedValue(true);

    const view = render(
      <PaginatedInvoicePrintHost
        business={{ name: 'VentaMas Demo' }}
        invoice={invoice}
        pending
        readyTimeoutMs={10}
        onPrintBlocked={onPrintBlocked}
        onPrinted={onPrinted}
      />,
    );

    await waitFor(() => {
      expect(printFrozenPaginatedDocument).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => expect(onPrinted).toHaveBeenCalledTimes(1));

    vi.mocked(printFrozenPaginatedDocument).mockClear();
    onPrinted.mockClear();
    onPrintBlocked.mockClear();

    view.rerender(
      <PaginatedInvoicePrintHost
        business={{ name: 'VentaMas Demo' }}
        invoice={invoice}
        pending={false}
        onPrintBlocked={onPrintBlocked}
        onPrinted={onPrinted}
      />,
    );

    await act(async () => undefined);

    mockRuntime.sourceReady = false;
    mockRuntime.state = unstableRuntimeState;
    view.rerender(
      <PaginatedInvoicePrintHost
        business={{ name: 'VentaMas Demo' }}
        invoice={invoice}
        pending
        onPrintBlocked={onPrintBlocked}
        onPrinted={onPrinted}
      />,
    );

    await act(async () => undefined);

    expect(printFrozenPaginatedDocument).not.toHaveBeenCalled();
    expect(onPrintBlocked).not.toHaveBeenCalled();

    mockRuntime.sourceReady = true;
    await act(async () => {
      mockRuntime.emitState?.(readyRuntimeState);
    });

    await waitFor(() => {
      expect(printFrozenPaginatedDocument).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => expect(onPrinted).toHaveBeenCalledTimes(1));
    expect(onPrintBlocked).not.toHaveBeenCalled();
  });

  it('reports a blocked print when the paginated source is missing', async () => {
    const onPrinted = vi.fn();
    const onPrintBlocked = vi.fn();
    mockRuntime.renderSource = false;

    render(
      <PaginatedInvoicePrintHost
        business={{ name: 'VentaMas Demo' }}
        invoice={invoice}
        pending
        onPrintBlocked={onPrintBlocked}
        onPrinted={onPrinted}
      />,
    );

    await waitFor(() => {
      expect(onPrintBlocked).toHaveBeenCalledWith(
        expect.stringContaining('paginated-print-source-missing'),
      );
    });
    expect(onPrintBlocked).toHaveBeenCalledTimes(1);
    expect(printFrozenPaginatedDocument).not.toHaveBeenCalled();
    expect(onPrinted).not.toHaveBeenCalled();
  });

  it('reports a blocked print when the frozen print helper throws', async () => {
    const onPrinted = vi.fn();
    const onPrintBlocked = vi.fn();
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(printFrozenPaginatedDocument).mockRejectedValue(
      new Error('freeze failed'),
    );

    render(
      <PaginatedInvoicePrintHost
        business={{ name: 'VentaMas Demo' }}
        invoice={invoice}
        pending
        onPrintBlocked={onPrintBlocked}
        onPrinted={onPrinted}
      />,
    );

    await waitFor(() => {
      expect(onPrintBlocked).toHaveBeenCalledWith(
        expect.stringContaining('paginated-print-error'),
      );
    });
    expect(onPrintBlocked).toHaveBeenCalledTimes(1);
    expect(onPrinted).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('reports runtime diagnostics when pagination never becomes ready', async () => {
    const onPrinted = vi.fn();
    const onPrintBlocked = vi.fn();
    mockRuntime.state = unstableRuntimeState;
    vi.useFakeTimers();

    render(
      <PaginatedInvoicePrintHost
        business={{ name: 'VentaMas Demo' }}
        invoice={invoice}
        pending
        readyTimeoutMs={10}
        onPrintBlocked={onPrintBlocked}
        onPrinted={onPrinted}
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(onPrintBlocked).toHaveBeenCalledWith(
      expect.stringContaining('paginated-print-timeout'),
    );
    expect(onPrintBlocked).toHaveBeenCalledTimes(1);
    expect(onPrintBlocked).toHaveBeenCalledWith(
      expect.stringContaining('stable=no'),
    );
    expect(onPrintBlocked).toHaveBeenCalledWith(
      expect.stringContaining('ready=no'),
    );
    expect(onPrintBlocked).toHaveBeenCalledWith(
      expect.stringContaining('pages=2'),
    );
    expect(onPrintBlocked).toHaveBeenCalledWith(
      expect.stringContaining('unmeasuredBlocks=notes'),
    );
    expect(printFrozenPaginatedDocument).not.toHaveBeenCalled();
    expect(onPrinted).not.toHaveBeenCalled();
  });

  it('reports a blocked print when the frozen print helper never settles', async () => {
    const onPrinted = vi.fn();
    const onPrintBlocked = vi.fn();
    const attemptSignals: AbortSignal[] = [];
    vi.useFakeTimers();
    vi.mocked(printFrozenPaginatedDocument).mockImplementation(
      ({ signal } = {}) => {
        if (signal) {
          attemptSignals.push(signal);
        }
        return new Promise<boolean>(() => {});
      },
    );

    render(
      <PaginatedInvoicePrintHost
        business={{ name: 'VentaMas Demo' }}
        invoice={invoice}
        pending
        printAttemptTimeoutMs={10}
        onPrintBlocked={onPrintBlocked}
        onPrinted={onPrinted}
      />,
    );

    await act(async () => undefined);

    expect(printFrozenPaginatedDocument).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(attemptSignals[0]?.aborted).toBe(true);
    expect(onPrintBlocked).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    expect(printFrozenPaginatedDocument).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(onPrintBlocked).toHaveBeenCalledWith(
      expect.stringContaining('paginated-print-timeout'),
    );
    expect(onPrintBlocked).toHaveBeenCalledWith(
      expect.stringContaining('ready=yes'),
    );
    expect(onPrintBlocked).toHaveBeenCalledWith(
      expect.stringContaining('intentos=2'),
    );
    expect(onPrintBlocked).toHaveBeenCalledTimes(1);
    expect(attemptSignals[1]?.aborted).toBe(true);
    expect(onPrinted).not.toHaveBeenCalled();
  });

  it('prints only once for the same pending invoice under StrictMode', async () => {
    const onPrinted = vi.fn();
    const onPrintBlocked = vi.fn();
    vi.mocked(printFrozenPaginatedDocument).mockResolvedValue(true);

    render(
      <React.StrictMode>
        <PaginatedInvoicePrintHost
          business={{ name: 'VentaMas Demo' }}
          invoice={invoice}
          pending
          onPrintBlocked={onPrintBlocked}
          onPrinted={onPrinted}
        />
      </React.StrictMode>,
    );

    await waitFor(() => {
      expect(printFrozenPaginatedDocument).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => expect(onPrinted).toHaveBeenCalledTimes(1));
    expect(onPrintBlocked).not.toHaveBeenCalled();
  });
});
