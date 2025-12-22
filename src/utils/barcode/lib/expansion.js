import { calculateUPCACheckDigit } from './digits';

// Convierte UPC-E a UPC-A
export function expandUPCEToUPCA(upce) {
  if (!upce) return null;
  const cleanCode = upce.replace(/[^0-9]/g, '');
  let centerDigits;
  if (cleanCode.length === 6) centerDigits = cleanCode;
  else if (cleanCode.length === 7) centerDigits = cleanCode.slice(0, 6);
  else if (cleanCode.length === 8) centerDigits = cleanCode.slice(1, 7);
  else return null;

  const last = parseInt(centerDigits[5], 10);
  let upca;
  if (last <= 2) {
    upca = centerDigits.slice(0, 2) + last + '0000' + centerDigits.slice(2, 5);
  } else if (last === 3) {
    upca = centerDigits.slice(0, 3) + '00000' + centerDigits.slice(3, 5);
  } else if (last === 4) {
    upca = centerDigits.slice(0, 4) + '00000' + centerDigits.slice(4, 5);
  } else {
    upca = centerDigits.slice(0, 5) + '0000' + last;
  }

  return upca + calculateUPCACheckDigit(upca);
}
