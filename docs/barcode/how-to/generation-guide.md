# Guía de uso - Sistema de Generación de Códigos de Barras

## ⚡ Resumen rápido

Aprende a generar códigos GTIN (UPC/EAN/GTIN-14) con utilidades reutilizables (`generateGTIN`, `generateGTIN13/14`, `generateNextItemReference`) y estructuras recomendadas por catálogo.

## Lista de verificación

- [ ] Tener acceso a `./utils/barcode/barcode`.
- [ ] Conocer el prefijo GS1 y el tamaño del catálogo.
- [ ] Definir formato de salida (GTIN13 o 14) y largo del Item Reference.
- [ ] Configurar tests o consola para validar resultados.

## Procedimiento

### Nuevas funciones genéricas y escalables

### 1. Generación básica (recomendada)

```javascript
import {
  generateGTIN,
  generateGTIN13,
  generateGTIN14,
} from './utils/barcode/barcode';

// Generar GTIN13 para República Dominicana
const barcode = generateGTIN13('DO', '12345', '67890');
console.log(barcode); // 74612345678905

// Generar GTIN13 para México
const barcodeMX = generateGTIN13('MX', '123', '456789');
console.log(barcodeMX); // 75012345678904

// Generar GTIN14 para EE.UU. (empaque especial)
const gtin14 = generateGTIN14('US', '12345', '67890', '2');
console.log(gtin14); // 20123456789056
```

### 2. Generación avanzada con configuración

```javascript
import {
  generateGTIN,
  validateGenerationConfig,
  getRecommendedStructure,
} from './utils/barcode/barcode';

// Configurar para empresa mediana
const config = {
  country: 'CO', // Colombia
  companyPrefix: '12345',
  itemReference: '6789',
  format: 'GTIN13',
};

// Validar antes de generar
const validation = validateGenerationConfig(config);
if (validation.isValid) {
  const barcode = generateGTIN(config);
  console.log(barcode); // 7701234567894
} else {
  console.error('Errores:', validation.errors);
}
```

### 3. Recomendaciones por catálogo

```javascript
import { getRecommendedStructure } from './utils/barcode/barcode';

// Para empresa con 500 productos
const smallCatalog = getRecommendedStructure(500);
console.log(smallCatalog);
// {
//   name: 'Empresa Grande',
//   companyPrefixLength: 6,
//   itemReferenceLength: 3,
//   maxProducts: 999
// }

// Para empresa con 50,000 productos
const largeCatalog = getRecommendedStructure(50000);
console.log(largeCatalog);
// {
//   name: 'Empresa Pequeña',
//   companyPrefixLength: 4,
//   itemReferenceLength: 5,
//   maxProducts: 99999
// }
```

### 4. Generación automática de referencias

```javascript
import { generateNextItemReference } from './utils/barcode/barcode';

// Generar siguiente referencia con 5 dígitos
const nextRef = generateNextItemReference(123, 5);
console.log(nextRef); // "00124"

// Para secuencia automática
let currentRef = 0;
for (let i = 0; i < 3; i++) {
  currentRef++;
  const ref = generateNextItemReference(currentRef - 1, 4);
  const barcode = generateGTIN13('DO', '123456', ref);
  console.log(`Producto ${i + 1}: ${barcode}`);
}
// Producto 1: 7461234560011
// Producto 2: 7461234560028
// Producto 3: 7461234560035
```

### 5. Países soportados

```javascript
import { GS1_PREFIXES } from './utils/barcode/barcode';

// Ver todos los países disponibles
Object.keys(GS1_PREFIXES).forEach((country) => {
  const info = GS1_PREFIXES[country];
  console.log(`${country}: ${info.name} (${info.prefix})`);
});

// DO: República Dominicana (746)
// US: Estados Unidos y Canadá (0)
// MX: México (750)
// CO: Colombia (770)
// AR: Argentina (778)
// ... etc
```

### 6. Retrocompatibilidad

```javascript
// La función antigua sigue funcionando (con advertencia)
import { generateGTIN13RD } from './utils/barcode/barcode';

const oldWay = generateGTIN13RD('123456', '789');
console.log(oldWay); // 7461234567894
// Advertencia: generateGTIN13RD está deprecada

// Mejor usar la nueva forma:
const newWay = generateGTIN13('DO', '123456', '789');
console.log(newWay); // 7461234567894
```

### Ventajas del nuevo sistema

### ✅ Escalable

- Soporta 50+ países
- Configuraciones flexibles de empresa
- Fácil agregar nuevos países

### ✅ Validado

- Validación previa a generación
- Mensajes de error claros
- Configuraciones recomendadas

### ✅ Modular

- Importaciones individuales (tree-shaking)
- Arquitectura estilo Firebase v9+
- Fácil mantenimiento

### ✅ Compatible

- Funciones obsoletas siguen funcionando
- Migración gradual posible
- Sin romper código existente

## Verificación

- Ejecuta los ejemplos de `generateGTIN13`/`generateGTIN14` y confirma que los checksums coinciden con GS1.
- Valida que `validateGenerationConfig` retorne errores cuando el prefijo o referencia no cumplen el largo esperado.
- Recorre `getRecommendedStructure` con distintos catálogos y verifica que `companyPrefixLength + itemReferenceLength` se mantenga en 9.
- Usa `generateNextItemReference` en bucles pequeños para asegurar incremento correcto y padding.

## Referencias

- `src/utils/barcode/barcode.js`
- `src/hooks/useBarcodeSettings.js`
- `docs/barcode/reference/gs1-implementation.md`

### Migración recomendada

1. **Inmediato**: Cambiar imports de archivos eliminados
2. **Gradual**: Reemplazar `generateGTIN13RD` por `generateGTIN13`
3. **Futuro**: Usar configuraciones avanzadas para nuevas funcionalidades
