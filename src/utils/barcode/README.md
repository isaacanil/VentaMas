# Sistema Modular de Códigos de Barras

Sistema modular inspirado en Firebase v9+ que permite importaciones tree-shaking friendly y mejor organización del código.

## 📁 Estructura

```
src/utils/barcode/
├── barcode.js          # Archivo principal con todas las exportaciones
├── index.js            # Barrel principal para compatibilidad
├── barcodeTests.js     # Pruebas del sistema
└── lib/                # Módulos internos
    ├── constants.js    # Constantes GS1, multiplicadores
    ├── digits.js       # Cálculos de dígitos verificadores
    ├── expansion.js    # Expansión UPC-E a UPC-A
    ├── weight.js       # Códigos de peso/precio variable
    ├── country.js      # Identificación de países por prefijo
    ├── analyzer.js     # Análisis completo de estructura
    ├── suggestions.js  # Sugerencias de corrección
    └── info.js         # Funciones de información y validación
```

## 🚀 Uso

### Importación Modular (Recomendado)

```javascript
// Importar solo las funciones que necesites (tree-shaking)
import { analyzeBarcodeStructure, getBarcodeInfo } from '@/utils/barcode';

// O importar desde el módulo específico
import { calculateGTIN13CheckDigit } from '@/utils/barcode/lib/digits';
```

### Importación Completa (Compatibilidad)

```javascript
// Importar todo el módulo
import * as barcode from '@/utils/barcode';

// O usar importación por defecto
import barcode from '@/utils/barcode';
```

### Funciones de Conveniencia

```javascript
import {
  analyze,
  getInfo,
  validateBarcode,
  getSuggestions,
} from '@/utils/barcode';

const result = analyze('7461234567890');
const info = getInfo('7461234567890');
const isValid = validateBarcode('7461234567890');
const suggestions = getSuggestions('746123456789');
```

## 📚 API Principal

### Análisis y Validación

- `analyzeBarcodeStructure(barcode)` - Análisis completo
- `isValidBarcode(barcode)` - Validación simple
- `getBarcodeInfo(barcode)` - Información resumida

### Cálculo de Dígitos

- `calculateGTIN13CheckDigit(code12)`
- `calculateEAN8CheckDigit(code7)`
- `calculateUPCACheckDigit(code11)`
- `calculateGTIN14CheckDigit(code13)`

### Correcciones

- `generateCorrectionSuggestions(barcode)`
- `hasCorrectionSuggestions(barcode)`
- `getBestCorrectionSuggestion(barcode)`

### Utilidades Específicas

- `isGS1RDCode(barcode)` - Detecta códigos RD
- `extractCompanyPrefix(barcode)` - Extrae prefijo empresa
- `expandUPCEToUPCA(upce)` - Convierte UPC-E a UPC-A
- `identifyCountryByPrefix(code)` - Identifica país

## 🧪 Pruebas

```javascript
import {
  runBarcodeTests,
  testSpecificCode,
} from '@/utils/barcode/barcodeTests';

// Ejecutar todas las pruebas
runBarcodeTests();

// Probar un código específico
const result = testSpecificCode('7461234567890');
```

## 🔄 Migración

Para migrar código existente:

```javascript
// Antes
import { getBarcodeInfo } from '@/utils/barcode/barcodeAnalyzer';

// Después
import { getBarcodeInfo } from '@/utils/barcode';
```

## 📋 Beneficios

1. **Tree Shaking**: Solo se incluye el código que realmente usas
2. **Modularidad**: Cada función tiene su propio módulo
3. **Mantenibilidad**: Código organizdo y fácil de mantener
4. **Compatibilidad**: Sigue funcionando con código existente
5. **Estilo Moderno**: Sigue patrones de Firebase v9+
