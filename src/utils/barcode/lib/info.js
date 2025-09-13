import { analyzeBarcodeStructure } from './analyzer';

export function isValidBarcode(barcode) {
  return analyzeBarcodeStructure(barcode).isValid;
}

export function getBarcodeInfo(barcode) {
  const analysis = analyzeBarcodeStructure(barcode);
  if (!analysis.isValid) return { valid:false, type:analysis.type||'Desconocido', message:analysis.errorMessage||analysis.error||'Código inválido', error:analysis.error };
  let msg = `${analysis.type}`;
  if (analysis.country) msg += ` • ${analysis.country.country}`;
  if (analysis.isVariableWeight) msg += ' • Peso/Precio Variable';
  if (analysis.checkDigit?.isValid) msg += ' • ✓ Válido';
  if (analysis.type==='UPC-E' && analysis.structure?.expanded) msg += ` → ${analysis.structure.expanded}`;
  return { valid:true, type:analysis.type, country:analysis.country, structure:analysis.structure, isVariableWeight:analysis.isVariableWeight, message:msg };
}

export function isGS1RDCode(barcode) {
  const c = analyzeBarcodeStructure(barcode);
  return c.country?.prefix==='746' && c.isValid;
}

export function extractCompanyPrefix(barcode, len=4) {
  if (!isGS1RDCode(barcode)) return null;
  const clean = barcode.replace(/\s/g,'');
  return clean.slice(3,3+len);
}

export function extractItemReference(barcode, companyPrefixLength=4) {
  if (!isGS1RDCode(barcode)) return null;
  const clean = barcode.replace(/\s/g,'');
  const itemLength = 9-companyPrefixLength;
  return clean.slice(3+companyPrefixLength,3+companyPrefixLength+itemLength);
}
