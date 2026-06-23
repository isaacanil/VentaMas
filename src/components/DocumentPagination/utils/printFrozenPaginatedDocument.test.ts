import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createFrozenPaginatedDocumentHtml,
  printFrozenPaginatedDocument,
} from './printFrozenPaginatedDocument';

const setReadySource = () => {
  const source = document.createElement('section');
  source.setAttribute('data-print-pagination-pages', '');
  source.setAttribute('data-print-pagination-ready', 'true');
  source.innerHTML =
    '<article data-print-pagination-page data-print-pagination-page-number="1"><main data-print-pagination-page-body><strong>Factura congelada</strong></main></article>';
  document.body.appendChild(source);
  return source;
};

describe('printFrozenPaginatedDocument', () => {
  beforeEach(() => {
    document.head.innerHTML = '<style>.page { color: rgb(16 24 40); }</style>';
    document.body.innerHTML = '';
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    vi.spyOn(window, 'print').mockImplementation(() => undefined);
    vi.useFakeTimers();

    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: {
        ready: Promise.resolve(),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('fails closed when the paginated document is missing', async () => {
    await expect(printFrozenPaginatedDocument()).resolves.toBe(false);

    expect(window.print).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith(
      'No se encontro el documento paginado para imprimir.',
    );
  });

  it('fails closed when the paginated document is not print-ready', async () => {
    const source = setReadySource();
    source.setAttribute('data-print-pagination-ready', 'false');

    await expect(printFrozenPaginatedDocument()).resolves.toBe(false);

    expect(window.print).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith(
      'El documento todavia no esta listo para imprimir sin cortes.',
    );
  });

  it('can report blocked states through a callback instead of window alert', async () => {
    const onBlocked = vi.fn();

    await expect(
      printFrozenPaginatedDocument({
        onBlocked,
        selector: '[data-missing-document]',
      }),
    ).resolves.toBe(false);

    expect(onBlocked).toHaveBeenCalledWith(
      'No se encontro el documento paginado para imprimir.',
    );
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('exports a validated frozen HTML snapshot without calling print', async () => {
    const source = setReadySource();
    source.style.setProperty('--paginated-page-width', '210mm');

    const snapshotPromise = createFrozenPaginatedDocumentHtml({
      title: 'Factura <LAB>',
    });

    await vi.advanceTimersByTimeAsync(16);
    const snapshot = await snapshotPromise;

    expect(snapshot).toEqual(
      expect.objectContaining({
        pageCount: 1,
        source,
        title: 'Factura <LAB>',
      }),
    );
    expect(snapshot?.html.startsWith('<!doctype html>')).toBe(true);
    expect(snapshot?.html).toContain('<base href=');
    expect(snapshot?.html).toContain('<title>Factura &lt;LAB&gt;</title>');
    expect(snapshot?.html).toContain('.page { color: rgb(16 24 40); }');
    expect(snapshot?.html).toContain('@page');
    expect(snapshot?.html).toContain('inline-size: 210mm !important');
    expect(snapshot?.html).toContain('Factura congelada');
    expect(snapshot?.html).toContain('--paginated-page-width: 210mm;');
    expect(snapshot?.blob).toBeInstanceOf(Blob);
    expect(snapshot?.blob.type).toBe('text/html;charset=utf-8');
    expect(snapshot?.blob.size).toBeGreaterThan(0);
    expect(window.print).not.toHaveBeenCalled();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('blocks frozen HTML export when the document is not ready', async () => {
    const onBlocked = vi.fn();
    const source = setReadySource();
    source.setAttribute('data-print-pagination-ready', 'false');

    await expect(
      createFrozenPaginatedDocumentHtml({ onBlocked }),
    ).resolves.toBeNull();

    expect(onBlocked).toHaveBeenCalledWith(
      'El documento todavia no esta listo para congelar sin cortes.',
    );
    expect(window.print).not.toHaveBeenCalled();
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('prints a frozen iframe copy when the paginated document is ready', async () => {
    const iframePrint = vi.fn();
    const appendChild = vi.spyOn(document.body, 'appendChild');
    appendChild.mockImplementation((node: Node) => {
      const result = HTMLElement.prototype.appendChild.call(document.body, node);

      if (node instanceof HTMLIFrameElement && node.contentWindow) {
        Object.defineProperty(node.contentWindow, 'print', {
          configurable: true,
          value: iframePrint,
        });
      }

      return result;
    });

    setReadySource();

    const printPromise = printFrozenPaginatedDocument({
      title: 'Factura <LAB>',
    });

    await vi.advanceTimersByTimeAsync(16);
    await expect(printPromise).resolves.toBe(true);

    const iframe = document.querySelector('iframe');

    expect(iframe).toBeInstanceOf(HTMLIFrameElement);
    expect(iframe?.contentDocument?.documentElement.outerHTML).toContain(
      'Factura &lt;LAB&gt;',
    );
    expect(iframe?.contentDocument?.body.textContent).toContain(
      'Factura congelada',
    );
    expect(iframePrint).toHaveBeenCalledTimes(1);
    expect(window.print).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1_000);

    expect(document.querySelector('iframe')).toBeNull();
  });

  it('exposes the frozen iframe before print and honors cleanup timing', async () => {
    const iframePrint = vi.fn();
    const onBeforePrint = vi.fn(({
      frameDocument,
      frameElement,
      frameWindow,
      source,
    }) => {
      expect(source).toBe(document.querySelector('[data-print-pagination-pages]'));
      expect(frameElement).toBeInstanceOf(HTMLIFrameElement);
      expect(frameDocument.body.textContent).toContain('Factura congelada');
      Object.defineProperty(frameWindow, 'print', {
        configurable: true,
        value: iframePrint,
      });
    });

    setReadySource();

    const printPromise = printFrozenPaginatedDocument({
      cleanupDelayMs: 25,
      onBeforePrint,
    });

    await vi.advanceTimersByTimeAsync(16);
    await expect(printPromise).resolves.toBe(true);

    expect(onBeforePrint).toHaveBeenCalledTimes(1);
    expect(iframePrint).toHaveBeenCalledTimes(1);
    expect(document.querySelector('iframe')).toBeInstanceOf(HTMLIFrameElement);

    vi.advanceTimersByTime(24);
    expect(document.querySelector('iframe')).toBeInstanceOf(HTMLIFrameElement);

    vi.advanceTimersByTime(1);
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('removes the frozen iframe when the before-print inspection fails', async () => {
    const error = new Error('QA frozen iframe inspection failed');
    setReadySource();

    const printPromise = printFrozenPaginatedDocument({
      onBeforePrint: () => {
        throw error;
      },
    });
    const printExpectation = expect(printPromise).rejects.toThrow(
      'QA frozen iframe inspection failed',
    );

    await vi.advanceTimersByTimeAsync(16);
    await printExpectation;
    expect(document.querySelector('iframe')).toBeNull();
    expect(window.print).not.toHaveBeenCalled();
  });

  it('keeps the frozen snapshot on A4 CSS instead of screen-computed pixel sizes', async () => {
    const iframePrint = vi.fn();
    const appendChild = vi.spyOn(document.body, 'appendChild');
    appendChild.mockImplementation((node: Node) => {
      const result = HTMLElement.prototype.appendChild.call(document.body, node);

      if (node instanceof HTMLIFrameElement && node.contentWindow) {
        Object.defineProperty(node.contentWindow, 'print', {
          configurable: true,
          value: iframePrint,
        });
      }

      return result;
    });
    const source = setReadySource();
    source.style.setProperty('--paginated-page-width', '210mm');
    source.style.setProperty('--paginated-page-height', '297mm');

    const printPromise = printFrozenPaginatedDocument();

    await vi.advanceTimersByTimeAsync(16);
    await expect(printPromise).resolves.toBe(true);

    const frozenSource = document
      .querySelector('iframe')
      ?.contentDocument?.querySelector<HTMLElement>(
        '[data-print-pagination-pages]',
      );
    const frozenPage = frozenSource?.querySelector<HTMLElement>(
      '[data-print-pagination-page]',
    );

    expect(frozenSource?.style.getPropertyValue('--paginated-page-width')).toBe(
      '210mm',
    );
    expect(frozenPage?.style.width).toBe('');
    expect(frozenPage?.style.height).toBe('');
    expect(
      document.querySelector('iframe')?.contentDocument?.head.textContent,
    ).toContain('inline-size: 210mm !important');
  });

  it('can print from a provided source element without querying the selector', async () => {
    const iframePrint = vi.fn();
    const appendChild = vi.spyOn(document.body, 'appendChild');
    appendChild.mockImplementation((node: Node) => {
      const result = HTMLElement.prototype.appendChild.call(document.body, node);

      if (node instanceof HTMLIFrameElement && node.contentWindow) {
        Object.defineProperty(node.contentWindow, 'print', {
          configurable: true,
          value: iframePrint,
        });
      }

      return result;
    });
    const source = setReadySource();

    const printPromise = printFrozenPaginatedDocument({
      selector: '[data-missing-document]',
      source,
    });

    await vi.advanceTimersByTimeAsync(16);
    await expect(printPromise).resolves.toBe(true);

    expect(iframePrint).toHaveBeenCalledTimes(1);
  });

  it('blocks printing when the frozen iframe copy still overflows', async () => {
    const originalScrollHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollHeight',
    );
    const originalClientHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'clientHeight',
    );
    const iframePrint = vi.fn();
    const appendChild = vi.spyOn(document.body, 'appendChild');
    const installOverflowMeasurements = (elementPrototype: HTMLElement) => {
      Object.defineProperty(elementPrototype, 'clientHeight', {
        configurable: true,
        get() {
          return 100;
        },
      });
      Object.defineProperty(elementPrototype, 'scrollHeight', {
        configurable: true,
        get() {
          return this.hasAttribute('data-print-pagination-page-body')
            ? 130
            : 100;
        },
      });
    };

    installOverflowMeasurements(HTMLElement.prototype);
    appendChild.mockImplementation((node: Node) => {
      const result = HTMLElement.prototype.appendChild.call(document.body, node);

      if (node instanceof HTMLIFrameElement && node.contentWindow) {
        Object.defineProperty(node.contentWindow, 'print', {
          configurable: true,
          value: iframePrint,
        });
        installOverflowMeasurements(node.contentWindow.HTMLElement.prototype);
      }

      return result;
    });

    try {
      setReadySource();

      const printPromise = printFrozenPaginatedDocument();

      await vi.advanceTimersByTimeAsync(16);
      await expect(printPromise).resolves.toBe(false);

      expect(iframePrint).not.toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith(
        'La copia congelada sigue teniendo contenido cortado en paginas: 1.',
      );
      expect(document.querySelector('iframe')).toBeNull();
    } finally {
      if (originalScrollHeight) {
        Object.defineProperty(
          HTMLElement.prototype,
          'scrollHeight',
          originalScrollHeight,
        );
      } else {
        delete (HTMLElement.prototype as Partial<HTMLElement>).scrollHeight;
      }
      if (originalClientHeight) {
        Object.defineProperty(
          HTMLElement.prototype,
          'clientHeight',
          originalClientHeight,
        );
      } else {
        delete (HTMLElement.prototype as Partial<HTMLElement>).clientHeight;
      }
    }
  });

  it('blocks frozen HTML export when the iframe validation overflows', async () => {
    const originalScrollHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollHeight',
    );
    const originalClientHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'clientHeight',
    );
    const onBlocked = vi.fn();
    const installOverflowMeasurements = (elementPrototype: HTMLElement) => {
      Object.defineProperty(elementPrototype, 'clientHeight', {
        configurable: true,
        get() {
          return 100;
        },
      });
      Object.defineProperty(elementPrototype, 'scrollHeight', {
        configurable: true,
        get() {
          return this.hasAttribute('data-print-pagination-page-body')
            ? 130
            : 100;
        },
      });
    };
    const appendChild = vi.spyOn(document.body, 'appendChild');

    installOverflowMeasurements(HTMLElement.prototype);
    appendChild.mockImplementation((node: Node) => {
      const result = HTMLElement.prototype.appendChild.call(document.body, node);

      if (node instanceof HTMLIFrameElement && node.contentWindow) {
        installOverflowMeasurements(node.contentWindow.HTMLElement.prototype);
      }

      return result;
    });

    try {
      setReadySource();

      const snapshotPromise = createFrozenPaginatedDocumentHtml({ onBlocked });

      await vi.advanceTimersByTimeAsync(16);
      await expect(snapshotPromise).resolves.toBeNull();

      expect(onBlocked).toHaveBeenCalledWith(
        'La copia congelada sigue teniendo contenido cortado en paginas: 1.',
      );
      expect(window.print).not.toHaveBeenCalled();
      expect(document.querySelector('iframe')).toBeNull();
    } finally {
      if (originalScrollHeight) {
        Object.defineProperty(
          HTMLElement.prototype,
          'scrollHeight',
          originalScrollHeight,
        );
      } else {
        delete (HTMLElement.prototype as Partial<HTMLElement>).scrollHeight;
      }
      if (originalClientHeight) {
        Object.defineProperty(
          HTMLElement.prototype,
          'clientHeight',
          originalClientHeight,
        );
      } else {
        delete (HTMLElement.prototype as Partial<HTMLElement>).clientHeight;
      }
    }
  });
});
