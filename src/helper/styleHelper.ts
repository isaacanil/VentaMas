/**
 * Mapa de tamaños de fuente por contexto, variante y tamaño
 */
type SizeMap = Record<string, Record<string, Record<string, string | number>>>;

/**
 * Mapa de tamaños generales
 */
type GeneralSizeMap = Record<string, string | number>;

/**
 * Parámetros para la función getFontSize
 */
interface GetFontSizeParams {
  context: string;
  variant: string;
  size: string;
  generalSize: GeneralSizeMap;
  variantToSizeMap: SizeMap;
}

export const getFontSize = ({
  context,
  variant,
  size,
  generalSize,
  variantToSizeMap,
}: GetFontSizeParams): string | number => {
  const fontSize =
    variantToSizeMap[context]?.[variant]?.[size] || generalSize[size];
  return fontSize;
};
