// src/utils/documentHeightCalculator.js

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
export function calcFooterHeight(d) {
  let height = 50; // espacio base para footer
  let rows = 2; // Sub-Total + ITBIS
  if (d.discount?.value) rows += 1; // fila de descuento
  if (d.delivery?.status) rows += 1; // fila de delivery
  height += rows * 15; // 15px por fila de totales
  return height;
}
