import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const requestedPort = Number(process.env.PRINT_DOCUMENTS_QA_PORT || 5185);
let port = requestedPort;
let baseUrl = `http://127.0.0.1:${port}`;
const tempDir = path.join(
  rootDir,
  '.tmp',
  'print-pagination-real-documents-harness',
);
const harnessHtmlPath = path.join(tempDir, 'index.html');
const harnessEntryPath = path.join(tempDir, 'harness.tsx');
const screenshotDir = path.join(rootDir, '.tmp', 'print-pagination-real-documents');
const screenshotPath = (caseName) => path.join(screenshotDir, `${caseName}.png`);

const toViteFsUrl = (filePath) =>
  `${baseUrl}/@fs/${filePath.replaceAll(path.sep, '/')}`;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const canListenOnPort = (candidatePort) =>
  new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(candidatePort, '127.0.0.1');
  });

const resolveAvailablePort = async (initialPort) => {
  for (
    let candidatePort = initialPort;
    candidatePort < initialPort + 20;
    candidatePort += 1
  ) {
    if (await canListenOnPort(candidatePort)) {
      return candidatePort;
    }
  }

  throw new Error(
    `No se encontro un puerto libre entre ${initialPort} y ${initialPort + 19}.`,
  );
};

const stopProcessTree = async (child) => {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === 'win32') {
    await new Promise((resolve) => {
      const taskkill = spawn(
        'taskkill.exe',
        ['/PID', String(child.pid), '/T', '/F'],
        {
          stdio: 'ignore',
        },
      );
      taskkill.on('exit', () => resolve());
      taskkill.on('error', () => resolve());
    });
    return;
  }

  child.kill('SIGTERM');
};

const waitForVite = async () => {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < 60_000) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await wait(250);
  }

  throw new Error(
    `Vite no respondio en ${baseUrl}. ${lastError?.message || ''}`.trim(),
  );
};

const createHarness = async () => {
  await mkdir(tempDir, { recursive: true });
  await mkdir(screenshotDir, { recursive: true });
  await writeFile(
    harnessHtmlPath,
    `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Fiscal document pagination QA</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
      import RefreshRuntime from '/@react-refresh';
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
      window.__vite_plugin_react_preamble_installed__ = true;
    </script>
    <script type="module" src="./harness.tsx"></script>
  </body>
</html>
`,
    'utf8',
  );
  await writeFile(
    harnessEntryPath,
    `import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import styled from 'styled-components';

import { printFrozenPaginatedDocument } from '/src/components/DocumentPagination/browser.ts';
import { FiscalDocumentPagination } from '/src/modules/invoice/components/FiscalDocumentPagination/FiscalDocumentPagination.tsx';
import { creditNoteToInvoicePrintData, debitNoteToInvoicePrintData } from '/src/modules/invoice/utils/adjustmentNotePrintData.ts';
import type { InvoiceBusinessInfo, InvoiceData, InvoiceProduct } from '/src/types/invoice.ts';
import type { PaginationRuntimeState } from '/src/components/DocumentPagination/index.ts';

type CaseId = 'invoice-short' | 'invoice-two-pages' | 'invoice-long' | 'invoice-ecf' | 'credit-note' | 'debit-note' | 'overflow';

type AssetImageState = {
  alt: string;
  count: number;
  loadedCount: number;
  sources: string[];
};

type FrozenPrintState = {
  assetImages: AssetImageState[];
  bodyChildCount: number;
  brokenImages: string[];
  buttonCount: number;
  firstChildIsPages: boolean;
  harnessLeaks: string[];
  overflows: string[];
  pageCount: number;
  pageDetails: Array<{
    bodyRect: DOMRect | null;
    footerRect: DOMRect | null;
    footerText: string;
    headerRect: DOMRect | null;
    headerText: string;
    pageNumber: string;
    pageRect: DOMRect;
    role: string;
  }>;
  paginationRootCount: number;
  ready: boolean;
  sections: Array<string | null>;
  visibleText: string;
};

const Shell = styled.main\`
  min-height: 100vh;
  padding: 24px;
  background: #eef2f7;
  color: #172033;
  font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
\`;

const Toolbar = styled.div\`
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 18px;
  padding: 10px;
  background: #fff;
  border: 1px solid #d8dee8;
  border-radius: 8px;
\`;

const ToolbarButton = styled.button<{ $active?: boolean }>\`
  padding: 8px 10px;
  color: \${({ $active }) => ($active ? '#fff' : '#172033')};
  background: \${({ $active }) => ($active ? '#2456a6' : '#f8fafc')};
  border: 1px solid #b7c9df;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
\`;

const PrintButton = styled.button\`
  margin-left: auto;
  padding: 8px 12px;
  color: #fff;
  background: #2f6f4e;
  border: 0;
  border-radius: 6px;
  font-weight: 800;

  &:disabled {
    color: #667085;
    background: #d8dee8;
  }
\`;

const Status = styled.span\`
  color: #52606d;
  font-size: 12px;
  font-weight: 700;
\`;

const ASSET_IMAGE_ALTS = [
  'Logo del negocio',
  'Firma del negocio',
  'Sello del negocio',
] as const;

const DEMO_LOGO_URL =
  'data:image/svg+xml;utf8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2096%2072%22%3E%3Crect%20width=%2296%22%20height=%2272%22%20rx=%228%22%20fill=%22%232456a6%22/%3E%3Ctext%20x=%2248%22%20y=%2240%22%20font-family=%22Arial%22%20font-size=%2218%22%20font-weight=%22700%22%20text-anchor=%22middle%22%20fill=%22white%22%3EVM%3C/text%3E%3C/svg%3E';
const DEMO_SIGNATURE_URL =
  'data:image/svg+xml;utf8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%20126%2050%22%3E%3Cpath%20d=%22M8%2034%20C28%2012%2042%2048%2058%2026%20S88%2020%20118%2034%22%20fill=%22none%22%20stroke=%22%23172033%22%20stroke-width=%223%22%20stroke-linecap=%22round%22/%3E%3C/svg%3E';
const DEMO_STAMP_URL =
  'data:image/svg+xml;utf8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2058%2058%22%3E%3Ccircle%20cx=%2229%22%20cy=%2229%22%20r=%2224%22%20fill=%22none%22%20stroke=%22%23b42318%22%20stroke-width=%224%22/%3E%3Ctext%20x=%2229%22%20y=%2234%22%20font-family=%22Arial%22%20font-size=%2210%22%20font-weight=%22700%22%20text-anchor=%22middle%22%20fill=%22%23b42318%22%3ESELLO%3C/text%3E%3C/svg%3E';

const business: InvoiceBusinessInfo = {
  address: 'Av. Independencia 45, Santo Domingo',
  email: 'facturacion@ventamas.test',
  fiscal: {
    branchName: 'Sucursal Central',
    countryCode: 'DO',
    municipalityName: 'Santo Domingo',
    provinceName: 'Distrito Nacional',
    sectorName: 'Piantini',
  },
  name: 'VentaMas Demo SRL',
  logoUrl: DEMO_LOGO_URL,
  rnc: '132000001',
  tel: '809-555-0101',
  invoice: {
    invoiceMessage: 'Gracias por su compra.',
    signatureAssets: {
      enabled: true,
      signature: { offsetX: 4, offsetY: -3, scale: 1.05 },
      signatureUrl: DEMO_SIGNATURE_URL,
      stamp: { offsetX: -5, offsetY: 2, opacity: 0.8, scale: 0.88 },
      stampUrl: DEMO_STAMP_URL,
    },
  },
};

const buildProduct = (index: number, long = false): InvoiceProduct => {
  const unitPrice = 100 + index * 3;
  const tax = index % 5 === 0 ? 0 : 18;
  const amountToBuy = (index % 3) + 1;
  return {
    id: \`product-\${index}\`,
    name: \`Producto fiscal \${index}\`,
    amountToBuy,
    barcode: \`P\${String(index).padStart(4, '0')}\`,
    brand: index % 4 === 0 ? 'VentaMas' : undefined,
    comment: long
      ? 'Linea con comentario largo para validar medicion DOM real y ajuste de altura dentro de una fila atomica.'
      : undefined,
    measurement: 'unidad',
    pricing: {
      price: unitPrice,
      tax: { tax },
    },
    selectedSaleUnit: {
      pricing: {
        price: unitPrice,
        tax: { tax },
      },
    },
  };
};

const calculateTotals = (products: InvoiceProduct[]) => {
  const subtotal = products.reduce((sum, product) => {
    const price = Number(product.pricing?.price || 0);
    const quantity = Number(product.amountToBuy || 0);
    return sum + price * quantity;
  }, 0);
  const tax = products.reduce((sum, product) => {
    const price = Number(product.pricing?.price || 0);
    const quantity = Number(product.amountToBuy || 0);
    const taxRate = Number((product.pricing?.tax as { tax?: number })?.tax || product.pricing?.tax || 0);
    return sum + price * quantity * (taxRate / 100);
  }, 0);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round((subtotal + tax) * 100) / 100,
  };
};

const buildInvoice = ({
  count,
  electronic = false,
  overflow = false,
}: {
  count: number;
  electronic?: boolean;
  overflow?: boolean;
}): InvoiceData => {
  const products = overflow
    ? [
        {
          ...buildProduct(1),
          id: 'overflow-line',
          comment: Array.from({ length: 650 }, (_, index) => \`Linea imposible \${index + 1}\`).join(' '),
        },
      ]
    : Array.from({ length: count }, (_, index) => buildProduct(index + 1, index % 6 === 0));
  const totals = calculateTotals(products);

  return {
    id: electronic ? 'invoice-ecf' : overflow ? 'invoice-overflow' : \`invoice-\${count}\`,
    numberID: electronic ? 2031 : overflow ? 2999 : 1000 + count,
    NCF: electronic ? 'E310000000123' : 'B010000000123',
    eNcf: electronic ? 'E310000000123' : undefined,
    fiscalMode: electronic ? 'electronic_ecf' : 'legacy_ncf',
    documentFormat: electronic ? 'electronic' : 'traditional',
    date: '2026-06-21',
    dueDate: '2026-07-21',
    client: {
      address: 'Calle Principal 2',
      countryCode: 'DO',
      municipalityName: 'Santo Domingo Este',
      name: 'GI SYS SRL',
      provinceName: 'Santo Domingo',
      rnc: '132619201',
      sectorName: 'Alma Rosa',
      tel: '809-555-2222',
    },
    products,
    paymentMethod: [{ method: 'cash', status: true, value: totals.total }],
    totalPurchaseWithoutTaxes: { value: totals.subtotal },
    totalTaxes: { value: totals.tax },
    totalPurchase: { value: totals.total },
    electronicTaxReceipt: electronic
      ? {
          documentType: 'E31',
          eNcf: 'E310000000123',
          qr: { url: 'https://ecf.dgii.gov.do/testecf/consulta?id=1' },
          securityCode: 'ABC123',
          dgiiValidationStatus: 'accepted',
          dgiiTrackId: 'track-ecf-1',
        }
      : null,
  };
};

const buildCreditNote = () =>
  creditNoteToInvoicePrintData({
    id: 'credit-1',
    numberID: 12,
    eNcf: 'E340000000001',
    client: { name: 'GI SYS SRL', rnc: '132619201' },
    invoiceNcf: 'E310000000001',
    modificationCode: '3',
    reason: 'Devolucion parcial',
    totalAmount: 118,
    items: [
      {
        id: 'line-1',
        name: 'Producto devuelto',
        amountToBuy: 1,
        pricing: { price: 100, tax: 18 },
      },
    ],
    electronicTaxReceipt: {
      documentType: 'E34',
      eNcf: 'E340000000001',
      securityCode: 'CRED123',
    },
  });

const buildDebitNote = () =>
  debitNoteToInvoicePrintData({
    id: 'debit-1',
    numberID: 15,
    invoiceNumber: 720,
    reason: 'Ajuste de precio',
    taxAmount: 18,
    totalAmount: 118,
    electronicTaxReceipt: {
      documentType: 'E33',
      eNcf: 'E330000000001',
      securityCode: 'DEB123',
    },
    items: [],
  });

const cases: Array<{ id: CaseId; label: string }> = [
  { id: 'invoice-short', label: 'Factura corta' },
  { id: 'invoice-two-pages', label: 'Factura 2 paginas' },
  { id: 'invoice-long', label: 'Factura larga' },
  { id: 'invoice-ecf', label: 'Factura e-CF' },
  { id: 'credit-note', label: 'Nota credito' },
  { id: 'debit-note', label: 'Nota debito' },
  { id: 'overflow', label: 'Bloque gigante' },
];

const readAssetImages = (targetDocument: Document): AssetImageState[] =>
  ASSET_IMAGE_ALTS.map((alt) => {
    const images = Array.from(
      targetDocument.querySelectorAll<HTMLImageElement>(
        \`img[alt="\${alt}"]\`,
      ),
    );

    return {
      alt,
      count: images.length,
      loadedCount: images.filter(
        (image) =>
          image.complete &&
          (image.naturalWidth > 0 || image.naturalHeight > 0),
      ).length,
      sources: images.map((image) => image.currentSrc || image.src),
    };
  });

const readFrozenDocumentState = (targetDocument: Document): FrozenPrintState => {
  const root = targetDocument.querySelector('[data-print-pagination-pages]');
  const firstElement = targetDocument.body.firstElementChild;
  const pages = Array.from(
    targetDocument.querySelectorAll('[data-print-pagination-page]'),
  );
  const toRect = (rect: DOMRect) => ({
    bottom: rect.bottom,
    height: rect.height,
    left: rect.left,
    right: rect.right,
    top: rect.top,
    width: rect.width,
  }) as DOMRect;
  const overflows = pages.flatMap((pageElement, index) => {
    const pageNumber =
      pageElement.getAttribute('data-print-pagination-page-number') ||
      \`\${index + 1}\`;
    const targets = [
      ['page', pageElement],
      ['header', pageElement.querySelector('[data-print-pagination-page-header]')],
      ['body', pageElement.querySelector('[data-print-pagination-page-body]')],
      ['footer', pageElement.querySelector('[data-print-pagination-page-footer]')],
    ].filter((entry): entry is [string, Element] => Boolean(entry[1]));

    return targets.flatMap(([targetName, targetElement]) => {
      const axes = [];
      if (targetElement.scrollHeight - targetElement.clientHeight > 2) axes.push('vertical');
      if (targetElement.scrollWidth - targetElement.clientWidth > 2) axes.push('horizontal');
      return axes.map((axis) => \`\${pageNumber}:\${targetName}:\${axis}\`);
    });
  });
  const pageDetails = pages.map((pageElement, index) => {
    const pageNumber =
      pageElement.getAttribute('data-print-pagination-page-number') ||
      \`\${index + 1}\`;
    const header = pageElement.querySelector(
      '[data-print-pagination-page-header]',
    );
    const body = pageElement.querySelector('[data-print-pagination-page-body]');
    const footer = pageElement.querySelector(
      '[data-print-pagination-page-footer]',
    );
    const headerRect = header?.getBoundingClientRect();
    const bodyRect = body?.getBoundingClientRect();
    const footerRect = footer?.getBoundingClientRect();
    const pageRect = pageElement.getBoundingClientRect();

    return {
      bodyRect: bodyRect ? toRect(bodyRect) : null,
      footerRect: footerRect ? toRect(footerRect) : null,
      footerText: footer?.textContent || '',
      headerRect: headerRect ? toRect(headerRect) : null,
      headerText: header?.textContent || '',
      pageNumber,
      pageRect: toRect(pageRect),
      role: pageElement.getAttribute('data-print-pagination-page-role') || '',
    };
  });
  const visibleText = targetDocument.body.innerText || '';
  const harnessLeaks = [
    'Factura corta',
    'Factura 2 paginas',
    'Factura larga',
    'Factura e-CF',
    'Nota credito',
    'Nota debito',
    'Bloque gigante',
    'Imprimir',
    'Ready:',
  ].filter((text) => visibleText.includes(text));
  const brokenImages = Array.from(targetDocument.images)
    .filter(
      (image) =>
        !image.complete || (image.naturalWidth === 0 && image.naturalHeight === 0),
    )
    .map((image, index) => image.currentSrc || image.src || \`imagen \${index + 1}\`);

  return {
    assetImages: readAssetImages(targetDocument),
    bodyChildCount: targetDocument.body.children.length,
    brokenImages,
    buttonCount: targetDocument.querySelectorAll('button').length,
    firstChildIsPages: firstElement === root,
    harnessLeaks,
    overflows,
    pageCount: pages.length,
    pageDetails,
    paginationRootCount: targetDocument.querySelectorAll(
      '[data-print-pagination-root]',
    ).length,
    ready: root?.getAttribute('data-print-pagination-ready') === 'true',
    sections: Array.from(targetDocument.querySelectorAll('[data-print-section]')).map(
      (element) => element.getAttribute('data-print-section'),
    ),
    visibleText,
  };
};

const resolveCaseData = (caseId: CaseId): InvoiceData => {
  if (caseId === 'invoice-short') return buildInvoice({ count: 3 });
  if (caseId === 'invoice-two-pages') return buildInvoice({ count: 12 });
  if (caseId === 'invoice-long') return buildInvoice({ count: 42 });
  if (caseId === 'invoice-ecf') return buildInvoice({ count: 12, electronic: true });
  if (caseId === 'credit-note') return buildCreditNote();
  if (caseId === 'debit-note') return buildDebitNote();
  return buildInvoice({ count: 1, overflow: true });
};

function Harness() {
  const [caseId, setCaseId] = useState<CaseId>('invoice-short');
  const [runtimeState, setRuntimeState] = useState<PaginationRuntimeState | null>(null);
  const data = useMemo(() => resolveCaseData(caseId), [caseId]);
  const activeCase = cases.find((item) => item.id === caseId) ?? cases[0];
  const handlePrint = async () => {
    const qaWindow = window as typeof window & {
      __frozenPrintCalls?: number;
      __frozenPrintState?: FrozenPrintState | null;
    };
    qaWindow.__frozenPrintCalls = 0;
    qaWindow.__frozenPrintState = null;

    await printFrozenPaginatedDocument({
      cleanupDelayMs: 250,
      title: \`QA \${activeCase.label}\`,
      onBeforePrint: ({ frameDocument, frameWindow }) => {
        qaWindow.__frozenPrintState = readFrozenDocumentState(frameDocument);
        Object.defineProperty(frameWindow, 'print', {
          configurable: true,
          value: () => {
            qaWindow.__frozenPrintCalls = (qaWindow.__frozenPrintCalls ?? 0) + 1;
          },
        });
      },
    });
  };

  return (
    <Shell>
      <Toolbar>
        {cases.map((item) => (
          <ToolbarButton
            key={item.id}
            $active={caseId === item.id}
            onClick={() => {
              setRuntimeState(null);
              setCaseId(item.id);
            }}
            type="button"
          >
            {item.label}
          </ToolbarButton>
        ))}
        <Status>
          Paginas: {runtimeState?.pageCount ?? '-'} | Ready:{' '}
          {runtimeState?.readyToPrint ? 'si' : 'no'}
        </Status>
        <PrintButton
          disabled={!runtimeState?.readyToPrint}
          onClick={handlePrint}
          type="button"
        >
          Imprimir
        </PrintButton>
      </Toolbar>
      <FiscalDocumentPagination
        business={business}
        data={data}
        onPaginationStateChange={setRuntimeState}
        showDebug
      />
    </Shell>
  );
}

const rootElement = document.getElementById('root') as HTMLElement & {
  __fiscalPaginationRoot?: ReturnType<typeof createRoot>;
};

rootElement.__fiscalPaginationRoot ??= createRoot(rootElement);
rootElement.__fiscalPaginationRoot.render(
  <React.StrictMode>
    <Harness />
  </React.StrictMode>,
);
`,
    'utf8',
  );
};

const startVite = () => {
  const viteArgs = [
    'exec',
    '--',
    'vite',
    '--mode',
    'staging',
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '--strictPort',
  ];
  const command = process.platform === 'win32' ? 'cmd.exe' : 'npm';
  const args =
    process.platform === 'win32'
      ? ['/d', '/s', '/c', `npm ${viteArgs.join(' ')}`]
      : viteArgs;
  const child = spawn(command, args, {
    cwd: rootDir,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => process.stdout.write(chunk));
  child.stderr.on('data', (chunk) => process.stderr.write(chunk));

  return child;
};

const launchChromiumLikeBrowser = async () => {
  const attempts = [
    { label: 'Playwright Chromium', options: {} },
    { label: 'Google Chrome', options: { channel: 'chrome' } },
    { label: 'Microsoft Edge', options: { channel: 'msedge' } },
  ];
  let lastError = null;

  for (const attempt of attempts) {
    try {
      console.log(`Launching ${attempt.label}...`);
      return await chromium.launch({
        ...attempt.options,
        timeout: 30_000,
      });
    } catch (error) {
      lastError = error;
      console.warn(
        `${attempt.label} no disponible: ${String(error.message).split('\n')[0]}`,
      );
    }
  }

  throw lastError || new Error('No se encontro un navegador Chromium local.');
};

const readVisualState = async (page) =>
  page.evaluate(() => {
    const assetImageAlts = [
      'Logo del negocio',
      'Firma del negocio',
      'Sello del negocio',
    ];
    const root = document.querySelector('[data-print-pagination-pages]');
    const documentRoot = document.querySelector('[data-print-document-kind]');
    const pages = Array.from(
      document.querySelectorAll('[data-print-pagination-page]'),
    );
    const toRect = (rect) => ({
      bottom: rect.bottom,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      width: rect.width,
    });
    const overflows = pages.flatMap((pageElement, index) => {
      const pageNumber =
        pageElement.getAttribute('data-print-pagination-page-number') ||
        `${index + 1}`;
      const targets = [
        ['page', pageElement],
        ['header', pageElement.querySelector('[data-print-pagination-page-header]')],
        ['body', pageElement.querySelector('[data-print-pagination-page-body]')],
        ['footer', pageElement.querySelector('[data-print-pagination-page-footer]')],
      ].filter((entry) => entry[1]);

      return targets.flatMap(([targetName, targetElement]) => {
        const element = targetElement;
        const axes = [];
        if (element.scrollHeight - element.clientHeight > 2) axes.push('vertical');
        if (element.scrollWidth - element.clientWidth > 2) axes.push('horizontal');
        return axes.map((axis) => `${pageNumber}:${targetName}:${axis}`);
      });
    });
    const pageDetails = pages.map((pageElement, index) => {
      const pageNumber =
        pageElement.getAttribute('data-print-pagination-page-number') ||
        `${index + 1}`;
      const header = pageElement.querySelector(
        '[data-print-pagination-page-header]',
      );
      const body = pageElement.querySelector('[data-print-pagination-page-body]');
      const footer = pageElement.querySelector(
        '[data-print-pagination-page-footer]',
      );
      const headerRect = header?.getBoundingClientRect();
      const bodyRect = body?.getBoundingClientRect();
      const footerRect = footer?.getBoundingClientRect();
      const pageRect = pageElement.getBoundingClientRect();

      return {
        bodyRect: bodyRect ? toRect(bodyRect) : null,
        footerRect: footerRect ? toRect(footerRect) : null,
        footerText: footer?.textContent || '',
        headerRect: headerRect ? toRect(headerRect) : null,
        headerText: header?.textContent || '',
        pageNumber,
        pageRect: toRect(pageRect),
        role: pageElement.getAttribute('data-print-pagination-page-role') || '',
      };
    });

    return {
      assetImages: assetImageAlts.map((alt) => {
        const images = Array.from(
          document.querySelectorAll(`img[alt="${alt}"]`),
        );

        return {
          alt,
          count: images.length,
          loadedCount: images.filter(
            (image) =>
              image.complete &&
              (image.naturalWidth > 0 || image.naturalHeight > 0),
          ).length,
          sources: images.map((image) => image.currentSrc || image.src),
        };
      }),
      blockIds: Array.from(document.querySelectorAll('[data-print-block-id]')).map(
        (element) => element.getAttribute('data-print-block-id'),
      ),
      documentId: documentRoot?.getAttribute('data-print-document-id') || null,
      documentKind: documentRoot?.getAttribute('data-print-document-kind') || null,
      overflows,
      pageCount: pages.length,
      pageDetails,
      ready: root?.getAttribute('data-print-pagination-ready') === 'true',
      sections: Array.from(document.querySelectorAll('[data-print-section]')).map(
        (element) => element.getAttribute('data-print-section'),
      ),
      visibleText: document.body.innerText,
    };
  });

const readFrozenPrintState = async (page) =>
  page.evaluate(() => ({
    printCalls: window.__frozenPrintCalls || 0,
    state: window.__frozenPrintState || null,
  }));

const resolveExpectedPageRole = (pageNumber, totalPages) => {
  if (totalPages <= 1) return 'single';
  if (pageNumber === 1) return 'first';
  if (pageNumber === totalPages) return 'last';
  return 'middle';
};

const assertPageBoxesDoNotOverlap = (state, label) => {
  const tolerance = 1;
  const failures = state.pageDetails.flatMap((detail) => {
    const { bodyRect, footerRect, headerRect, pageRect, pageNumber } = detail;
    if (!bodyRect || !footerRect || !headerRect) return [];

    return [
      {
        ok: headerRect.top >= pageRect.top - tolerance,
        reason: 'header sale por arriba',
      },
      {
        ok: footerRect.bottom <= pageRect.bottom + tolerance,
        reason: 'footer sale por abajo',
      },
      {
        ok: headerRect.bottom <= bodyRect.top + tolerance,
        reason: 'header se superpone al body',
      },
      {
        ok: bodyRect.bottom <= footerRect.top + tolerance,
        reason: 'body se superpone al footer',
      },
    ]
      .filter((check) => !check.ok)
      .map((check) => `${pageNumber}:${check.reason}`);
  });

  if (failures.length > 0) {
    throw new Error(`${label}: cajas fuera de orden ${failures.join(', ')}.`);
  }
};

const requiredBusinessFiscalTexts = [
  'Sucursal: Sucursal Central',
  'Sector: Piantini',
  'Municipio/Provincia: Santo Domingo, Distrito Nacional',
  'Pais: DO',
];

const assertExpectedAssets = (state, label) => {
  const missingAssets = (state.assetImages || [])
    .filter((imageState) => imageState.count === 0)
    .map((imageState) => imageState.alt);

  if (missingAssets.length > 0) {
    throw new Error(`${label}: faltan assets ${missingAssets.join(', ')}.`);
  }

  const unloadedAssets = (state.assetImages || [])
    .filter((imageState) => imageState.loadedCount !== imageState.count)
    .map(
      (imageState) =>
        `${imageState.alt} ${imageState.loadedCount}/${imageState.count}`,
    );

  if (unloadedAssets.length > 0) {
    throw new Error(
      `${label}: assets no cargados ${unloadedAssets.join(', ')}.`,
    );
  }
};

const assertBusinessFiscalText = (state, label) => {
  const missingTexts = requiredBusinessFiscalTexts.filter(
    (text) => !state.visibleText.includes(text),
  );

  if (missingTexts.length > 0) {
    throw new Error(`${label}: faltan textos fiscales ${missingTexts.join(', ')}.`);
  }
};

const assertReadyState = async (page, label, expectedKind, expectedPageCount) => {
  try {
    await page.waitForSelector(
      '[data-print-pagination-pages][data-print-pagination-ready="true"]',
      { timeout: 20_000 },
    );
  } catch (error) {
    const state = await readVisualState(page).catch(() => null);
    throw new Error(
      `${label}: timeout esperando ready=true. Estado: ${JSON.stringify({
        blockIds: state?.blockIds?.slice(0, 8),
        documentKind: state?.documentKind,
        overflows: state?.overflows,
        pageCount: state?.pageCount,
        text: state?.visibleText?.slice(0, 600),
      })}`,
      { cause: error },
    );
  }
  await page.waitForTimeout(100);
  const state = await readVisualState(page);

  if (!state.ready) {
    throw new Error(`${label}: el documento no quedo listo para imprimir.`);
  }
  if (state.documentKind !== expectedKind) {
    throw new Error(`${label}: tipo esperado ${expectedKind}, recibido ${state.documentKind}.`);
  }
  if (state.overflows.length > 0) {
    throw new Error(`${label}: overflow ${state.overflows.join(', ')}`);
  }
  if (
    typeof expectedPageCount === 'number' &&
    state.pageCount !== expectedPageCount
  ) {
    throw new Error(
      `${label}: esperaba ${expectedPageCount} paginas y recibio ${state.pageCount}.`,
    );
  }

  const pageNumberMismatches = state.pageDetails
    .filter((detail) => {
      const expectedText = `Pagina ${detail.pageNumber} de ${state.pageCount}`;
      return (
        !detail.headerText.includes(expectedText) ||
        !detail.footerText.includes(expectedText)
      );
    })
    .map((detail) => detail.pageNumber);
  if (pageNumberMismatches.length > 0) {
    throw new Error(
      `${label}: header/footer sin numeracion correcta ${pageNumberMismatches.join(', ')}.`,
    );
  }

  const roleMismatches = state.pageDetails
    .filter((detail) => {
      const pageNumber = Number(detail.pageNumber);
      return detail.role !== resolveExpectedPageRole(pageNumber, state.pageCount);
    })
    .map((detail) => `${detail.pageNumber}:${detail.role || 'sin rol'}`);
  if (roleMismatches.length > 0) {
    throw new Error(`${label}: roles incorrectos ${roleMismatches.join(', ')}.`);
  }

  const nonLastMissingContinuation = state.pageDetails
    .slice(0, -1)
    .filter(
      (detail) =>
        !detail.footerText.includes('continua en la pagina siguiente'),
    )
    .map((detail) => detail.pageNumber);
  if (nonLastMissingContinuation.length > 0) {
    throw new Error(
      `${label}: paginas no finales sin footer de continuacion ${nonLastMissingContinuation.join(', ')}.`,
    );
  }

  const lastPage = state.pageDetails.at(-1);
  if (lastPage && !lastPage.footerText.includes('Recibido Conforme')) {
    throw new Error(`${label}: ultima pagina sin firma de recibido.`);
  }

  assertExpectedAssets(state, label);
  assertBusinessFiscalText(state, label);
  assertPageBoxesDoNotOverlap(state, label);
  console.log(JSON.stringify({ label, pageCount: state.pageCount, kind: state.documentKind }));
  return state;
};

const assertFrozenPrintState = async (page, label, expectedPageCount) => {
  await page.getByRole('button', { name: 'Imprimir' }).click();
  await page.waitForFunction(
    () => window.__frozenPrintState && window.__frozenPrintCalls === 1,
    undefined,
    { timeout: 20_000 },
  );

  const { printCalls, state } = await readFrozenPrintState(page);

  if (!state) {
    throw new Error(`${label}: no se capturo el iframe congelado.`);
  }
  if (printCalls !== 1) {
    throw new Error(`${label}: esperaba 1 llamada a print(), recibio ${printCalls}.`);
  }
  if (!state.ready) {
    throw new Error(`${label}: el iframe congelado no preservo ready=true.`);
  }
  if (!state.firstChildIsPages || state.bodyChildCount !== 1) {
    throw new Error(
      `${label}: el iframe congelado no contiene solo el documento paginado.`,
    );
  }
  if (state.buttonCount !== 0 || state.paginationRootCount !== 0) {
    throw new Error(`${label}: iframe congelado incluyo controles del harness.`);
  }
  if (state.pageCount !== expectedPageCount) {
    throw new Error(
      `${label}: iframe congelado esperaba ${expectedPageCount} paginas y recibio ${state.pageCount}.`,
    );
  }
  if (state.overflows.length > 0) {
    throw new Error(
      `${label}: iframe congelado con overflow ${state.overflows.join(', ')}.`,
    );
  }
  if (state.brokenImages.length > 0) {
    throw new Error(
      `${label}: iframe congelado con imagenes no cargadas ${state.brokenImages.join(', ')}.`,
    );
  }
  if (state.harnessLeaks.length > 0) {
    throw new Error(
      `${label}: iframe congelado incluyo UI del harness ${state.harnessLeaks.join(', ')}.`,
    );
  }
  assertExpectedAssets(state, `${label} iframe congelado`);
  assertBusinessFiscalText(state, `${label} iframe congelado`);

  const pageNumberMismatches = state.pageDetails
    .filter((detail) => {
      const expectedText = `Pagina ${detail.pageNumber} de ${state.pageCount}`;
      return (
        !detail.headerText.includes(expectedText) ||
        !detail.footerText.includes(expectedText)
      );
    })
    .map((detail) => detail.pageNumber);
  if (pageNumberMismatches.length > 0) {
    throw new Error(
      `${label}: iframe congelado sin numeracion correcta ${pageNumberMismatches.join(', ')}.`,
    );
  }

  const roleMismatches = state.pageDetails
    .filter((detail) => {
      const pageNumber = Number(detail.pageNumber);
      return detail.role !== resolveExpectedPageRole(pageNumber, state.pageCount);
    })
    .map((detail) => `${detail.pageNumber}:${detail.role || 'sin rol'}`);
  if (roleMismatches.length > 0) {
    throw new Error(
      `${label}: iframe congelado con roles incorrectos ${roleMismatches.join(', ')}.`,
    );
  }

  const nonLastMissingContinuation = state.pageDetails
    .slice(0, -1)
    .filter(
      (detail) =>
        !detail.footerText.includes('continua en la pagina siguiente'),
    )
    .map((detail) => detail.pageNumber);
  if (nonLastMissingContinuation.length > 0) {
    throw new Error(
      `${label}: iframe congelado sin footer de continuacion ${nonLastMissingContinuation.join(', ')}.`,
    );
  }

  const lastPage = state.pageDetails.at(-1);
  if (lastPage && !lastPage.footerText.includes('Recibido Conforme')) {
    throw new Error(`${label}: iframe congelado sin firma final.`);
  }

  assertPageBoxesDoNotOverlap(state, `${label} iframe congelado`);
  console.log(
    JSON.stringify({
      frozenPrint: label,
      pageCount: state.pageCount,
      printCalls,
    }),
  );
  return state;
};

const clickCase = async (page, label) => {
  await page.getByRole('button', { name: label }).click();
};

const runVisualQa = async () => {
  port = await resolveAvailablePort(requestedPort);
  baseUrl = `http://127.0.0.1:${port}`;
  if (port !== requestedPort) {
    console.warn(`Puerto ${requestedPort} ocupado; usando ${port} para QA visual.`);
  }

  console.log('Preparing real document pagination visual harness...');
  await createHarness();
  console.log(`Starting Vite on ${baseUrl}...`);
  const vite = startVite();
  let browser = null;

  try {
    await waitForVite();
    browser = await launchChromiumLikeBrowser();
    const page = await browser.newPage({
      deviceScaleFactor: 1,
      viewport: {
        height: 1200,
        width: 1440,
      },
    });

    await page.goto(toViteFsUrl(harnessHtmlPath), {
      timeout: 30_000,
      waitUntil: 'domcontentloaded',
    });
    await page.waitForSelector('[data-print-document-kind]', {
      timeout: 20_000,
    });

    let state = await assertReadyState(page, 'Factura corta', 'invoice', 1);
    if (!state.sections.includes('summary') || !state.sections.includes('signatures')) {
      throw new Error('Factura corta: faltan secciones summary/signatures.');
    }
    await page.screenshot({ fullPage: true, path: screenshotPath('invoice-short') });

    await clickCase(page, 'Factura 2 paginas');
    state = await assertReadyState(page, 'Factura 2 paginas', 'invoice', undefined);
    await assertFrozenPrintState(page, 'Factura 2 paginas', state.pageCount);
    await page.screenshot({ fullPage: true, path: screenshotPath('invoice-two-pages') });

    await clickCase(page, 'Factura larga');
    state = await assertReadyState(page, 'Factura larga', 'invoice', undefined);
    if (state.pageCount < 3) {
      throw new Error(`Factura larga: esperaba 3+ paginas y recibio ${state.pageCount}.`);
    }
    await page.screenshot({ fullPage: true, path: screenshotPath('invoice-long') });

    await clickCase(page, 'Factura e-CF');
    state = await assertReadyState(page, 'Factura e-CF', 'invoice', undefined);
    if (!state.visibleText.includes('Codigo seguridad') || !state.sections.includes('ecf')) {
      throw new Error('Factura e-CF: falta seccion fiscal electronica.');
    }
    await assertFrozenPrintState(page, 'Factura e-CF', state.pageCount);
    await page.screenshot({ fullPage: true, path: screenshotPath('invoice-ecf') });

    await clickCase(page, 'Nota credito');
    state = await assertReadyState(page, 'Nota credito', 'creditNote', undefined);
    if (!state.visibleText.includes('NOTA DE CRÉDITO ELECTRÓNICA')) {
      throw new Error('Nota credito: falta titulo fiscal.');
    }
    await page.screenshot({ fullPage: true, path: screenshotPath('credit-note') });

    await clickCase(page, 'Nota debito');
    state = await assertReadyState(page, 'Nota debito', 'debitNote', undefined);
    if (!state.visibleText.includes('NOTA DE DÉBITO ELECTRÓNICA')) {
      throw new Error('Nota debito: falta titulo fiscal.');
    }
    await page.screenshot({ fullPage: true, path: screenshotPath('debit-note') });

    await clickCase(page, 'Bloque gigante');
    await page.waitForSelector(
      '[data-print-pagination-pages][data-print-pagination-ready="false"]',
      { timeout: 20_000 },
    );
    state = await readVisualState(page);
    if (
      state.ready ||
      !state.visibleText.includes('product-line-1-overflow-line') ||
      !(await page.getByRole('button', { name: 'Imprimir' }).isDisabled())
    ) {
      throw new Error('Bloque gigante: esperaba bloqueo por overflow y boton deshabilitado.');
    }
    await page.screenshot({ fullPage: true, path: screenshotPath('overflow') });

    console.log(`Screenshots: ${screenshotDir}`);
  } finally {
    if (browser) {
      await browser.close();
    }

    await stopProcessTree(vite);
    await rm(tempDir, { force: true, recursive: true });
  }
};

runVisualQa().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
