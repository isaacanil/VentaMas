import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const requestedPort = Number(process.env.PRINT_HOST_QA_PORT || 5186);
let port = requestedPort;
let baseUrl = `http://127.0.0.1:${port}`;
const tempDir = path.join(rootDir, '.tmp', 'print-pagination-host-harness');
const harnessHtmlPath = path.join(tempDir, 'index.html');
const harnessEntryPath = path.join(tempDir, 'harness.tsx');
const screenshotDir = path.join(rootDir, '.tmp', 'print-pagination-host');
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
        { stdio: 'ignore' },
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
      if (response.ok) return;
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
    <title>Paginated invoice host QA</title>
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
    `import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { PaginatedInvoicePrintHost } from '/src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/PaginatedPrintHost/PaginatedInvoicePrintHost.tsx';
import type { InvoiceBusinessInfo, InvoiceData, InvoiceProduct } from '/src/types/invoice.ts';

type CaseId =
  | 'freeze-blocked'
  | 'freeze-error'
  | 'happy'
  | 'overflow'
  | 'source-missing'
  | 'timeout';

type HostEvent =
  | { type: 'fallback'; reason: string }
  | { type: 'printed' };

declare global {
  interface Window {
    __hostEvents?: HostEvent[];
    __hostForceMissingSource?: boolean;
    __hostPrintCalls?: number;
  }
}

const business: InvoiceBusinessInfo = {
  address: 'Av. Independencia 45, Santo Domingo',
  email: 'facturacion@ventamas.test',
  name: 'VentaMas Demo SRL',
  rnc: '132000001',
  tel: '809-555-0101',
};

const buildProduct = (index: number, overflow = false): InvoiceProduct => ({
  id: overflow ? 'overflow-line' : \`product-\${index}\`,
  name: overflow ? 'Producto imposible' : \`Producto fiscal \${index}\`,
  amountToBuy: 1,
  barcode: \`P\${String(index).padStart(4, '0')}\`,
  comment: overflow
    ? Array.from({ length: 700 }, (_, itemIndex) => \`Linea imposible \${itemIndex + 1}\`).join(' ')
    : undefined,
  pricing: {
    price: 100 + index,
    tax: { tax: 18 },
  },
});

const buildInvoice = (caseId: CaseId): InvoiceData => {
  const overflow = caseId === 'overflow';
  const products = overflow
    ? [buildProduct(1, true)]
    : Array.from({ length: 12 }, (_, index) => buildProduct(index + 1));
  const subtotal = products.reduce(
    (sum, product) => sum + Number(product.pricing?.price || 0),
    0,
  );
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return {
    id: 'invoice-' + caseId,
    numberID: overflow ? 9002 : caseId === 'happy' ? 9001 : 9010,
    NCF: overflow
      ? 'B010000009002'
      : caseId === 'happy'
        ? 'B010000009001'
        : 'B010000009' + String(10 + caseId.length).padStart(3, '0'),
    date: '2026-06-22',
    client: {
      address: 'Calle Principal 2',
      name: 'GI SYS SRL',
      rnc: '132619201',
      tel: '809-555-2222',
    },
    paymentMethod: [{ method: 'cash', status: true, value: total }],
    products,
    totalPurchase: { value: total },
    totalPurchaseWithoutTaxes: { value: subtotal },
    totalTaxes: { value: tax },
  };
};

function Harness() {
  const [caseId, setCaseId] = useState<CaseId>('happy');
  const [pending, setPending] = useState(false);
  const invoice = useMemo(() => buildInvoice(caseId), [caseId]);
  const originalResizeObserver = React.useRef(window.ResizeObserver);

  useEffect(() => {
    const originalAppendChild = document.body.appendChild.bind(document.body);
    document.body.appendChild = ((node: Node) => {
      const result = originalAppendChild(node);

      if (node instanceof HTMLIFrameElement && node.contentWindow) {
        Object.defineProperty(node.contentWindow, 'print', {
          configurable: true,
          value: () => {
            window.__hostPrintCalls = (window.__hostPrintCalls || 0) + 1;
          },
        });
      }

      return result;
    }) as typeof document.body.appendChild;

    return () => {
      document.body.appendChild = originalAppendChild;
    };
  }, []);

  useEffect(() => {
    const originalQuerySelector = Element.prototype.querySelector;

    Element.prototype.querySelector = function patchedQuerySelector(selectors: string) {
      if (
        window.__hostForceMissingSource &&
        selectors === '[data-print-pagination-pages]' &&
        this instanceof HTMLElement &&
        this.getAttribute('aria-hidden') === 'true'
      ) {
        return null;
      }

      return originalQuerySelector.call(this, selectors);
    };

    return () => {
      Element.prototype.querySelector = originalQuerySelector;
      window.ResizeObserver = originalResizeObserver.current;
    };
  }, []);

  const printFrozenDocument = useMemo(() => {
    if (caseId === 'freeze-blocked') {
      return async () => false;
    }

    if (caseId === 'freeze-error') {
      return async () => {
        throw new Error('QA forced frozen print error');
      };
    }

    return undefined;
  }, [caseId]);

  const runCase = (nextCaseId: CaseId) => {
    window.__hostEvents = [];
    window.__hostForceMissingSource = nextCaseId === 'source-missing';
    window.__hostPrintCalls = 0;
    window.ResizeObserver =
      nextCaseId === 'timeout' ? undefined : originalResizeObserver.current;
    setCaseId(nextCaseId);
    setPending(true);
  };

  return (
    <main style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <h1>Host paginado QA</h1>
      <button type="button" onClick={() => runCase('happy')}>Happy path</button>
      <button type="button" onClick={() => runCase('overflow')}>Overflow fallback</button>
      <button type="button" onClick={() => runCase('source-missing')}>Source missing fallback</button>
      <button type="button" onClick={() => runCase('freeze-blocked')}>Freeze blocked fallback</button>
      <button type="button" onClick={() => runCase('freeze-error')}>Freeze error fallback</button>
      <button type="button" onClick={() => runCase('timeout')}>Timeout fallback</button>
      <p data-testid="status">
        Caso: {caseId} | Pending: {pending ? 'si' : 'no'} | Eventos:{' '}
        {JSON.stringify(window.__hostEvents || [])}
      </p>
      <PaginatedInvoicePrintHost
        business={business}
        invoice={invoice}
        pending={pending}
        onFallbackToLegacyPrint={(reason) => {
          window.__hostEvents = [...(window.__hostEvents || []), { type: 'fallback', reason }];
          window.__hostForceMissingSource = false;
          window.ResizeObserver = originalResizeObserver.current;
          setPending(false);
        }}
        onPrinted={() => {
          window.__hostEvents = [...(window.__hostEvents || []), { type: 'printed' }];
          window.__hostForceMissingSource = false;
          window.ResizeObserver = originalResizeObserver.current;
          setPending(false);
        }}
        printFrozenDocument={printFrozenDocument}
        readyTimeoutMs={caseId === 'timeout' ? 250 : undefined}
      />
    </main>
  );
}

const rootElement = document.getElementById('root') as HTMLElement & {
  __hostQaRoot?: ReturnType<typeof createRoot>;
};

rootElement.__hostQaRoot ??= createRoot(rootElement);
rootElement.__hostQaRoot.render(<Harness />);
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

const readHostState = (page) =>
  page.evaluate(() => ({
    events: window.__hostEvents || [],
    printCalls: window.__hostPrintCalls || 0,
    text: document.body.innerText,
  }));

const assertFallbackCase = async ({
  buttonName,
  caseName,
  expectedCode,
  expectedReasonPart,
  page,
}) => {
  await page.getByRole('button', { name: buttonName }).click();
  await page.waitForFunction(
    () => (window.__hostEvents || []).some((event) => event.type === 'fallback'),
    undefined,
    { timeout: 20_000 },
  );
  const state = await readHostState(page);
  const fallback = state.events.find((event) => event.type === 'fallback');

  if (!fallback?.reason?.includes(expectedCode)) {
    throw new Error(
      `${caseName}: razon inesperada ${fallback?.reason || '<sin razon>'}.`,
    );
  }

  if (expectedReasonPart && !fallback.reason.includes(expectedReasonPart)) {
    throw new Error(
      `${caseName}: falta ${expectedReasonPart} en ${fallback.reason}.`,
    );
  }

  if (state.printCalls !== 0) {
    throw new Error(
      `${caseName}: no debio imprimir por motor nuevo, recibio ${state.printCalls}.`,
    );
  }

  console.log(
    JSON.stringify({
      case: caseName,
      events: state.events,
      printCalls: state.printCalls,
    }),
  );
  await page.screenshot({ fullPage: true, path: screenshotPath(caseName) });
};

const runHostQa = async () => {
  port = await resolveAvailablePort(requestedPort);
  baseUrl = `http://127.0.0.1:${port}`;
  if (port !== requestedPort) {
    console.warn(`Puerto ${requestedPort} ocupado; usando ${port} para QA visual.`);
  }

  console.log('Preparing paginated print host harness...');
  await createHarness();
  console.log(`Starting Vite on ${baseUrl}...`);
  const vite = startVite();
  let browser = null;

  try {
    await waitForVite();
    browser = await launchChromiumLikeBrowser();
    const page = await browser.newPage({
      deviceScaleFactor: 1,
      viewport: { height: 900, width: 1200 },
    });

    await page.goto(toViteFsUrl(harnessHtmlPath), {
      timeout: 30_000,
      waitUntil: 'domcontentloaded',
    });

    await page.getByRole('button', { name: 'Happy path' }).click();
    await page.waitForFunction(
      () => (window.__hostEvents || []).some((event) => event.type === 'printed'),
      undefined,
      { timeout: 20_000 },
    );
    let state = await readHostState(page);
    if (state.printCalls !== 1) {
      throw new Error(`Happy path: esperaba 1 print, recibio ${state.printCalls}.`);
    }
    console.log(JSON.stringify({ case: 'happy', printCalls: state.printCalls, events: state.events }));
    await page.screenshot({ fullPage: true, path: screenshotPath('happy') });

    await assertFallbackCase({
      buttonName: 'Overflow fallback',
      caseName: 'overflow',
      expectedCode: 'paginated-print-layout-blocked',
      expectedReasonPart: 'overflowBlocks=',
      page,
    });
    await assertFallbackCase({
      buttonName: 'Source missing fallback',
      caseName: 'source-missing',
      expectedCode: 'paginated-print-source-missing',
      expectedReasonPart: 'ready=yes',
      page,
    });
    await assertFallbackCase({
      buttonName: 'Freeze blocked fallback',
      caseName: 'freeze-blocked',
      expectedCode: 'paginated-print-freeze-blocked',
      expectedReasonPart: 'ready=yes',
      page,
    });
    await assertFallbackCase({
      buttonName: 'Freeze error fallback',
      caseName: 'freeze-error',
      expectedCode: 'paginated-print-error',
      expectedReasonPart: 'ready=yes',
      page,
    });
    await assertFallbackCase({
      buttonName: 'Timeout fallback',
      caseName: 'timeout',
      expectedCode: 'paginated-print-timeout',
      expectedReasonPart: 'ready=no',
      page,
    });

    console.log(`Screenshots: ${screenshotDir}`);
  } finally {
    if (browser) {
      await browser.close();
    }

    await stopProcessTree(vite);
    await rm(tempDir, { force: true, recursive: true });
  }
};

runHostQa().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
