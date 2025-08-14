# Sistema de Generación de Códigos de Barras GS1 República Dominicana

## Nuevas Funcionalidades

### 1. Configuración Persistente en Firebase

El sistema ahora guarda automáticamente la configuración de códigos de barras en Firebase:

- **Ubicación**: `businesses/{businessID}/settings/barcode`
- **Datos guardados**:
  - `companyPrefix`: Prefijo asignado por GS1 RD
  - `companyPrefixLength`: Longitud del prefijo (6-9 dígitos)
  - `itemReferenceLength`: Longitud de la referencia (1-3 dígitos)
  - `name`: Nombre de la configuración
  - `description`: Descripción de la configuración
  - `maxProducts`: Máximo de productos que se pueden generar

### 2. Generación Automática del Item Reference

- **Contador automático**: Utiliza el sistema de contadores de Firebase para generar números secuenciales
- **Ubicación del contador**: `businesses/{businessID}/counters/lastItemReference`
- **Formato**: Los números se formatean con ceros a la izquierda según la longitud configurada

### 3. Componentes Mejorados

#### BarcodeGenerator.jsx
- **Modo automático**: Genera códigos sin necesidad de ingresar manualmente el Item Reference
- **Modo manual**: Permite ingresar manualmente tanto Company Prefix como Item Reference
- **Pestañas**: Separación clara entre generación y configuración
- **Validación**: Validación en tiempo real de los códigos generados

#### BarCode.jsx
- **Integración completa**: Botón para abrir el generador directamente desde el formulario de productos
- **Estado inteligente**: Muestra "Configurar" o "Generar" dependiendo del estado de configuración
- **Notificaciones**: Feedback visual cuando se genera un código

### 4. Servicios Firebase

#### barcodeSettings.js
- `setBarcodeSettings(user, settings)`: Guarda configuración
- `getBarcodeSettings(user)`: Obtiene configuración
- `updateCompanyPrefix(user, companyPrefix)`: Actualiza solo el prefijo
- `initializeBarcodeSettings(user, config)`: Inicializa configuración por defecto

#### barcodeGeneration.js
- `generateNextItemReference(user)`: Genera el próximo Item Reference
- `generateAutoBarcode(user, companyPrefix)`: Genera código completo automáticamente
- `validateItemReference(user, itemReference)`: Valida formato
- `previewNextItemReference(user)`: Muestra próximo número sin consumir

### 5. Hook Personalizado

#### useBarcodeSettings.js
- Estado de configuración
- Funciones para guardar/cargar configuración
- Generación automática de códigos
- Manejo de errores y loading states

## Flujo de Uso

### Primera Configuración
1. El usuario abre el generador de códigos
2. Selecciona el rango de productos esperados
3. Ingresa su Company Prefix asignado por GS1 RD
4. Guarda la configuración (se almacena en Firebase)

### Generación de Códigos
1. **Modo Automático** (Recomendado):
   - El sistema genera automáticamente el Item Reference
   - Utiliza el Company Prefix guardado
   - Incrementa el contador automáticamente

2. **Modo Manual**:
   - Permite ingresar manualmente el Item Reference
   - Útil para casos especiales o migración de datos

### Estructura del Código GTIN-13
```
746 + [Company Prefix] + [Item Reference] + [Check Digit]
```

Ejemplo: `7460123456001`
- `746`: Prefijo GS1 República Dominicana
- `012345`: Company Prefix (6 dígitos)
- `600`: Item Reference (3 dígitos)
- `1`: Check Digit (calculado automáticamente)

## Beneficios

1. **Automatización**: Reduce errores humanos en la generación de códigos
2. **Consistencia**: Todos los códigos siguen el estándar GS1 RD
3. **Escalabilidad**: Configuración se adapta al tamaño del negocio
4. **Persistencia**: Configuración se guarda para uso futuro
5. **Trazabilidad**: Contador secuencial permite rastrear todos los productos

## Configuraciones Disponibles

- **Empresa Pequeña**: 6+3 dígitos (1,000 productos)
- **Empresa Mediana**: 7+2 dígitos (100 productos)
- **Empresa Grande**: 8+1 dígitos (10 productos)
- **Empresa Muy Grande**: 9+0 dígitos (1 producto por prefijo)

## Notas Técnicas

- Los códigos son neutrales al tipo de producto
- El sistema utiliza transacciones para mantener consistencia
- Se incluye validación completa del formato GTIN-13
- Compatible con escáneres de códigos de barras estándar
