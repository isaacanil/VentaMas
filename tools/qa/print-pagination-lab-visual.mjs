import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const requestedPort = Number(process.env.PRINT_PAGINATION_QA_PORT || 5184);
let port = requestedPort;
let baseUrl = `http://127.0.0.1:${port}`;
const tempDir = path.join(rootDir, '.tmp', 'print-pagination-lab-visual');
const harnessHtmlPath = path.join(tempDir, 'index.html');
const harnessEntryPath = path.join(tempDir, 'harness.tsx');
const screenshotPath = (caseName) =>
  path.join(rootDir, '.tmp', `print-pagination-lab-${caseName}.png`);
const screenshotGlobLabel = path.join(rootDir, '.tmp', 'print-pagination-lab-*.png');

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
  await writeFile(
    harnessHtmlPath,
    `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Print pagination visual QA</title>
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
    `import React from 'react';
import { createRoot } from 'react-dom/client';

import PrintPaginationLab from '/src/modules/dev/pages/DevTools/PrintPaginationLab/PrintPaginationLab.tsx';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrintPaginationLab />
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
  const child = spawn(
    command,
    args,
    {
      cwd: rootDir,
      env: {
        ...process.env,
        VITE_ENABLE_DEV_ROUTES: 'true',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  child.stdout.on('data', (chunk) => process.stdout.write(chunk));
  child.stderr.on('data', (chunk) => process.stderr.write(chunk));

  return child;
};

const launchChromiumLikeBrowser = async () => {
  const attempts = [
    {
      label: 'Playwright Chromium',
      options: {},
    },
    {
      label: 'Google Chrome',
      options: {
        channel: 'chrome',
      },
    },
    {
      label: 'Microsoft Edge',
      options: {
        channel: 'msedge',
      },
    },
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
    const root = document.querySelector('[data-print-pagination-pages]');
    const pages = Array.from(
      document.querySelectorAll('[data-print-pagination-page]'),
    );
    const toRect = (rect) => ({
      blockSize: rect.height,
      bottom: rect.bottom,
      inlineSize: rect.width,
      left: rect.left,
      right: rect.right,
      top: rect.top,
    });
    const overflows = pages.flatMap((pageElement, index) => {
      const pageNumber =
        pageElement.getAttribute('data-print-pagination-page-number') ||
        `${index + 1}`;
      const body = pageElement.querySelector('[data-print-pagination-page-body]');
      const targets = [
        ['page', pageElement],
        ['body', body],
      ].filter((entry) => entry[1]);

      return targets.flatMap(([targetName, targetElement]) => {
        const element = targetElement;
        const axes = [];

        if (element.scrollHeight - element.clientHeight > 2) {
          axes.push('vertical');
        }
        if (element.scrollWidth - element.clientWidth > 2) {
          axes.push('horizontal');
        }

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
        bodyHeight: bodyRect?.height || 0,
        bodyRect: bodyRect ? toRect(bodyRect) : null,
        footerHeight: footerRect?.height || 0,
        footerRect: footerRect ? toRect(footerRect) : null,
        footerText: footer?.textContent || '',
        hasBody: Boolean(body),
        hasFooter: Boolean(footer),
        hasHeader: Boolean(header),
        headerHeight: headerRect?.height || 0,
        headerRect: headerRect ? toRect(headerRect) : null,
        headerText: header?.textContent || '',
        pageRect: toRect(pageRect),
        pageNumber,
        role: pageElement.getAttribute('data-print-pagination-page-role') || '',
      };
    });

    return {
      hasInvoiceScenario: Boolean(
        document.querySelector('[data-invoice-scenario-header]'),
      ),
      overflows,
      pageDetails,
      pageCount: pages.length,
      ready: root?.getAttribute('data-print-pagination-ready') === 'true',
      visibleText: document.body.innerText,
    };
  });

const resolveExpectedPageRole = (pageNumber, totalPages) => {
  if (totalPages <= 1) {
    return 'single';
  }

  if (pageNumber === 1) {
    return 'first';
  }

  if (pageNumber === totalPages) {
    return 'last';
  }

  return 'middle';
};

const assertPageBoxesDoNotOverlap = (state, label) => {
  const tolerance = 1;
  const failures = state.pageDetails
    .flatMap((detail) => {
      const { bodyRect, footerRect, headerRect, pageRect, pageNumber } = detail;

      if (!bodyRect || !footerRect || !headerRect) {
        return [];
      }

      const checks = [
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
        {
          ok:
            headerRect.left >= pageRect.left - tolerance &&
            headerRect.right <= pageRect.right + tolerance,
          reason: 'header excede el ancho de pagina',
        },
        {
          ok:
            bodyRect.left >= pageRect.left - tolerance &&
            bodyRect.right <= pageRect.right + tolerance,
          reason: 'body excede el ancho de pagina',
        },
        {
          ok:
            footerRect.left >= pageRect.left - tolerance &&
            footerRect.right <= pageRect.right + tolerance,
          reason: 'footer excede el ancho de pagina',
        },
      ];

      return checks
        .filter((check) => !check.ok)
        .map((check) => `${pageNumber}:${check.reason}`);
    })
    .sort();

  if (failures.length > 0) {
    throw new Error(`${label}: cajas fuera de orden ${failures.join(', ')}.`);
  }
};

const assertDynamicChromeText = (state, label) => {
  const isInvoiceScenario = state.hasInvoiceScenario;
  const firstPage = state.pageDetails[0];
  const lastPage = state.pageDetails.at(-1);
  const middlePages = state.pageDetails.slice(1, -1);
  const nonLastPages = state.pageDetails.slice(0, -1);

  if (firstPage && !firstPage.headerText.includes('Cliente:')) {
    throw new Error(`${label}: la primera pagina no muestra datos del cliente.`);
  }

  const missingContinuationHeader = middlePages
    .filter(
      (detail) =>
        !detail.headerText.includes(
          isInvoiceScenario
            ? 'Continuacion de factura'
            : 'Continuacion del documento',
        ),
    )
    .map((detail) => detail.pageNumber);
  if (missingContinuationHeader.length > 0) {
    throw new Error(
      `${label}: paginas intermedias sin header de continuacion ${missingContinuationHeader.join(
        ', ',
      )}.`,
    );
  }

  const missingContinuationFooter = nonLastPages
    .filter(
      (detail) =>
        !detail.footerText.includes('continua en la pagina siguiente'),
    )
    .map((detail) => detail.pageNumber);
  if (missingContinuationFooter.length > 0) {
    throw new Error(
      `${label}: paginas no finales sin footer de continuacion ${missingContinuationFooter.join(
        ', ',
      )}.`,
    );
  }

  if (lastPage && !/Recibido conforme/i.test(lastPage.footerText)) {
    throw new Error(`${label}: la ultima pagina no muestra firmas.`);
  }
};

const assertReadyState = async (page, label, expectedPageCount) => {
  await page.waitForSelector(
    '[data-print-pagination-pages][data-print-pagination-ready="true"]',
    { timeout: 20_000 },
  );
  await page.waitForTimeout(100);

  const state = await readVisualState(page);
  if (!state.ready) {
    throw new Error(`${label}: el documento no quedo listo para imprimir.`);
  }
  if (state.overflows.length > 0) {
    throw new Error(`${label}: overflow ${state.overflows.join(', ')}`);
  }
  const missingChrome = state.pageDetails
    .filter((detail) => !detail.hasHeader || !detail.hasBody || !detail.hasFooter)
    .map((detail) => detail.pageNumber);
  if (missingChrome.length > 0) {
    throw new Error(
      `${label}: faltan header/body/footer en paginas ${missingChrome.join(
        ', ',
      )}.`,
    );
  }

  const collapsedChrome = state.pageDetails
    .filter(
      (detail) =>
        detail.headerHeight <= 0 ||
        detail.bodyHeight <= 0 ||
        detail.footerHeight <= 0,
    )
    .map((detail) => detail.pageNumber);
  if (collapsedChrome.length > 0) {
    throw new Error(
      `${label}: header/body/footer sin alto medible en paginas ${collapsedChrome.join(
        ', ',
      )}.`,
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
      `${label}: header/footer no reflejan pagina correcta en ${pageNumberMismatches.join(
        ', ',
      )}.`,
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
      `${label}: roles de pagina incorrectos ${roleMismatches.join(', ')}.`,
    );
  }
  assertPageBoxesDoNotOverlap(state, label);
  assertDynamicChromeText(state, label);
  if (
    typeof expectedPageCount === 'number' &&
    state.pageCount !== expectedPageCount
  ) {
    throw new Error(
      `${label}: esperaba ${expectedPageCount} paginas y recibio ${state.pageCount}.`,
    );
  }

  console.log(
    JSON.stringify({
      label,
      pageCount: state.pageCount,
      ready: state.ready,
      repeatedChrome: state.pageDetails.length,
    }),
  );
};

const runVisualQa = async () => {
  port = await resolveAvailablePort(requestedPort);
  baseUrl = `http://127.0.0.1:${port}`;
  if (port !== requestedPort) {
    console.warn(
      `Puerto ${requestedPort} ocupado; usando ${port} para QA visual.`,
    );
  }

  console.log('Preparing print pagination visual harness...');
  await createHarness();
  console.log(`Starting Vite on ${baseUrl}...`);
  const vite = startVite();
  let browser = null;

  try {
    await waitForVite();
    console.log('Vite ready. Launching browser...');

    browser = await launchChromiumLikeBrowser();
    console.log('Browser launched. Opening harness...');
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
    await page.waitForSelector('[data-print-pagination-pages]', {
      timeout: 20_000,
    });
    console.log('Harness loaded.');

    await assertReadyState(page, 'default', 4);
    await page.screenshot({
      fullPage: true,
      path: screenshotPath('default'),
    });

    await page.getByRole('button', { name: '1 pagina' }).click();
    await assertReadyState(page, '1 pagina', 1);
    await page.screenshot({
      fullPage: true,
      path: screenshotPath('1-pagina'),
    });

    await page.getByRole('button', { name: '2 paginas' }).click();
    await assertReadyState(page, '2 paginas', 2);
    await page.screenshot({
      fullPage: true,
      path: screenshotPath('2-paginas'),
    });

    await page.getByRole('button', { name: '3+ paginas' }).click();
    await assertReadyState(page, '3+ paginas', 5);
    await page.screenshot({
      fullPage: true,
      path: screenshotPath('3-plus'),
    });

    await page.getByRole('button', { name: 'Resumen al borde' }).click();
    await assertReadyState(page, 'Resumen al borde', undefined);
    await page.screenshot({
      fullPage: true,
      path: screenshotPath('resumen-al-borde'),
    });

    await page.getByLabel('Bloque gigante').check();
    await page.waitForSelector(
      '[data-print-pagination-pages][data-print-pagination-ready="false"]',
      { timeout: 20_000 },
    );
    const giantState = await readVisualState(page);
    const printButton = page.getByRole('button', { name: 'Imprimir' });
    if (giantState.ready || !giantState.visibleText.includes('Overflow')) {
      throw new Error('Bloque gigante: esperaba bloqueo por overflow.');
    }
    if (!giantState.visibleText.includes('Bloques con overflow: giant-block')) {
      throw new Error(
        'Bloque gigante: esperaba reporte explicito de overflow giant-block.',
      );
    }
    if (!(await printButton.isDisabled())) {
      throw new Error('Bloque gigante: esperaba boton Imprimir deshabilitado.');
    }

    await page.screenshot({
      fullPage: true,
      path: screenshotPath('giant-overflow'),
    });

    await page.getByRole('button', { name: 'Factura' }).click();
    await page.getByRole('button', { name: 'Factura corta' }).click();
    await assertReadyState(page, 'Factura corta', 1);
    await page.screenshot({
      fullPage: true,
      path: screenshotPath('factura-corta'),
    });

    await page.getByRole('button', { name: 'Factura 2 paginas' }).click();
    await assertReadyState(page, 'Factura 2 paginas', undefined);
    await page.screenshot({
      fullPage: true,
      path: screenshotPath('factura-2-paginas'),
    });

    await page.getByRole('button', { name: 'e-CF con QR' }).click();
    await assertReadyState(page, 'e-CF con QR', undefined);
    const electronicState = await readVisualState(page);
    if (!electronicState.visibleText.includes('Codigo seguridad')) {
      throw new Error('e-CF con QR: falta bloque fiscal electronico.');
    }
    await page.screenshot({
      fullPage: true,
      path: screenshotPath('factura-ecf'),
    });

    await page.getByRole('button', { name: 'Resumen grande' }).click();
    await assertReadyState(page, 'Factura resumen grande', undefined);
    await page.screenshot({
      fullPage: true,
      path: screenshotPath('factura-resumen-grande'),
    });

    await page.getByLabel('Bloque gigante').check();
    await page.waitForSelector(
      '[data-print-pagination-pages][data-print-pagination-ready="false"]',
      { timeout: 20_000 },
    );
    const invoiceGiantState = await readVisualState(page);
    if (
      invoiceGiantState.ready ||
      !invoiceGiantState.visibleText.includes(
        'Bloques con overflow: invoice-overflow-block',
      )
    ) {
      throw new Error(
        'Factura bloque gigante: esperaba overflow invoice-overflow-block.',
      );
    }
    await page.screenshot({
      fullPage: true,
      path: screenshotPath('factura-giant-overflow'),
    });
    console.log(`Screenshots: ${screenshotGlobLabel}`);
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
