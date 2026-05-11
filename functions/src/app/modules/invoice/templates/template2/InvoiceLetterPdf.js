import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { https } from 'firebase-functions';
import PdfPrinter from 'pdfmake';

import { buildContent } from './builders/content.js';
import { buildFooter } from './builders/footer.js';
import { buildHeader } from './builders/header.js';
import {
  calcFooterHeight,
  calcHeaderHeight,
} from './utils/documentHeightCalculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fontsPath = path.join(__dirname, '../../../../../../fonts');
const ALLOWED_LOGO_HOSTS = new Set([
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
]);
const LOGO_FETCH_TIMEOUT_MS = 5000;
const MAX_LOGO_BYTES = 1_000_000;
const SUPPORTED_LOGO_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

let printer = null;

function isAllowedLogoUrl(rawUrl) {
  try {
    const url = new URL(String(rawUrl));
    return url.protocol === 'https:' && ALLOWED_LOGO_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

async function fetchLogoDataUri(rawUrl) {
  if (!rawUrl || !isAllowedLogoUrl(rawUrl)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOGO_FETCH_TIMEOUT_MS);

  try {
    const resp = await fetch(rawUrl, { signal: controller.signal });
    if (!resp.ok) {
      throw new Error(`Failed to fetch logo: ${resp.statusText}`);
    }

    const contentType = (resp.headers.get('content-type') || '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    if (!SUPPORTED_LOGO_MIME_TYPES.has(contentType)) {
      throw new Error(
        `Unsupported logo content type: ${contentType || 'unknown'}`,
      );
    }

    const contentLength = Number(resp.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_LOGO_BYTES) {
      throw new Error('Logo exceeds maximum allowed size');
    }

    const arrayBuffer = await resp.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_LOGO_BYTES) {
      throw new Error('Logo exceeds maximum allowed size');
    }

    return `data:${contentType};base64,${Buffer.from(arrayBuffer).toString('base64')}`;
  } finally {
    clearTimeout(timeout);
  }
}

function getPrinter() {
  if (!printer) {
    const fonts = {
      Roboto: {
        normal: readFileSync(path.join(fontsPath, 'Roboto-Regular.ttf')),
        bold: readFileSync(path.join(fontsPath, 'Roboto-Medium.ttf')),
        italics: readFileSync(path.join(fontsPath, 'Roboto-Italic.ttf')),
        bolditalics: readFileSync(
          path.join(fontsPath, 'Roboto-MediumItalic.ttf'),
        ),
      },
    };
    printer = new PdfPrinter(fonts);
  }
  return printer;
}

export const invoiceLetterPdf = https.onCall(async (req) => {
  const { business: biz, data: d } = req.data;

  const images = {};
  if (biz.logoUrl) {
    try {
      const logoDataUri = await fetchLogoDataUri(biz.logoUrl);
      if (logoDataUri) {
        images.logo = logoDataUri;
      }
    } catch (error) {
      console.warn('Logo fetch failed:', error.message);
    }
  }

  const top = calcHeaderHeight(biz, d);
  const bottom = calcFooterHeight(biz, d);
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, top, 40, bottom],
    defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.2 },
    styles: {
      title: { fontSize: 16, bold: true, margin: [0, 0, 0, 8] },
      headerInfo: { fontSize: 11, margin: [0, 2, 0, 2] },
      tableHeader: { bold: true, fontSize: 11, color: 'white' },
      separator: {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 515,
            y2: 0,
            lineWidth: 1,
            lineColor: '#e0e0e0',
          },
        ],
      },
      totalsLabel: { bold: true },
      totalsValue: { bold: true, alignment: 'right' },
    },
    header: buildHeader(biz, d),
    content: buildContent(d),
    footer: buildFooter(biz, d),
    images,
  };

  const pdfDoc = getPrinter().createPdfKitDocument(docDefinition);
  const chunks = [];
  return new Promise((res) => {
    pdfDoc.on('data', (c) => chunks.push(c));
    pdfDoc.on('end', () => res(Buffer.concat(chunks).toString('base64')));
    pdfDoc.end();
  });
});
