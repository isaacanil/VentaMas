# Modo de Uso Interno - Códigos de Barras

## ¿Qué es el Modo de Uso Interno?

El **Modo de Uso Interno** permite a las empresas generar códigos de barras maximizando la cantidad de productos disponibles, sin las restricciones del estándar GS1 global.

### ¿Cuál es la diferencia?

#### Modo Estándar GS1
```
746 | 1234 | 56789 | 0
 ↑     ↑      ↑     ↑
País  Company Item   Check
      Prefix  Ref    Digit
```
- **Company Prefix**: 4-7 dígitos (asignados por GS1)
- **Item Reference**: 2-5 dígitos para productos
- **Limitación**: Máximo 99,999 productos con Company Prefix de 4 dígitos

#### Modo Uso Interno
```
746 | 00 | 1234567 | 0
 ↑     ↑      ↑      ↑
País  Cat   Item     Check
      
O sin categorías:
746 | 123456789 | 0
 ↑        ↑       ↑
País    Item     Check
```
- **Sin Company Prefix**: Todos los dígitos para productos
- **Máximo**: 999,999,999 productos (999 millones)

## Estructuras Disponibles

### 1. Uso Interno Estándar
- **Categorías**: 0 dígitos
- **Productos**: 9 dígitos
- **Capacidad**: 999,999,999 productos
- **Ejemplo**: `7461234567890`

### 2. Uso Interno con Categorías
- **Categorías**: 2 dígitos (00-99)
- **Productos**: 7 dígitos por categoría
- **Capacidad**: 99 categorías × 9,999,999 productos = 999M productos
- **Ejemplo**: `74601123456789` (Categoría 01, Producto 1234567)

### 3. Uso Interno Básico
- **Categorías**: 3 dígitos (000-999)
- **Productos**: 6 dígitos por categoría
- **Capacidad**: 999 categorías × 999,999 productos = 999M productos
- **Ejemplo**: `7460011234567` (Categoría 001, Producto 123456)

## Casos de Uso

### Para E-commerce con Muchos Productos
```javascript
// Estructura: Sin categorías, máxima capacidad
generateInternalGTIN13RD('', '000000001'); // 7460000000018
generateInternalGTIN13RD('', '000000002'); // 7460000000025
generateInternalGTIN13RD('', '000000003'); // 7460000000032
```

### Para Tienda con Departamentos
```javascript
// Estructura: 2 dígitos categoría + 7 dígitos producto
generateInternalGTIN13RD('01', '0000001'); // Electrónicos
generateInternalGTIN13RD('02', '0000001'); // Ropa
generateInternalGTIN13RD('03', '0000001'); // Hogar
```

### Para Manufactura con Líneas de Productos
```javascript
// Estructura: 3 dígitos línea + 6 dígitos producto
generateInternalGTIN13RD('001', '000001'); // Línea premium
generateInternalGTIN13RD('002', '000001'); // Línea económica
generateInternalGTIN13RD('999', '999999'); // Último producto posible
```

## Ventajas

✅ **Máxima Capacidad**: Hasta 999 millones de productos
✅ **No Requiere Membresía GS1**: Ahorro en costos
✅ **Flexibilidad Total**: Puedes organizar como necesites
✅ **Compatibilidad**: Funcionan con lectores estándar
✅ **Escalabilidad**: Perfecto para crecimiento rápido

## Limitaciones

⚠️ **Solo Uso Interno**: No compatible con estándares GS1 globales
⚠️ **No Intercambiable**: No válido para distribución externa
⚠️ **Base de Datos Propia**: Requiere tu propio sistema de gestión

## ¿Cuándo Usar Cada Modo?

### Usa Modo Estándar GS1 si:
- Vendes en tiendas físicas externas
- Necesitas intercambio con proveedores/distribuidores
- Requieres compatibilidad global
- Tienes pocos productos (< 99,999)

### Usa Modo Interno si:
- Vendes solo online o en tus propias tiendas
- Tienes muchos productos (> 100,000)
- Quieres ahorrar costos de membresía GS1
- Necesitas máxima flexibilidad de organización

## Implementación en VentaMax

La interfaz permite cambiar entre modos fácilmente:

1. **Tab "Estándar GS1"**: Generación tradicional con Company Prefix
2. **Tab "Uso Interno"**: Generación maximizada sin restricciones GS1

Ambos modos generan códigos válidos que funcionan con cualquier lector de códigos de barras.
