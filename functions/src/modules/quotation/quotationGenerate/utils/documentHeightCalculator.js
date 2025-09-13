// src/utils/documentHeightCalculator.js

// Constantes basadas en los estilos del PDF
const STYLES = {
  title: { fontSize: 14, lineHeight: 1.15, marginBottom: 6 },
  headerInfo: { fontSize: 10, lineHeight: 1.15, marginVertical: 1 },
  default: { fontSize: 10, lineHeight: 1.15 },
  totalsValue: { fontSize: 10, lineHeight: 1.15, marginVertical: 1 }
};

const LAYOUT = {
  pageWidth: 531, // A4 width (595.28) - horizontal margins (32*2) = 531.28
  logoWidth: 120,
  logoAllocatedHeight: 80, // Altura asignada para el logo
  logoMargin: 4,
  separatorMargin: 10, // top + bottom
  clientBlockMargin: 9, // top + bottom
  headerMargin: 12, // top margin
  paymentMethodSpacing: 4,
  headerColumnWidth: (531 - 10) / 2 // (pageWidth - spacing) / 2
};

/**
 * Calcula la altura precisa de un texto considerando fuente y ancho
 */
export function calculateTextHeight(text, fontSize = 10, lineHeight = 1.15, maxWidth = LAYOUT.pageWidth) {
  if (!text) return 0;
  
  // Estimación más precisa basada en caracteres por línea según el tamaño de fuente
  const avgCharWidth = fontSize * 0.6; // Aproximación para Roboto
  const charsPerLine = Math.floor(maxWidth / avgCharWidth);
  const lines = Math.ceil(text.length / charsPerLine);
  
  return lines * fontSize * lineHeight;
}

/**
 * Estima la altura (en pt) que ocupará un bloque de texto.
 */
export function estimateTextHeight(text, {
  charsPerLine = 40,
  lineHeight = 15,
  marginTop = 8,
} = {}) {
  const len = text?.length || 0;
  const lines = Math.ceil(len / charsPerLine) || 1;
  return marginTop + lines * lineHeight;
}

/**
 * Calcula la altura necesaria para el header dinámico con precisión máxima
 * Considera todos los elementos reales: logo, información del negocio, separadores y cliente
 */
export function calcHeaderHeight(biz, d) {
  let height = LAYOUT.headerMargin; // margen superior inicial
  
  // 1. Logo (si existe)
  if (biz.logoUrl) {
    height += LAYOUT.logoAllocatedHeight + LAYOUT.logoMargin; 
  }
  
  // 2. Información del negocio (columna izquierda)
  let businessInfoHeight = 0;
  
  // Título del negocio
  if (biz.name) {
    businessInfoHeight += calculateTextHeight(biz.name, STYLES.title.fontSize, STYLES.title.lineHeight, LAYOUT.headerColumnWidth) + STYLES.title.marginBottom;
  }
  
  // Información adicional del negocio
  const businessFields = [
    biz.address,
    biz.tel ? `Tel: ${biz.tel}` : null,
    biz.email,
    biz.rnc ? `RNC: ${biz.rnc}` : null
  ].filter(Boolean);
  
  businessFields.forEach(field => {
    businessInfoHeight += calculateTextHeight(field, STYLES.headerInfo.fontSize, STYLES.headerInfo.lineHeight, LAYOUT.headerColumnWidth) + (STYLES.headerInfo.marginVertical * 2);
  });
  
  // 3. Información de la cotización (columna derecha)
  let quotationInfoHeight = 0;
  
  // Título de cotización
  quotationInfoHeight += calculateTextHeight('COTIZACIÓN', STYLES.title.fontSize, STYLES.title.lineHeight, LAYOUT.headerColumnWidth) + STYLES.title.marginBottom;
  
  // Campos de la cotización
  const quotationFields = [
    `Fecha: ${formatDateForCalculation(d.date)}`,
    `No: ${d.numberID || '-'}`,
    d.expirationDate ? `Vence: ${formatDateForCalculation(d.expirationDate)}` : null
  ].filter(Boolean);
  
  quotationFields.forEach(field => {
    quotationInfoHeight += calculateTextHeight(field, STYLES.headerInfo.fontSize, STYLES.headerInfo.lineHeight, LAYOUT.headerColumnWidth) + (STYLES.headerInfo.marginVertical * 2);
  });
  
  // Tomar la altura mayor entre las dos columnas
  height += Math.max(businessInfoHeight, quotationInfoHeight);
  
  // 4. Separador horizontal
  height += LAYOUT.separatorMargin;
  
  // 5. Bloque de información del cliente (si existe y no es genérico)
  if (shouldShowClientBlock(d)) {
    let clientHeight = 0;
    const clientFields = [
      `Cliente: ${d.client.name}`,
      d.client?.address?.trim() ? `Dirección: ${d.client.address.trim()}` : null,
      d.client?.tel?.trim() ? `Tel: ${d.client.tel.trim()}` : null,
      d.client?.personalID?.trim() ? `RNC cliente: ${d.client.personalID.trim()}` : null
    ].filter(Boolean);
    
    clientFields.forEach(field => {
      clientHeight += calculateTextHeight(field, STYLES.headerInfo.fontSize) + (STYLES.headerInfo.marginVertical * 2);
    });
    
    height += clientHeight + LAYOUT.clientBlockMargin;
  }
  
  return Math.ceil(height);
}

/**
 * Calcula la altura necesaria para el footer dinámico con máxima precisión
 * Considera métodos de pago, tabla de totales y comentarios
 */
export function calcFooterHeight(biz, d) {
  let height = 0;
  
  // 1. Métodos de pago (si existen)
  const paymentMethods = d.paymentMethod?.filter(m => m?.status) || [];
  if (paymentMethods.length > 0) {
    // Título "Métodos de Pago"
    height += STYLES.default.fontSize * STYLES.default.lineHeight + LAYOUT.paymentMethodSpacing;
    
    // Cada método de pago
    paymentMethods.forEach(method => {
      const methodText = getPaymentMethodText(method);
      height += calculateTextHeight(methodText, STYLES.default.fontSize) + STYLES.default.lineHeight;
    });
  }
  
  // 2. Notas de crédito aplicadas (si existen)
  const creditNotes = d.creditNotePayment || [];
  if (creditNotes.length > 0) {
    // Título "Notas de Crédito Aplicadas"
    height += STYLES.default.fontSize * STYLES.default.lineHeight + LAYOUT.paymentMethodSpacing;
    
    // Cada nota de crédito
    creditNotes.forEach(note => {
      const noteText = `NCF: ${note.ncf} - ${note.amountUsed}`;
      height += calculateTextHeight(noteText, STYLES.default.fontSize) + STYLES.default.lineHeight;
    });
  }
  
  // 3. Tabla de totales
  let totalRows = 2; // Sub-Total + ITBIS (siempre presentes)
  
  if (d.discount?.value) totalRows += 1; // fila de descuento
  if (d.delivery?.status) totalRows += 1; // fila de delivery
  totalRows += 1; // fila de Total final
  
  // Cada fila de totales
  height += totalRows * (STYLES.totalsValue.fontSize * STYLES.totalsValue.lineHeight + (STYLES.totalsValue.marginVertical * 2));
  
  // 4. Comentario de cotización (si existe)
  if (d.invoiceComment?.trim()) {
    height += calculateTextHeight(
      d.invoiceComment.trim(),
      STYLES.default.fontSize,
      STYLES.default.lineHeight,
      LAYOUT.pageWidth
    ) + 8; // margen superior
  }
  
  // 5. Margen inferior mínimo
  height += 20;
  
  return Math.ceil(height);
}

// Funciones auxiliares para mejorar la precisión

function shouldShowClientBlock(d) {
  const rawName = d.client?.name?.trim() || '';
  return rawName && rawName.toLowerCase() !== 'generic client';
}

function formatDateForCalculation(date) {
  if (!date) return '-';
  if (date.seconds) {
    const ts = date.seconds * 1000 + Math.floor(date.nanoseconds / 1e6);
    return new Date(ts).toLocaleDateString('es-DO');
  }
  return new Date(date).toLocaleDateString('es-DO');
}

function getPaymentMethodText(method) {
  const methodNames = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    card: 'Tarjeta',
    creditNote: 'Nota de Crédito'
  };
  
  const methodName = methodNames[method.method?.toLowerCase()] || method.method;
  const value = Number(method.value || 0).toFixed(2);
  const reference = method.reference ? ` - Ref: ${method.reference}` : '';
  
  return `${methodName}: ${value}${reference}`;
}
