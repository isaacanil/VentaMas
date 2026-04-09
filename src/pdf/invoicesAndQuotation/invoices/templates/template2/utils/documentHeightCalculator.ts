import { resolveDocumentIdentity } from '@/utils/invoice/documentIdentity.js';
import { toMillis } from '@/utils/date/dateUtils';

import { measurePreciseTextBlock } from './textMeasurement.js';

import type { TimestampLike } from '@/utils/date/types';
import type { InvoiceClient, InvoicePaymentMethod } from '@/types/invoice';
import type {
  InvoicePdfBusiness,
  InvoicePdfData,
} from '@/pdf/invoicesAndQuotation/types';

// src/utils/documentHeightCalculator.js

// Constantes basadas en los estilos del PDF
const STYLES = {
  title: { fontSize: 14, lineHeight: 1.15, marginBottom: 6 },
  headerInfo: { fontSize: 10, lineHeight: 1.15, marginVertical: 1 },
  default: { fontSize: 10, lineHeight: 1.15 }, // Corrected: Added missing comma
  totalsValue: { fontSize: 10, lineHeight: 1.15, marginVertical: 1 },
};

const LAYOUT = {
  pageWidth: 531, // A4 width (595.28) - horizontal margins (32*2) = 531.28. Adjusted for better accuracy.
  logoWidth: 120,
  logoAllocatedHeight: 80, // Added: Assumed/allocated height for the logo. This MUST match how the logo is rendered/constrained in buildHeader.js
  logoMargin: 4,
  separatorMargin: 10, // top + bottom
  clientBlockMargin: 9, // top + bottom
  clientBlockMinHeight: 70,
  headerMargin: 12, // top margin
  footerSignatureHeight: 25, // línea + texto
  paymentMethodSpacing: 4,
  // Added: Approximate width for columns if business/invoice info are side-by-side.
  // Adjust this based on your actual column definitions in buildHeader.js (e.g., considering spacing between columns).
  headerColumnWidth: (531 - 10) / 2, // Example: (pageWidth - spacing) / 2
};

/**
 * Calcula la altura precisa de un texto considerando fuente y ancho
 */
export function calculateTextHeight(
  text: string | null | undefined,
  fontSize = 10,
  lineHeight = 1.15,
  maxWidth = LAYOUT.pageWidth,
): number {
  if (!text) return 0;

  // Estimación más precisa basada en caracteres por línea según el tamaño de fuente
  const avgCharWidth = fontSize * 0.6; // Aproximación para Roboto
  const charsPerLine = Math.floor(maxWidth / avgCharWidth);
  const lines = Math.ceil(text.length / charsPerLine);

  return lines * fontSize * lineHeight;
}

const normalizeClientValue = (value: unknown): string | number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }
  if (typeof value === 'number') return value;
  return String(value);
};

const pickClientField = (
  d: InvoicePdfData,
  ...keys: Array<keyof InvoiceClient | string>
): string | number | null => {
  for (const key of keys) {
    const nested = normalizeClientValue(d?.client?.[key]);
    if (nested !== null && nested !== undefined) {
      return nested;
    }
    const flat = normalizeClientValue(d?.[key]);
    if (flat !== null && flat !== undefined) {
      return flat;
    }
  }
  return null;
};

/**
 * Estima la altura (en pt) que ocupará un bloque de texto.
 *
 * @param {string} text              – El texto a mostrar.
 * @param {object} options
 * @param {number} options.charsPerLine – Promedio de caracteres caben en una línea (p. ej. 40).
 * @param {number} options.lineHeight   – Altura de línea (pt), p. ej. 15.
 * @param {number} options.marginTop    – Margen superior (pt) que aplicas antes de este bloque.
 * @returns {number} Altura estimada (pt).
 */
export function estimateTextHeight(
  text: string | null | undefined,
  {
    charsPerLine = 40,
    lineHeight = 15,
    marginTop = 8,
  }: { charsPerLine?: number; lineHeight?: number; marginTop?: number } = {},
): number {
  const len = text?.length || 0;
  const lines = Math.ceil(len / charsPerLine) || 1;
  return marginTop + lines * lineHeight;
}
/**
 * Calcula la altura necesaria para el header dinámico con precisión máxima
 * Considera todos los elementos reales: logo, información del negocio, separadores y cliente
 */
export function calcHeaderHeight(
  biz: InvoicePdfBusiness,
  d: InvoicePdfData,
): number {
  let height = LAYOUT.headerMargin; // margen superior inicial

  // 1. Logo (si existe)
  if (biz.logoUrl) {
    // Uses LAYOUT.logoAllocatedHeight. Ensure this matches the actual rendering height in buildHeader.js
    height += LAYOUT.logoAllocatedHeight + LAYOUT.logoMargin;
  }

  // 2. Información del negocio (columna izquierda)
  let businessInfoHeight = 0;

  // Título del negocio
  if (biz.name) {
    // Assuming title might span full width or a specific width, adjust maxWidth if needed
    businessInfoHeight +=
      calculateTextHeight(
        biz.name,
        STYLES.title.fontSize,
        STYLES.title.lineHeight,
        LAYOUT.headerColumnWidth,
      ) + STYLES.title.marginBottom;
  }

  // Información adicional del negocio
  const businessFields = [
    biz.address,
    biz.tel ? `Tel: ${biz.tel}` : null,
    biz.email,
    biz.rnc ? `RNC: ${biz.rnc}` : null,
  ].filter(Boolean);

  businessFields.forEach((field) => {
    // Use LAYOUT.headerColumnWidth for text constrained in a column
    businessInfoHeight +=
      calculateTextHeight(
        field,
        STYLES.headerInfo.fontSize,
        STYLES.headerInfo.lineHeight,
        LAYOUT.headerColumnWidth,
      ) +
      STYLES.headerInfo.marginVertical * 2;
  });

  // 3. Información de la factura (columna derecha)
  let invoiceInfoHeight = 0;

  // Título del comprobante
  const {
    title: comprobanteTitle,
    label: comprobanteLabel,
    value: comprobanteValue,
    type: comprobanteType,
  } = resolveDocumentIdentity(d);
  const referenceLabel =
    comprobanteType === 'preorder' ? 'Preventa' : comprobanteTitle || 'Factura';
  const referenceValue =
    comprobanteType === 'preorder'
      ? comprobanteValue || d.preorderDetails?.numberID || d.numberID || '-'
      : d.numberID || '-';
  // Assuming title might span full width or a specific width, adjust maxWidth if needed
  invoiceInfoHeight +=
    calculateTextHeight(
      comprobanteTitle,
      STYLES.title.fontSize,
      STYLES.title.lineHeight,
      LAYOUT.headerColumnWidth,
    ) + STYLES.title.marginBottom;

  // Campos de la factura
  const invoiceFields = [
    `Fecha: ${formatDateForCalculation(d.date)}`,
    comprobanteLabel && comprobanteType !== 'preorder'
      ? `${comprobanteLabel}: ${comprobanteValue || '-'}`
      : null,
    `${referenceLabel} # ${referenceValue}`,
    d.type === 'preorder' && d.preorderDetails?.date
      ? `Fecha de Pedido: ${formatDateForCalculation(d.preorderDetails.date)}`
      : null,
    d.dueDate ? `Vence: ${formatDateForCalculation(d.dueDate)}` : null,
  ].filter(Boolean);

  invoiceFields.forEach((field) => {
    // Use LAYOUT.headerColumnWidth for text constrained in a column
    invoiceInfoHeight +=
      calculateTextHeight(
        field,
        STYLES.headerInfo.fontSize,
        STYLES.headerInfo.lineHeight,
        LAYOUT.headerColumnWidth,
      ) +
      STYLES.headerInfo.marginVertical * 2;
  });

  // Tomar la altura mayor entre las dos columnas
  height += Math.max(businessInfoHeight, invoiceInfoHeight);

  // 4. Separador horizontal
  height += LAYOUT.separatorMargin;

  // 5. Bloque de información del cliente (si existe)
  const clientLines = buildClientLines(d);
  if (clientLines) {
    const { left, right } = clientLines;

    const leftHeight = left.reduce((acc, line) => {
      const measurement = measurePreciseTextBlock({
        text: line,
        fontSize: STYLES.headerInfo.fontSize,
        lineHeight: STYLES.headerInfo.lineHeight,
        maxWidth: LAYOUT.headerColumnWidth,
      });
      return acc + measurement.height + STYLES.headerInfo.marginVertical * 2;
    }, 0);

    const rightHeight = right.reduce((acc, line) => {
      const measurement = measurePreciseTextBlock({
        text: line,
        fontSize: STYLES.headerInfo.fontSize,
        lineHeight: STYLES.headerInfo.lineHeight,
        maxWidth: LAYOUT.headerColumnWidth,
      });
      return acc + measurement.height + STYLES.headerInfo.marginVertical * 2;
    }, 0);

    const dynamicHeight = Math.max(leftHeight, rightHeight);
    const clientBlockHeight = Math.max(
      dynamicHeight,
      LAYOUT.clientBlockMinHeight,
    );

    height += clientBlockHeight + LAYOUT.clientBlockMargin;
  }

  return Math.ceil(height);
}

/**
 * Calcula la altura necesaria para el footer dinámico con máxima precisión
 * Considera firmas, métodos de pago, tabla de totales y comentarios
 */
export function calcFooterHeight(
  biz: InvoicePdfBusiness,
  d: InvoicePdfData,
): number {
  let height = 0;

  // 1. Bloque de firmas (siempre presente)
  height += LAYOUT.footerSignatureHeight * 2; // "Despachado Por" y "Recibido Conforme"

  // 2. Métodos de pago (si existen)
  const paymentMethods = d.paymentMethod?.filter((m) => m?.status) || [];
  if (paymentMethods.length > 0) {
    // Título "Métodos de Pago"
    height +=
      STYLES.default.fontSize * STYLES.default.lineHeight +
      LAYOUT.paymentMethodSpacing;

    // Cada método de pago
    paymentMethods.forEach((method) => {
      const methodText = getPaymentMethodText(method);
      height +=
        calculateTextHeight(methodText, STYLES.default.fontSize) +
        STYLES.default.lineHeight;
    });
  }

  // 3. Tabla de totales
  let totalRows = 2; // Sub-Total + ITBIS (siempre presentes)

  if (d.discount?.value) totalRows += 1; // fila de descuento
  if (d.delivery?.status) totalRows += 1; // fila de delivery
  totalRows += 1; // fila de Total final

  // Cada fila de totales
  height +=
    totalRows *
    (STYLES.totalsValue.fontSize * STYLES.totalsValue.lineHeight +
      STYLES.totalsValue.marginVertical * 2);

  // 4. Comentario de factura (si existe)
  const invoiceComment =
    typeof d.invoiceComment === 'string' ? d.invoiceComment.trim() : '';
  if (invoiceComment) {
    height +=
      calculateTextHeight(
        invoiceComment,
        STYLES.default.fontSize,
        STYLES.default.lineHeight,
        LAYOUT.pageWidth,
      ) + 8; // margen superior
  }

  // 5. Mensaje de factura del negocio (si existe)
  const invoiceMessage =
    typeof biz?.invoice?.invoiceMessage === 'string'
      ? biz.invoice.invoiceMessage.trim()
      : '';
  if (invoiceMessage) {
    height +=
      calculateTextHeight(
        invoiceMessage,
        STYLES.default.fontSize,
        STYLES.default.lineHeight,
        LAYOUT.pageWidth,
      ) + 4; // margen superior
  }

  // 6. Margen inferior mínimo
  height += 20;

  return Math.ceil(height);
}

// Funciones auxiliares para mejorar la precisión

function _shouldShowClientBlock(d: InvoicePdfData): boolean {
  return Boolean(buildClientLines(d));
}

function buildClientLines(
  d: InvoicePdfData,
): { left: string[]; right: string[] } | null {
  const rawName = pickClientField(d, 'name', 'clientName');
  const normalizedName =
    typeof rawName === 'string' ? rawName.toLowerCase() : '';
  const hasRealName = normalizedName && normalizedName !== 'generic client';
  const address = pickClientField(d, 'address', 'direccion', 'addressLine');
  const tel = pickClientField(d, 'tel', 'phone', 'phoneNumber', 'telefono');
  const tel2 = pickClientField(d, 'tel2', 'secondaryPhone', 'phone2');
  const personalId = pickClientField(
    d,
    'personalID',
    'personalId',
    'rnc',
    'taxId',
    'identification',
  );

  const meaningfulName = normalizeClientValue(rawName);
  if (!meaningfulName && !address && !tel && !tel2 && !personalId) {
    return null;
  }

  const displayName = hasRealName
    ? rawName
    : meaningfulName || 'Cliente Genérico';

  const left = [`Cliente: ${displayName}`];
  if (address) {
    left.push(`Dirección: ${address}`);
  }

  const right = [];
  if (tel) {
    right.push(`Tel: ${tel}`);
  }
  if (tel2) {
    right.push(`Tel 2: ${tel2}`);
  }
  if (personalId) {
    right.push(`RNC/Cédula: ${personalId}`);
  }

  return { left, right };
}

function formatDateForCalculation(date: TimestampLike): string {
  const millis = toMillis(date);
  if (!millis) return '-';
  return new Date(millis).toLocaleDateString('es-DO');
}

function getPaymentMethodText(method: InvoicePaymentMethod): string {
  const methodNames: Record<string, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    card: 'Tarjeta', // Added missing comma
    credit: 'Crédito', // Example: if you have other methods
  };

  const methodName = methodNames[method.method?.toLowerCase()] || method.method;
  const value = Number(method.value || 0).toFixed(2);
  const reference = method.reference ? ` - Ref: ${method.reference}` : '';

  return `${methodName}: ${value}${reference}`;
}
