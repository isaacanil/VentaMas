import { identifyCountryByPrefix } from './country';
import { calculateGTIN13CheckDigit, calculateEAN8CheckDigit, calculateUPCACheckDigit, calculateGTIN14CheckDigit } from './digits';
import { expandUPCEToUPCA } from './expansion';
import { isVariableWeightCode, analyzeVariableWeightCode } from './weight';

/**
 * Analiza la estructura de un código de barras
 */
export function analyzeBarcodeStructure(barcode) {
  if (!barcode || typeof barcode !== 'string') {
    return { 
      isValid: false, 
      error: 'ERR_EMPTY_CODE', 
      errorMessage: 'Código vacío o inválido', 
      type: null, 
      length: 0 
    };
  }
  
  const cleanCode = barcode.replace(/\s/g, '');
  const length = cleanCode.length;
  
  if (!/^\d+$/.test(cleanCode)) {
    return { 
      isValid: false, 
      error: 'ERR_NON_NUMERIC', 
      errorMessage: 'El código debe contener solo dígitos', 
      type: 'unknown', 
      length, 
      original: barcode, 
      cleaned: cleanCode 
    };
  }
  
  let analysis = { 
    original: barcode, 
    cleaned: cleanCode, 
    length, 
    isValid: false, 
    type: 'unknown', 
    country: null, 
    structure: null, 
    isVariableWeight: false, 
    checkDigit: { 
      provided: null, 
      calculated: null, 
      isValid: false 
    } 
  };
  
  // Análisis según la longitud
  switch (length) {
    case 6:
    case 7:
    case 8:
      // Posible UPC-E
      if (length === 6 || (length >= 7 && cleanCode[0] === '0')) {
        const expandedUPC = expandUPCEToUPCA(cleanCode);
        if (expandedUPC) {
          analysis.type = 'UPC-E';
          analysis.structure = { 
            compressed: cleanCode, 
            expanded: expandedUPC, 
            systemDigit: '0', 
            checkDigit: cleanCode[length - 1] || null 
          };
          analysis.isValid = true;
        }
      }
      
      // Si no es UPC-E válido y tiene 8 dígitos, podría ser EAN-8
      if (!analysis.isValid && length === 8) {
        analysis.type = 'EAN-8';
        analysis.structure = { 
          countryCode: cleanCode.slice(0, 2), 
          productCode: cleanCode.slice(2, 7), 
          checkDigit: cleanCode.slice(7) 
        };
        
        const ean8CheckDigit = calculateEAN8CheckDigit(cleanCode.slice(0, 7));
        analysis.checkDigit = { 
          provided: cleanCode.slice(7), 
          calculated: ean8CheckDigit, 
          isValid: cleanCode.slice(7) === ean8CheckDigit 
        };
        analysis.isValid = analysis.checkDigit.isValid;
      }
      break;
      
    case 12:
      analysis.type = 'UPC-A';
      analysis.structure = { 
        systemDigit: cleanCode[0], 
        manufacturerCode: cleanCode.slice(1, 6), 
        productCode: cleanCode.slice(6, 11), 
        checkDigit: cleanCode.slice(11) 
      };
      const upcCheckDigit = calculateUPCACheckDigit(cleanCode.slice(0, 11));
      analysis.checkDigit = { 
        provided: cleanCode.slice(11), 
        calculated: upcCheckDigit, 
        isValid: cleanCode.slice(11) === upcCheckDigit 
      };
      analysis.isValid = analysis.checkDigit.isValid;
      break;
      
    case 13: {
      // Verificar si es código de peso variable
      if (isVariableWeightCode(cleanCode)) {
        const variableAnalysis = analyzeVariableWeightCode(cleanCode);
        analysis.type = 'GTIN-13 (Peso/Precio Variable)';
        analysis.isVariableWeight = true;
        analysis.structure = variableAnalysis;
      } else {
        analysis.type = 'GTIN-13 (EAN-13)';
      }
      
      // Identificar país
      const countryInfo = identifyCountryByPrefix(cleanCode);
      if (countryInfo) {
        analysis.country = countryInfo;
        
        // Estructura específica para códigos dominicanos (746)
        if (countryInfo.prefix === '746') {
          const afterCountry = cleanCode.slice(3, 12); // 9 dígitos después de 746
          analysis.structure = { 
            countryCode: '746', 
            companyPrefix: afterCountry.slice(0, 4), 
            itemReference: afterCountry.slice(4), 
            checkDigit: cleanCode[12], 
            type: 'GS1 República Dominicana' 
          };
        } else if (!analysis.isVariableWeight) {
          // Estructura genérica para otros países (no variables)
          analysis.structure = { 
            countryCode: countryInfo.prefix, 
            companyAndProduct: cleanCode.slice(countryInfo.prefix.length, 12), 
            checkDigit: cleanCode.slice(12) 
          };
        }
      } else if (!analysis.isVariableWeight) {
        // Sin país identificado y no es variable
        analysis.structure = { 
          countryCode: cleanCode.slice(0, 3), 
          companyAndProduct: cleanCode.slice(3, 12), 
          checkDigit: cleanCode.slice(12) 
        };
      }
      
      // Validar dígito de verificación
      const gtin13CheckDigit = calculateGTIN13CheckDigit(cleanCode.slice(0, 12));
      analysis.checkDigit = { 
        provided: cleanCode.slice(12), 
        calculated: gtin13CheckDigit, 
        isValid: cleanCode.slice(12) === gtin13CheckDigit 
      };
      
      if (!analysis.isValid) { // Solo actualizar si no fue marcado como válido anteriormente
        analysis.isValid = analysis.checkDigit.isValid;
      }
      break;
    }
      
    case 14: {
      analysis.type = 'GTIN-14';
      analysis.structure = { 
        indicator: cleanCode[0], 
        gtin13: cleanCode.slice(1, 13), 
        checkDigit: cleanCode.slice(13) 
      };
      
      // Validar dígito de verificación para GTIN-14
      const gtin14CheckDigit = calculateGTIN14CheckDigit(cleanCode.slice(0, 13));
      analysis.checkDigit = { 
        provided: cleanCode.slice(13), 
        calculated: gtin14CheckDigit, 
        isValid: cleanCode.slice(13) === gtin14CheckDigit 
      };
      analysis.isValid = analysis.checkDigit.isValid;
      break;
    }
      
    default:
      analysis.type = `Código de ${length} dígitos`;
      analysis.error = 'ERR_NON_STANDARD_LENGTH';
      analysis.errorMessage = `Longitud no estándar: ${length} dígitos`;
  }
  
  return analysis;
}
