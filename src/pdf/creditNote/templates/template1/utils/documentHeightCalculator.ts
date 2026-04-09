// src/utils/documentHeightCalculator.js

import type { TimestampLike } from '@/utils/date/types';
import { toMillis } from '@/utils/date/toMillis';
import type { CreditNoteBusinessInfo, CreditNoteData } from '../../../types.js';

// Constantes basadas en los estilos del PDF
const STYLES = {
  title: { fontSize: 14, lineHeight: 1.15, marginBottom: 6 },
  headerInfo: { fontSize: 10, lineHeight: 1.15, marginVertical: 1 },
  default: { fontSize: 10, lineHeight: 1.15 },
  totalsValue: { fontSize: 10, lineHeight: 1.15, marginVertical: 1 },
};

const LAYOUT = {
  pageWidth: 531, // A4 width (595.28) - horizontal margins (32*2) = 531.28
  logoWidth: 120,
  logoAllocatedHeight: 80,
  logoMargin: 4,
  separatorMargin: 10, // top + bottom
  clientBlockMargin: 9, // top + bottom
  headerMargin: 12, // top margin
  footerSignatureHeight: 25, // línea + texto
  paymentMethodSpacing: 4,
  headerColumnWidth: (531 - 10) / 2, // (pageWidth - spacing) / 2
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

/**
 * Calcula la altura necesaria para el header dinámico de nota de crédito
 */
export function calcHeaderHeight(
  biz: CreditNoteBusinessInfo,
  d: CreditNoteData,
): number {
  let height = LAYOUT.headerMargin; // margen superior inicial

  // 1. Logo (si existe)
  if (biz.logoUrl) {
    height += LAYOUT.logoAllocatedHeight + LAYOUT.logoMargin;
  }

  // 2. Información del negocio (columna izquierda)
  let businessInfoHeight = 0;

  // Título del negocio
  if (biz.name) {
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
    businessInfoHeight +=
      calculateTextHeight(
        field,
        STYLES.headerInfo.fontSize,
        STYLES.headerInfo.lineHeight,
        LAYOUT.headerColumnWidth,
      ) +
      STYLES.headerInfo.marginVertical * 2;
  });

  // 3. Información de la nota de crédito (columna derecha)
  let creditNoteInfoHeight = 0;

  // Título del comprobante
  const comprobanteTitle = getComprobanteTitle(d.ncf);
  creditNoteInfoHeight +=
    calculateTextHeight(
      comprobanteTitle,
      STYLES.title.fontSize,
      STYLES.title.lineHeight,
      LAYOUT.headerColumnWidth,
    ) + STYLES.title.marginBottom;

  // Campos de la nota de crédito
  const creditNoteFields = [
    `Fecha: ${formatDateForCalculation(d.createdAt)}`,
    `${getComprobanteLabel(d.ncf)}: ${d.ncf || '-'}`,
    d.number ? `Ref: ${d.number}` : null,
    d.invoiceNcf ? `NCF Afectado: ${d.invoiceNcf}` : null,
  ].filter(Boolean);

  creditNoteFields.forEach((field) => {
    creditNoteInfoHeight +=
      calculateTextHeight(
        field,
        STYLES.headerInfo.fontSize,
        STYLES.headerInfo.lineHeight,
        LAYOUT.headerColumnWidth,
      ) +
      STYLES.headerInfo.marginVertical * 2;
  });

  // Tomar la altura mayor entre las dos columnas
  height += Math.max(businessInfoHeight, creditNoteInfoHeight);

  // 4. Separador horizontal
  height += LAYOUT.separatorMargin;

  // 5. Bloque de información del cliente (si existe y no es genérico)
  const client = d.client ?? null;
  if (client && shouldShowClientBlock(d)) {
    let clientHeight = 0;
    const clientFields = [
      `Cliente: ${client.name}`,
      client.address?.trim() ? `Dirección: ${client.address.trim()}` : null,
      client.tel?.trim() ? `Tel: ${client.tel.trim()}` : null,
      client.rnc?.trim() || client.personalID?.trim()
        ? `RNC cliente: ${(client.rnc || client.personalID).trim()}`
        : null,
    ].filter(Boolean);

    clientFields.forEach((field) => {
      clientHeight +=
        calculateTextHeight(field, STYLES.headerInfo.fontSize) +
        STYLES.headerInfo.marginVertical * 2;
    });

    height += clientHeight + LAYOUT.clientBlockMargin;
  }

  return Math.ceil(height);
}

/**
 * Calcula la altura necesaria para el footer de nota de crédito
 */
export function calcFooterHeight(
  biz: CreditNoteBusinessInfo,
  d: CreditNoteData,
): number {
  let height = 0;

  // 1. Bloque de firmas (siempre presente)
  height += LAYOUT.footerSignatureHeight * 2; // "Autorizado Por" y "Recibido Conforme"

  // 2. Tabla de totales
  let totalRows = 2; // Sub-Total + ITBIS (siempre presentes)

  // Verificar si hay descuentos individuales
  const hasIndividualDisc = (d.items || []).some(
    (item) => item.discount && item.discount.value > 0,
  );
  if (hasIndividualDisc) totalRows += 1; // fila de descuentos

  totalRows += 1; // fila de Total Acreditado

  // Cada fila de totales
  height +=
    totalRows *
    (STYLES.totalsValue.fontSize * STYLES.totalsValue.lineHeight +
      STYLES.totalsValue.marginVertical * 2);

  // 3. Motivo de la nota de crédito (si existe)
  if (d.reason?.trim()) {
    height +=
      calculateTextHeight(
        `Motivo: ${d.reason.trim()}`,
        STYLES.default.fontSize,
        STYLES.default.lineHeight,
        LAYOUT.pageWidth,
      ) + 8; // margen superior
  }

  // 4. Mensaje de factura del negocio (si existe)
  if (biz?.invoice?.invoiceMessage?.trim()) {
    height +=
      calculateTextHeight(
        biz.invoice.invoiceMessage.trim(),
        STYLES.default.fontSize,
        STYLES.default.lineHeight,
        LAYOUT.pageWidth,
      ) + 4; // margen superior
  }

  // 5. Margen inferior mínimo
  height += 20;

  return Math.ceil(height);
}

// Funciones auxiliares
function shouldShowClientBlock(d: CreditNoteData): boolean {
  const rawName = d.client?.name?.trim() || '';
  const esGenerico = !rawName || rawName.toLowerCase() === 'generic client';
  return !esGenerico;
}

function getComprobanteTitle(ncf?: string | null): string {
  if (!ncf) return 'NOTA DE CRÉDITO';
  if (ncf.startsWith('B04')) return 'NOTA DE CRÉDITO FISCAL';
  return 'NOTA DE CRÉDITO';
}

function getComprobanteLabel(ncf?: string | null): string {
  if (!ncf) return 'Número de Nota';
  return 'NCF';
}

function formatDateForCalculation(date: TimestampLike): string {
  if (!date) return '';
  const ms = toMillis(date);
  if (ms === undefined || Number.isNaN(ms)) return '';
  return new Date(ms).toLocaleDateString();
}
