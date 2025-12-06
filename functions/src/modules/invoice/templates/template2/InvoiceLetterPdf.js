import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import axios from 'axios';
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
const fontsPath = path.join(__dirname, '../../../../../fonts');

let printer = null;

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
    const resp = await axios.get(biz.logoUrl, { responseType: 'arraybuffer' });
    const ext = biz.logoUrl.split('.').pop().split(/[?#]/)[0].toLowerCase();
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    images.logo = `data:${mime};base64,${Buffer.from(resp.data).toString('base64')}`;
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
