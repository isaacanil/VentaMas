import { GS1_COUNTRY_PREFIXES, PREFIXES_SORTED } from './constants';
import type { BarcodeCountryInfoWithPrefix } from './types';

// Identifica el país basado en el prefijo GS1
export function identifyCountryByPrefix(
  code: string,
): BarcodeCountryInfoWithPrefix | null {
  if (!code || code.length < 1) return null;
  for (const prefix of PREFIXES_SORTED) {
    if (code.startsWith(prefix)) {
      return { prefix, ...GS1_COUNTRY_PREFIXES[prefix] };
    }
  }
  return null;
}
