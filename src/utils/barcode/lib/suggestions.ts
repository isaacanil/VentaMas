// @ts-nocheck
import { analyzeBarcodeStructure } from './analyzer';
import {
  calculateGTIN13CheckDigit,
  calculateEAN8CheckDigit,
  calculateUPCACheckDigit,
  calculateGTIN14CheckDigit,
} from './digits';
import { expandUPCEToUPCA } from './expansion';

/**
 * Genera sugerencias de corrección para un código de barras
 */
export function generateCorrectionSuggestions(barcode) {
  if (!barcode || typeof barcode !== 'string') {
    return [];
  }

  const suggestions = [];
  const cleanCode = barcode.replace(/[^0-9]/g, '');
  const length = cleanCode.length;

  // Sugerencia para UPC-E a UPC-A (6-8 dígitos)
  if (length >= 6 && length <= 8 && /^\d+$/.test(cleanCode)) {
    const expandedUPC = expandUPCEToUPCA(cleanCode);
    if (expandedUPC) {
      suggestions.push({
        id: 'expand_upce_to_upca',
        type: 'Expandir UPC-E',
        code: expandedUPC,
        description: `Expandir UPC-E a UPC-A: ${expandedUPC}`,
        color: 'cyan',
        reason: 'expand',
      });
    }
  }

  // Sugerencia para completar EAN-8 (7 dígitos)
  if (length === 7 && /^\d{7}$/.test(cleanCode)) {
    const checkDigit = calculateEAN8CheckDigit(cleanCode);
    if (checkDigit !== null) {
      suggestions.push({
        id: 'complete_ean8',
        type: 'Completar EAN-8',
        code: cleanCode + checkDigit,
        description: `Agregar dígito verificador EAN-8: ${checkDigit}`,
        color: 'blue',
        reason: 'complete',
      });
    }
  }

  // Sugerencia para completar UPC-A (11 dígitos)
  if (length === 11 && /^\d{11}$/.test(cleanCode)) {
    const checkDigit = calculateUPCACheckDigit(cleanCode);
    if (checkDigit !== null) {
      suggestions.push({
        id: 'complete_upca',
        type: 'Completar UPC-A',
        code: cleanCode + checkDigit,
        description: `Agregar dígito verificador UPC-A: ${checkDigit}`,
        color: 'blue',
        reason: 'complete',
      });
    }
  }

  // Sugerencia para completar GTIN-13 (12 dígitos)
  if (length === 12 && /^\d{12}$/.test(cleanCode)) {
    const checkDigit = calculateGTIN13CheckDigit(cleanCode);
    if (checkDigit !== null) {
      suggestions.push({
        id: 'complete_gtin13',
        type: 'Completar GTIN-13',
        code: cleanCode + checkDigit,
        description: `Agregar dígito verificador: ${checkDigit}`,
        color: 'blue',
        reason: 'complete',
      });
    }
  }

  // Sugerencia para completar GTIN-14 (13 dígitos)
  if (length === 13 && /^\d{13}$/.test(cleanCode)) {
    // Verificar si ya es un GTIN-13 válido
    const analysis = analyzeBarcodeStructure(cleanCode);
    if (!analysis.isValid) {
      // Intentar como GTIN-14 agregando un indicador 0
      const gtin14Code = '0' + cleanCode;
      const checkDigit = calculateGTIN14CheckDigit(gtin14Code.substring(0, 13));
      if (checkDigit !== null) {
        suggestions.push({
          id: 'convert_to_gtin14',
          type: 'Convertir a GTIN-14',
          code: gtin14Code.substring(0, 13) + checkDigit,
          description: `Convertir a GTIN-14 con indicador 0`,
          color: 'purple',
          reason: 'convert',
        });
      }
    } else {
      // Si es GTIN-13 válido pero el usuario quiere GTIN-14
      const checkDigit = calculateGTIN14CheckDigit(
        '0' + cleanCode.substring(0, 12),
      );
      if (checkDigit !== null) {
        suggestions.push({
          id: 'upgrade_to_gtin14',
          type: 'Convertir a GTIN-14',
          code: '0' + cleanCode.substring(0, 12) + checkDigit,
          description: `Convertir GTIN-13 válido a GTIN-14`,
          color: 'purple',
          reason: 'convert',
        });
      }
    }
  }

  // Sugerencias para corregir dígitos verificadores incorrectos
  if (length === 8 && /^\d{8}$/.test(cleanCode)) {
    applyFix(
      cleanCode,
      calculateEAN8CheckDigit,
      7,
      'fix_ean8_check_digit',
      'Corregir EAN-8',
      suggestions,
    );
  }

  if (length === 12 && /^\d{12}$/.test(cleanCode)) {
    applyFix(
      cleanCode,
      calculateUPCACheckDigit,
      11,
      'fix_upca_check_digit',
      'Corregir UPC-A',
      suggestions,
    );
  }

  if (length === 13 && /^\d{13}$/.test(cleanCode)) {
    applyFix(
      cleanCode,
      calculateGTIN13CheckDigit,
      12,
      'fix_gtin13_check_digit',
      'Corregir GTIN-13',
      suggestions,
    );
  }

  if (length === 14 && /^\d{14}$/.test(cleanCode)) {
    applyFix(
      cleanCode,
      calculateGTIN14CheckDigit,
      13,
      'fix_gtin14_check_digit',
      'Corregir GTIN-14',
      suggestions,
    );
  }

  // Sugerencia para códigos cortos con ceros
  if (length < 12 && length > 0 && /^\d+$/.test(cleanCode)) {
    // Expandir a diferentes longitudes objetivo
    const targets = [
      {
        length: 8,
        name: 'EAN-8',
        calculator: calculateEAN8CheckDigit,
        digits: 7,
      },
      {
        length: 12,
        name: 'UPC-A',
        calculator: calculateUPCACheckDigit,
        digits: 11,
      },
      {
        length: 13,
        name: 'GTIN-13',
        calculator: calculateGTIN13CheckDigit,
        digits: 12,
      },
    ];

    targets.forEach((target) => {
      if (length <= target.digits) {
        const paddedCode = cleanCode.padStart(target.digits, '0');
        const checkDigit = target.calculator(paddedCode);

        if (checkDigit !== null) {
          suggestions.push({
            id: `pad_to_${target.name.toLowerCase().replace('-', '')}`,
            type: `Expandir a ${target.name}`,
            code: paddedCode + checkDigit,
            description: `Completar con ceros a la izquierda (${length} → ${target.length} dígitos)`,
            color: 'green',
            reason: 'expand',
          });
        }
      }
    });
  }

  // Sugerencia para limpiar caracteres no numéricos
  if (barcode !== cleanCode && cleanCode.length > 0) {
    suggestions.push({
      id: 'clean_non_numeric',
      type: 'Limpiar',
      code: cleanCode,
      description: `Eliminar caracteres no numéricos`,
      color: 'purple',
      reason: 'clean',
    });

    // Si después de limpiar queda un código, generar más sugerencias recursivamente
    if (cleanCode.length > 0) {
      const cleanSuggestions = generateCorrectionSuggestions(cleanCode);
      cleanSuggestions.forEach((suggestion) => {
        if (suggestion.id !== 'clean_non_numeric') {
          // Evitar duplicados
          suggestion.id = 'clean_and_' + suggestion.id;
          suggestion.description =
            'Limpiar y ' + suggestion.description.toLowerCase();
          suggestions.push(suggestion);
        }
      });
    }
  }

  // Sugerencia para códigos muy largos (truncar)
  if (length > 14 && /^\d+$/.test(cleanCode)) {
    // Intentar truncar a diferentes longitudes
    const targets = [
      {
        length: 14,
        name: 'GTIN-14',
        calculator: calculateGTIN14CheckDigit,
        digits: 13,
      },
      {
        length: 13,
        name: 'GTIN-13',
        calculator: calculateGTIN13CheckDigit,
        digits: 12,
      },
      {
        length: 12,
        name: 'UPC-A',
        calculator: calculateUPCACheckDigit,
        digits: 11,
      },
    ];

    targets.forEach((target) => {
      const truncated = cleanCode.substring(0, target.digits);
      const checkDigit = target.calculator(truncated);

      if (checkDigit !== null) {
        suggestions.push({
          id: `truncate_to_${target.name.toLowerCase().replace('-', '')}`,
          type: `Truncar a ${target.name}`,
          code: truncated + checkDigit,
          description: `Truncar a ${target.length} dígitos y recalcular verificador`,
          color: 'red',
          reason: 'truncate',
        });
      }
    });

    // También sugerir tomar los últimos dígitos
    if (length >= 13) {
      const last13 = cleanCode.substring(length - 13);
      const analysis = analyzeBarcodeStructure(last13);

      if (analysis.isValid) {
        suggestions.push({
          id: 'take_last_13',
          type: 'Usar últimos 13',
          code: last13,
          description: `Usar los últimos 13 dígitos`,
          color: 'red',
          reason: 'truncate',
        });
      }
    }
  }

  return suggestions;
}

function applyFix(code, calculator, pos, id, label, suggestions) {
  const correctCheckDigit = calculator(code.substring(0, pos));
  const currentCheckDigit = code.substring(pos, pos + 1);

  if (correctCheckDigit && correctCheckDigit !== currentCheckDigit) {
    suggestions.push({
      id,
      type: label,
      code: code.substring(0, pos) + correctCheckDigit,
      description: `${label}: ${currentCheckDigit} → ${correctCheckDigit}`,
      color: 'orange',
      reason: 'fix',
    });
  }
}

export function hasCorrectionSuggestions(barcode) {
  return generateCorrectionSuggestions(barcode).length > 0;
}

export function getBestCorrectionSuggestion(barcode) {
  const suggestions = generateCorrectionSuggestions(barcode);
  if (!suggestions.length) return null;

  const priorityOrder = ['fix', 'complete', 'clean', 'expand', 'truncate'];
  for (const reason of priorityOrder) {
    const suggestion = suggestions.find((s) => s.reason === reason);
    if (suggestion) return suggestion;
  }

  return suggestions[0];
}
