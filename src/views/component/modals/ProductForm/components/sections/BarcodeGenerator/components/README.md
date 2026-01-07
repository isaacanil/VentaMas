# BarcodeGenerator - Componentes

Este directorio contiene los componentes separados del generador de códigos de barras GTIN-13.

## Estructura de Componentes

### 🎯 **BarcodeGenerator.tsx** (Componente Principal)

- Maneja el estado global y la lógica de negocio
- Coordina la comunicación entre componentes
- Contiene las funciones de validación y generación

### 📱 **GenerateTab.tsx**

- Pestaña principal para generar códigos
- Formulario de entrada de datos
- Validación en tiempo real
- Integra BarcodePreview y BarcodeResult

### ⚙️ **ConfigurationTab.tsx**

- Pestaña de configuración de empresa
- Configuración de Company Prefix
- Integra CodeStructure para visualización

### 🎨 **BarcodeResult.tsx**

- Muestra el código de barras generado
- Renderiza el componente Barcode
- Mensaje de validación

### 👁️ **BarcodePreview.tsx**

- Previsualización en tiempo real del código
- Se actualiza conforme el usuario escribe
- Muestra formato GTIN-13 estructurado

### 🏗️ **CodeStructure.tsx**

- Visualización de la estructura del código
- Muestra los componentes: GS1 RD | Company | Products | Check
- Representación visual con colores

## Flujo de Datos

```
BarcodeGenerator (Estado & Lógica)
    ├── GenerateTab
    │   ├── BarcodePreview
    │   └── BarcodeResult
    └── ConfigurationTab
        └── CodeStructure
```

## Props Principales

### GenerateTab

- `form`: Instancia del formulario Ant Design
- `isConfigured`: Boolean - Si la empresa está configurada
- `autoMode`: Boolean - Modo automático vs manual
- `manualValues`: Object - Valores ingresados manualmente
- `selectedConfig`: Object - Configuración actual
- `handleGenerateCode`: Function - Generar código de barras

### ConfigurationTab

- `selectedConfig`: Object - Configuración seleccionada
- `handleCompanyPrefixChange`: Function - Cambio en Company Prefix
- `handleSaveConfiguration`: Function - Guardar configuración

### BarcodeResult

- `generatedCode`: String - Código generado para mostrar

### BarcodePreview

- `autoMode`: Boolean - Modo automático
- `selectedConfig`: Object - Configuración actual
- `nextItemReference`: String - Próximo número de referencia
- `livePreview`: String - Vista previa en tiempo real

### CodeStructure

- `selectedConfig`: Object - Configuración para mostrar estructura

## Beneficios de la Separación

1. **Mantenibilidad**: Cada componente tiene una responsabilidad específica
2. **Reutilización**: Los componentes pueden ser reutilizados en otros contextos
3. **Testing**: Más fácil hacer pruebas unitarias de cada componente
4. **Performance**: React puede optimizar re-renders de componentes individuales
5. **Legibilidad**: Código más limpio y fácil de entender
