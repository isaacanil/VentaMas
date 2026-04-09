/**
 * breakpoints — Puntos de corte responsive para ERP.
 *
 * Contextos reales del sistema:
 * - sm: tablet de almacén / caja registradora (768px)
 * - md: laptop de vendedor / office (1024px)
 * - lg: monitor de escritorio estándar (1280px)
 * - xl: monitor con paneles laterales abiertos (1440px)
 * - 2xl: pantallas anchas / dual monitor (1920px)
 *
 * Uso en styled-components:
 *   @media (min-width: ${breakpoints.md}) { ... }
 *
 * Uso en CSS puro:
 *   @media (min-width: var(--ds-bp-md)) { ... }
 *   (requiere soporte de env() o JS — preferir el valor directo en SC)
 */
export const breakpoints = {
  sm:  '768px',
  md:  '1024px',
  lg:  '1280px',
  xl:  '1440px',
  '2xl': '1920px',
} as const;

/**
 * media — Helpers de media query listos para usar en styled-components.
 *
 * Ejemplo:
 *   const Panel = styled.div`
 *     display: none;
 *     ${media.lg} { display: flex; }
 *   `;
 */
export const media = {
  sm:  `@media (min-width: 768px)`,
  md:  `@media (min-width: 1024px)`,
  lg:  `@media (min-width: 1280px)`,
  xl:  `@media (min-width: 1440px)`,
  '2xl': `@media (min-width: 1920px)`,
} as const;
