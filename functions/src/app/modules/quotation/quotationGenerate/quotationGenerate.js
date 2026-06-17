import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { https } from 'firebase-functions';

import { buildContent } from './builders/content.js';
import { buildFooter } from './builders/footer.js';
import { buildHeader } from './builders/header.js';
import {
  calcFooterHeight,
  calcHeaderHeight,
} from './utils/documentHeightCalculator.js';
import { fetchLogoDataUri } from '../../../core/utils/pdfLogo.util.js';
import { resolveCallableAuthUid } from '../../../core/utils/callableSessionAuth.util.js';
import {
  MEMBERSHIP_ROLE_GROUPS,
  assertUserAccess,
} from '../../../versions/v2/auth/services/userAccess.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fontsPath = path.join(__dirname, '../../../../../fonts');

let printer = null;
let printerPromise = null;

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) =>
  typeof value === 'string' && value.trim().length ? value.trim() : null;

const toCallableAuthRequest = (data, context) => ({
  data,
  auth: context?.auth ?? null,
});

async function getPrinter() {
  if (printer) return printer;

  if (!printerPromise) {
    printerPromise = (async () => {
      const { default: PdfPrinter } = await import('pdfmake');
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
      return new PdfPrinter(fonts);
    })();
  }

  try {
    printer = await printerPromise;
    return printer;
  } catch (error) {
    printerPromise = null;
    throw error;
  }
}

export const quotationPdf = https.onCall(async (data, context) => {
  const request = toCallableAuthRequest(data, context);
  const authUid = toCleanString(await resolveCallableAuthUid(request));
  if (!authUid) {
    throw new https.HttpsError('unauthenticated', 'Usuario no autenticado');
  }

  const payload = asRecord(request.data);
  const biz = asRecord(payload.business);
  const d = asRecord(payload.data);
  const businessId =
    toCleanString(payload.businessId) ||
    toCleanString(biz.id) ||
    toCleanString(biz.businessId) ||
    toCleanString(biz.businessID) ||
    null;

  if (!businessId) {
    throw new https.HttpsError('invalid-argument', 'businessId es requerido');
  }

  if (!Object.keys(biz).length || !Object.keys(d).length) {
    throw new https.HttpsError(
      'invalid-argument',
      'business y data son requeridos',
    );
  }

  await assertUserAccess({
    authUid,
    businessId,
    allowedRoles: MEMBERSHIP_ROLE_GROUPS.INVOICE_OPERATOR,
  });

  const images = {};

  if (biz.logoUrl) {
    try {
      const logoDataUri = await fetchLogoDataUri(biz.logoUrl);
      if (logoDataUri) {
        images.logo = logoDataUri;
      }
    } catch (error) {
      console.warn('Logo download failed:', error.message);
    }
  }

  const top = calcHeaderHeight(biz, d);
  const bottom = calcFooterHeight(biz, d);
  const docDefinition = {
    images,
    pageSize: 'A4',
    pageMargins: [32, top, 32, bottom],
    defaultStyle: { font: 'Roboto', fontSize: 10, lineHeight: 1.15 },
    styles: {
      title: { fontSize: 14, bold: true, margin: [0, 0, 0, 6] },
      headerInfo: { fontSize: 11, margin: [0, 1, 0, 1] },
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
    header: buildHeader(biz, d, images),
    content: buildContent(d),
    footer: buildFooter(biz, d),
  };

  try {
    const pdfDoc = (await getPrinter()).createPdfKitDocument(docDefinition);
    const chunks = [];
    return new Promise((res, rej) => {
      pdfDoc.on('data', (c) => chunks.push(c));
      pdfDoc.on('end', () => res(Buffer.concat(chunks).toString('base64')));
      pdfDoc.on('error', rej);
      pdfDoc.end();
    });
  } catch (error) {
    console.error('❌ PDF creation failed:', error);
    throw error;
  }
});
