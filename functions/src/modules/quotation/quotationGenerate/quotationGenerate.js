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
const fontsPath = path.join(__dirname, '../../../../fonts');

const fonts = {
  Roboto: {
    normal: readFileSync(path.join(fontsPath, 'Roboto-Regular.ttf')),
    bold: readFileSync(path.join(fontsPath, 'Roboto-Medium.ttf')),
    italics: readFileSync(path.join(fontsPath, 'Roboto-Italic.ttf')),
    bolditalics: readFileSync(path.join(fontsPath, 'Roboto-MediumItalic.ttf')),
  },
};

const printer = new PdfPrinter(fonts);

export const quotationPdf = https.onCall(async (req) => {
  const { business: biz, data: d } = req.data;

  const images = {};

  if (biz.logoUrl) {
    try {
      const resp = await axios.get(biz.logoUrl, {
        responseType: 'arraybuffer',
      });
      const ext = biz.logoUrl.split('.').pop().split(/[?#]/)[0].toLowerCase();
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
      images.logo = `data:${mime};base64,${Buffer.from(resp.data).toString('base64')}`;
    } catch (error) {
      console.warn('❌ Logo download failed:', error.message);
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
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
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
