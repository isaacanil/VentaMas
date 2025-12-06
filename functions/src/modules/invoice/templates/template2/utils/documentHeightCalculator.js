// src/utils/documentHeightCalculator.js
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
  text,
  { charsPerLine = 40, lineHeight = 15, marginTop = 8 } = {},
) {
  const len = text?.length || 0;
  const lines = Math.ceil(len / charsPerLine) || 1;
  return marginTop + lines * lineHeight;
}
/**
 * Calcula la altura necesaria para el header dinámico
 * Basado en si hay logo, líneas de información del negocio y bloque de cliente
 */
export function calcHeaderHeight(biz, d) {
  let height = biz.logoUrl ? 100 : 60; // espacio para logo o título
  const infoKeys = ['name', 'address', 'tel', 'email', 'rnc'];
  const infoLines = infoKeys.filter((k) => biz[k]).length;
  height += infoLines * 15; // 15px por línea de info
  height += 50; // espacio fijo para título y fecha
  if (d.client?.name && d.client.name.toLowerCase() !== 'generic client') {
    height += 30; // espacio extra si hay bloque de cliente
  }
  return height;
}

/**
 * Calcula la altura necesaria para el footer dinámico
 * Basado en filas de totales, descuento y delivery
 */
export function calcFooterHeight(biz, d) {
  let height = 60; // espacio base para footer
  let rows = 2; // Sub-Total + ITBIS
  if (d.discount?.value) rows += 1; // fila de descuento
  if (d.delivery?.status) rows += 1; // fila de delivery
  height += rows * 15;
  if (d.invoiceComment) {
    height += estimateTextHeight(d.invoiceComment, {
      charsPerLine: 95,
      lineHeight: 15,
      marginTop: 8,
    });
  }
  if (biz?.invoice?.invoiceMessage) {
    height += estimateTextHeight(biz.invoice.invoiceMessage, {
      charsPerLine: 95,
      lineHeight: 15,
      marginTop: 8,
    });
  }
  return height;
}
