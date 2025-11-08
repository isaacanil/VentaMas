# Archivos Eliminados de src/views/component

## Fecha: 8 de noviembre de 2025

### Resumen
Se identificaron y eliminaron **6 archivos** que no estaban siendo utilizados en ningún otro lugar del proyecto.

### Archivos Eliminados

#### 1. Componentes Duplicados con Errores de ESLint (44 errores)
- ✅ `src/views/component/Invoice/templates/Invoicing/InvoiceTemplate1/components/Product.jsx`
- ✅ `src/views/component/Quotation/templates/Invoicing/InvoiceTemplate1/components/Product.jsx`

**Razón**: Estos archivos tenían 22 errores cada uno (variables no definidas, imports faltantes). El código correcto ya existe en `ProductList.jsx` en las mismas carpetas.

#### 2. Componentes de Garantía sin Uso (2 errores cada uno)
- ✅ `src/views/component/Invoice/templates/Invoicing/InvoiceTemplate1/components/WarrantyArea.jsx`
- ✅ `src/views/component/Quotation/templates/Invoicing/InvoiceTemplate1/components/WarrantyArea.jsx`

**Razón**: No se encontraron imports de estos archivos en ningún lugar del código. Causaban errores de "Unable to resolve path".

#### 3. Archivo con Typo en el Nombre
- ✅ `src/views/component/modals/ARInfoModal/ARSumamaryModal.jsx` (typo: "Sumamary")

**Razón**: Duplicado con error tipográfico. El archivo correcto es `ARSummaryModal.jsx` (con doble 'm').

#### 4. Archivo de Plantilla sin Uso
- ✅ `src/views/component/modals/Product/product.js`

**Razón**: Solo contiene una plantilla/esquema de objeto producto que no se estaba importando en ningún lugar.

### Imports Corregidos

Además de eliminar archivos, se corrigieron imports rotos:

1. **AddExpensesCategory.jsx**
   - ❌ `from '../../../templates/system/Inputs/InputV4'`
   - ✅ `from '../../../templates/system/Inputs/GeneralInput/InputV4'`

2. **InvoiceTemplates.jsx** (en Quotation)
   - ❌ `import { Invoice } from '../Invoice/Invoice'` (no existía)
   - ✅ `import { Quotation } from '../Quotation/Quotation'`

3. **Client.jsx**
   - ❌ `from "../highlight/Highlight"` (ruta incorrecta)
   - ✅ `from "../../../../../../templates/system/highlight/Highlight"`
   - ❌ Rutas incorrectas a features (4 niveles en vez de 7)
   - ✅ Corregidas todas las rutas de features

4. **ClientSelectorHeader.jsx**
   - ❌ `import { ClientFilterDropdown } from './ClientFilterDropdown'` (no existe)
   - ✅ Comentado temporalmente con TODO

### Impacto en Errores de ESLint

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|---------|
| **Total de Problemas** | 364 | 310 | -54 (↓15%) |
| **Errores** | 129 → 80 → 76 | 76 | -53 (↓41%) |
| **Warnings** | 235 | 234 | -1 |

**Reducción total de errores: 53 errores eliminados (41% de mejora)**

### Archivos que Aún Necesitan Atención

Los siguientes archivos tienen imports rotos que requieren crear los componentes faltantes:

1. `ClientFilterDropdown.jsx` - Necesita ser creado o su funcionalidad movida a otro lugar
2. Plugins de lightbox: Se requiere instalar `yet-another-react-lightbox` o usar alternativa
3. Varios imports de feature slices en `ProductOutflowModal/OutputProductEntry/StockedProductPicker.jsx`

### Recomendaciones

1. **Crear componente ClientFilterDropdown** o eliminar su uso del ClientSelectorHeader
2. **Revisar StockedProductPicker.jsx** en ProductOutflowModal - tiene muchos imports rotos
3. **Instalar dependencia faltante**: `npm install yet-another-react-lightbox`
4. **Continuar limpieza**: Hay 234 warnings de variables no utilizadas que pueden ser prefijadas con `_`

### Archivos Revisados pero Mantenidos

- `ProductView.jsx` - En uso por routes/paths/Inventory.jsx
- `ProductList.jsx` - Componente principal que reemplaza a Product.jsx eliminado
