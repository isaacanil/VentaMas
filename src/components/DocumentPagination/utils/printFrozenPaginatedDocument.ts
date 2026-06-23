export type FrozenPaginatedDocumentPrintContext = {
  frameDocument: Document;
  frameElement: HTMLIFrameElement;
  frameWindow: Window;
  source: HTMLElement;
};

export type FrozenPaginatedDocumentHtmlSnapshot = {
  blob: Blob;
  html: string;
  pageCount: number;
  source: HTMLElement;
  title: string;
};

export type CreateFrozenPaginatedDocumentHtmlOptions = {
  allowConservativeSnapshot?: boolean;
  onBlocked?: (message: string) => void;
  selector?: string;
  source?: HTMLElement | null;
  title?: string;
};

export type PrintFrozenPaginatedDocumentOptions = {
  allowConservativeSnapshot?: boolean;
  cleanupDelayMs?: number;
  onBeforePrint?: (
    context: FrozenPaginatedDocumentPrintContext,
  ) => Promise<void> | void;
  onBlocked?: (message: string) => void;
  selector?: string;
  source?: HTMLElement | null;
  title?: string;
};

const DEFAULT_FRAME_CLEANUP_DELAY_MS = 1_000;
const DEFAULT_PRINT_SELECTOR = '[data-print-pagination-pages]';
const PAGE_OVERFLOW_TOLERANCE_PX = 2;
const PRINT_PAGE_HEIGHT_MM = 297;
const PRINT_PAGE_WIDTH_MM = 210;
const showPrintBlockedMessage = (
  message: string,
  onBlocked?: (message: string) => void,
) => {
  if (onBlocked) {
    onBlocked(message);
    return;
  }

  if (typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(message);
  }
};

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const collectDocumentStyles = () =>
  Array.from(
    document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>(
      'link[rel="stylesheet"], style',
    ),
  )
    .map((node) => node.outerHTML)
    .join('\n');

const countSnapshotPages = (source: HTMLElement) =>
  source.querySelectorAll('[data-print-pagination-page]').length;

const copyPaginationCustomProperties = (source: Element, target: HTMLElement) => {
  const computedStyle = window.getComputedStyle(source);

  Array.from(computedStyle)
    .filter((propertyName) => propertyName.startsWith('--paginated-'))
    .forEach((propertyName) => {
      target.style.setProperty(
        propertyName,
        computedStyle.getPropertyValue(propertyName),
      );
    });
};

const copyClassRuntimeStyles = (source: Element, target: HTMLElement) => {
  const computedStyle = window.getComputedStyle(source);

  ['direction', 'font-family', 'font-size', 'line-height'].forEach(
    (propertyName) => {
      target.style.setProperty(
        propertyName,
        computedStyle.getPropertyValue(propertyName),
      );
    },
  );
};

const prepareFrozenSnapshot = (source: HTMLElement) => {
  const frozenSource = source.cloneNode(true) as HTMLElement;

  copyPaginationCustomProperties(source, frozenSource);
  copyClassRuntimeStyles(source, frozenSource);

  return frozenSource;
};

const normalizeFrozenImages = (source: HTMLElement, frozenSource: HTMLElement) => {
  const sourceImages = Array.from(source.querySelectorAll('img'));
  const frozenImages = Array.from(frozenSource.querySelectorAll('img'));

  sourceImages.forEach((sourceImage, index) => {
    const frozenImage = frozenImages[index];

    if (!frozenImage) {
      return;
    }

    const stableSource = sourceImage.currentSrc || sourceImage.src;
    if (stableSource) {
      frozenImage.setAttribute('src', stableSource);
    }

    frozenImage.removeAttribute('srcset');
    frozenImage.removeAttribute('sizes');
    frozenImage.setAttribute('loading', 'eager');
  });
};

const waitForFonts = async (targetDocument: Document) => {
  const fontSet = (
    targetDocument as Document & {
      fonts?: {
        ready?: Promise<unknown>;
      };
    }
  ).fonts;

  if (!fontSet?.ready) {
    return;
  }

  await fontSet.ready.catch(() => undefined);
};

const waitForImages = async (targetDocument: Document) => {
  const imagePromises = Array.from(targetDocument.images).map(
    (image) =>
      new Promise<void>((resolve) => {
        if (image.complete) {
          resolve();
          return;
        }

        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => resolve(), { once: true });
      }),
  );

  await Promise.all(imagePromises);
};

const resolveBrokenSourceImages = (source: HTMLElement) =>
  Array.from(source.querySelectorAll('img'))
    .filter((image) => {
      if (!image.src && !image.currentSrc) {
        return false;
      }

      return (
        !image.complete ||
        (image.naturalWidth === 0 && image.naturalHeight === 0)
      );
    })
    .map((image, index) => image.currentSrc || image.src || `imagen ${index + 1}`);

const waitForFrameLayout = async (targetWindow: Window) => {
  await new Promise<void>((resolve) => {
    if (typeof targetWindow.requestAnimationFrame === 'function') {
      targetWindow.requestAnimationFrame(() => resolve());
      return;
    }

    resolve();
  });
};

const waitForSourceImages = async (source: HTMLElement) => {
  const imagePromises = Array.from(source.querySelectorAll('img')).map(
    async (image) => {
      if (typeof image.decode === 'function') {
        await image.decode().catch(() => undefined);
        return;
      }

      if (image.complete) {
        return;
      }

      await new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => resolve(), { once: true });
      });
    },
  );

  await Promise.all(imagePromises);
};

const hasVerticalOverflow = (element: Element) => {
  const measurableElement = element as Element & {
    clientHeight?: number;
    scrollHeight?: number;
  };

  if (
    typeof measurableElement.scrollHeight !== 'number' ||
    typeof measurableElement.clientHeight !== 'number'
  ) {
    return false;
  }

  return (
    measurableElement.scrollHeight - measurableElement.clientHeight >
    PAGE_OVERFLOW_TOLERANCE_PX
  );
};

const hasHorizontalOverflow = (element: Element) => {
  const measurableElement = element as Element & {
    clientWidth?: number;
    scrollWidth?: number;
  };

  if (
    typeof measurableElement.scrollWidth !== 'number' ||
    typeof measurableElement.clientWidth !== 'number'
  ) {
    return false;
  }

  return (
    measurableElement.scrollWidth - measurableElement.clientWidth >
    PAGE_OVERFLOW_TOLERANCE_PX
  );
};

const hasAnyOverflow = (element: Element) =>
  hasVerticalOverflow(element) || hasHorizontalOverflow(element);

const resolveOverflowingSnapshotPages = (targetDocument: Document) =>
  Array.from(
    targetDocument.querySelectorAll<HTMLElement>(
      '[data-print-pagination-page]',
    ),
  )
    .filter((page) => {
      const body = page.querySelector('[data-print-pagination-page-body]');

      return hasAnyOverflow(page) || Boolean(body && hasAnyOverflow(body));
    })
    .map((page, index) => page.dataset.printPaginationPageNumber || `${index + 1}`);

const buildSnapshotDocumentMarkup = ({
  sourceMarkup,
  title,
}: {
  sourceMarkup: string;
  title: string;
}) => `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <base href="${escapeHtml(document.baseURI)}" />
    <title>${escapeHtml(title)}</title>
    ${collectDocumentStyles()}
    <style>
      @page {
        size: A4 portrait;
        margin: 0 !important;
      }

      html,
      body {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        inline-size: ${PRINT_PAGE_WIDTH_MM}mm;
        min-height: 100%;
        background: #fff;
        overflow: visible;
      }

      body {
        display: block;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      [data-print-pagination-pages] {
        display: block !important;
        gap: 0 !important;
        inline-size: ${PRINT_PAGE_WIDTH_MM}mm !important;
        margin: 0 !important;
        padding: 0 !important;
        transform: none !important;
      }

      [data-print-pagination-pages] > article {
        box-sizing: border-box !important;
        display: grid !important;
        inline-size: ${PRINT_PAGE_WIDTH_MM}mm !important;
        min-inline-size: ${PRINT_PAGE_WIDTH_MM}mm !important;
        max-inline-size: ${PRINT_PAGE_WIDTH_MM}mm !important;
        block-size: ${PRINT_PAGE_HEIGHT_MM}mm !important;
        min-block-size: ${PRINT_PAGE_HEIGHT_MM}mm !important;
        max-block-size: ${PRINT_PAGE_HEIGHT_MM}mm !important;
        margin: 0 !important;
        border: 0 !important;
        box-shadow: none !important;
        break-after: page !important;
        page-break-after: always !important;
      }

      [data-print-pagination-pages] > article:last-child {
        break-after: auto !important;
        page-break-after: auto !important;
      }

      @media print {
        html,
        body {
          inline-size: ${PRINT_PAGE_WIDTH_MM}mm !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        [data-print-pagination-pages] {
          display: block !important;
          gap: 0 !important;
          inline-size: ${PRINT_PAGE_WIDTH_MM}mm !important;
          margin: 0 !important;
          padding: 0 !important;
          transform: none !important;
        }

        [data-print-pagination-pages] > article {
          box-sizing: border-box !important;
          display: grid !important;
          inline-size: ${PRINT_PAGE_WIDTH_MM}mm !important;
          min-inline-size: ${PRINT_PAGE_WIDTH_MM}mm !important;
          max-inline-size: ${PRINT_PAGE_WIDTH_MM}mm !important;
          block-size: ${PRINT_PAGE_HEIGHT_MM}mm !important;
          min-block-size: ${PRINT_PAGE_HEIGHT_MM}mm !important;
          max-block-size: ${PRINT_PAGE_HEIGHT_MM}mm !important;
          margin: 0 !important;
          border: 0 !important;
          box-shadow: none !important;
          break-after: page !important;
          page-break-after: always !important;
        }

        [data-print-pagination-pages] > article:last-child {
          break-after: auto !important;
          page-break-after: auto !important;
        }
      }
    </style>
  </head>
  <body>
    ${sourceMarkup}
  </body>
</html>`;

const writeSnapshotDocument = ({
  frameDocument,
  html,
}: {
  frameDocument: Document;
  html: string;
}) => {
  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();
};

const createHiddenSnapshotFrame = (onBlocked?: (message: string) => void) => {
  const frameElement = document.createElement('iframe');
  frameElement.setAttribute('aria-hidden', 'true');
  frameElement.style.position = 'fixed';
  frameElement.style.inset = '0 auto auto 0';
  frameElement.style.width = '1px';
  frameElement.style.height = '1px';
  frameElement.style.border = '0';
  frameElement.style.opacity = '0';
  frameElement.style.pointerEvents = 'none';

  document.body.appendChild(frameElement);

  const frameWindow = frameElement.contentWindow;
  const frameDocument = frameWindow?.document;

  if (!frameWindow || !frameDocument) {
    frameElement.remove();
    showPrintBlockedMessage('No se pudo crear el marco de impresion.', onBlocked);
    return null;
  }

  return {
    frameDocument,
    frameElement,
    frameWindow,
  };
};

const validateSnapshotFrame = async ({
  frameDocument,
  frameWindow,
  onBlocked,
}: {
  frameDocument: Document;
  frameWindow: Window;
  onBlocked?: (message: string) => void;
}) => {
  await waitForFonts(frameDocument);
  await waitForImages(frameDocument);
  await waitForFrameLayout(frameWindow);

  const overflowingPages = resolveOverflowingSnapshotPages(frameDocument);
  if (overflowingPages.length > 0) {
    showPrintBlockedMessage(
      `La copia congelada sigue teniendo contenido cortado en paginas: ${overflowingPages.join(
        ', ',
      )}.`,
      onBlocked,
    );
    return false;
  }

  return true;
};

const mapSnapshotBlockedMessageForPrint = (message: string) => {
  if (message === 'El snapshot congelado solo esta disponible en el navegador.') {
    return 'La impresion congelada solo esta disponible en el navegador.';
  }

  if (message === 'No se encontro el documento paginado para congelar.') {
    return 'No se encontro el documento paginado para imprimir.';
  }

  if (message === 'El documento todavia no esta listo para congelar sin cortes.') {
    return 'El documento todavia no esta listo para imprimir sin cortes.';
  }

  if (
    message ===
    'El documento cambio mientras se preparaba el snapshot. Intenta de nuevo.'
  ) {
    return 'El documento cambio mientras se preparaba la impresion. Intenta de nuevo.';
  }

  return message;
};

const createFrozenPaginatedDocumentHtmlSnapshot = async ({
  allowConservativeSnapshot = false,
  onBlocked,
  selector = DEFAULT_PRINT_SELECTOR,
  source: providedSource,
  title,
}: CreateFrozenPaginatedDocumentHtmlOptions = {}): Promise<
  FrozenPaginatedDocumentHtmlSnapshot | null
> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    showPrintBlockedMessage(
      'El snapshot congelado solo esta disponible en el navegador.',
      onBlocked,
    );
    return null;
  }

  const source =
    providedSource ?? document.querySelector<HTMLElement>(selector);
  const snapshotTitle = title || document.title || 'Documento paginado';

  if (!source) {
    showPrintBlockedMessage(
      'No se encontro el documento paginado para congelar.',
      onBlocked,
    );
    return null;
  }

  if (
    source.dataset.printPaginationReady !== 'true' &&
    !allowConservativeSnapshot
  ) {
    showPrintBlockedMessage(
      'El documento todavia no esta listo para congelar sin cortes.',
      onBlocked,
    );
    return null;
  }

  await waitForFonts(document);
  await waitForSourceImages(source);
  if (
    source.dataset.printPaginationReady !== 'true' &&
    !allowConservativeSnapshot
  ) {
    showPrintBlockedMessage(
      'El documento cambio mientras se preparaba el snapshot. Intenta de nuevo.',
      onBlocked,
    );
    return null;
  }

  const brokenSourceImages = resolveBrokenSourceImages(source);
  if (brokenSourceImages.length > 0) {
    showPrintBlockedMessage(
      `No se pudo confirmar la carga de imagenes: ${brokenSourceImages.join(
        ', ',
      )}.`,
      onBlocked,
    );
    return null;
  }

  const frozenSource = prepareFrozenSnapshot(source);
  normalizeFrozenImages(source, frozenSource);
  const html = buildSnapshotDocumentMarkup({
    sourceMarkup: frozenSource.outerHTML,
    title: snapshotTitle,
  });

  return {
    blob: new Blob([html], { type: 'text/html;charset=utf-8' }),
    html,
    pageCount: countSnapshotPages(frozenSource),
    source,
    title: snapshotTitle,
  };
};

export const createFrozenPaginatedDocumentHtml = async (
  options: CreateFrozenPaginatedDocumentHtmlOptions = {},
): Promise<FrozenPaginatedDocumentHtmlSnapshot | null> => {
  const snapshot = await createFrozenPaginatedDocumentHtmlSnapshot(options);
  if (!snapshot) {
    return null;
  }

  const snapshotFrame = createHiddenSnapshotFrame(options.onBlocked);
  if (!snapshotFrame) {
    return null;
  }

  writeSnapshotDocument({
    frameDocument: snapshotFrame.frameDocument,
    html: snapshot.html,
  });

  const isValid = await validateSnapshotFrame({
    frameDocument: snapshotFrame.frameDocument,
    frameWindow: snapshotFrame.frameWindow,
    onBlocked: options.onBlocked,
  });
  snapshotFrame.frameElement.remove();

  return isValid ? snapshot : null;
};

export const printFrozenPaginatedDocument = async ({
  allowConservativeSnapshot = false,
  cleanupDelayMs = DEFAULT_FRAME_CLEANUP_DELAY_MS,
  onBeforePrint,
  onBlocked,
  selector = DEFAULT_PRINT_SELECTOR,
  source: providedSource,
  title,
}: PrintFrozenPaginatedDocumentOptions = {}) => {
  const snapshot = await createFrozenPaginatedDocumentHtmlSnapshot({
    onBlocked: (message) =>
      showPrintBlockedMessage(
        mapSnapshotBlockedMessageForPrint(message),
        onBlocked,
      ),
    selector,
    source: providedSource,
    title,
    allowConservativeSnapshot,
  });

  if (!snapshot) {
    return false;
  }

  const printFrame = createHiddenSnapshotFrame(onBlocked);
  if (!printFrame) {
    return false;
  }

  writeSnapshotDocument({
    frameDocument: printFrame.frameDocument,
    html: snapshot.html,
  });

  const isValid = await validateSnapshotFrame({
    frameDocument: printFrame.frameDocument,
    frameWindow: printFrame.frameWindow,
    onBlocked,
  });
  if (!isValid) {
    printFrame.frameElement.remove();
    return false;
  }

  try {
    await onBeforePrint?.({
      frameDocument: printFrame.frameDocument,
      frameElement: printFrame.frameElement,
      frameWindow: printFrame.frameWindow,
      source: snapshot.source,
    });
  } catch (error) {
    printFrame.frameElement.remove();
    throw error;
  }

  printFrame.frameWindow.print();

  window.setTimeout(() => {
    printFrame.frameElement.remove();
  }, cleanupDelayMs);

  return true;
};
