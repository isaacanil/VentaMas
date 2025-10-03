# Configuración de Módulos de Autorización

## 📋 Descripción General

Se ha implementado un sistema de configuración granular para los módulos de autorización, permitiendo activar/desactivar módulos específicos de forma independiente. Esto da mayor flexibilidad al sistema y permite adaptar las autorizaciones según las necesidades del negocio.

## 🎯 Características Implementadas

### 1. Módulos Disponibles

El sistema ahora soporta dos módulos de autorización que pueden activarse/desactivarse:

- **Facturación** (`invoices`): Control de autorizaciones para editar facturas y aplicar descuentos
- **Cuadre de Caja** (`cashRegister`): Control de autorizaciones para apertura y cierre de caja

### 2. Interfaz de Configuración

**Ubicación**: `Configuración > Flujo de Autorizaciones`

La pantalla de configuración ahora incluye:
- Toggle principal para habilitar/deshabilitar todo el flujo de autorizaciones
- Sección de "Módulos de Autorización Activos" (visible solo cuando el flujo está activado)
- Checkboxes para cada módulo con descripción de su función
- Validación que requiere al menos un módulo activo

### 3. Validaciones

- **Al menos un módulo activo**: No se permite desactivar todos los módulos simultáneamente
- **Activación del flujo**: Al activar el flujo de autorizaciones, se valida que al menos un módulo esté activo
- **Notificaciones**: Mensajes informativos al usuario sobre los cambios realizados

### 4. Comportamiento por Módulo

#### Módulo de Facturación Activo
- Las ediciones de facturas requieren autorización con PIN
- Los descuentos y cambios críticos solicitan PIN de supervisor
- Aparece en la pantalla de Autorizaciones

#### Módulo de Facturación Desactivado
- Las acciones de facturación no requieren autorización especial
- No aparecen solicitudes relacionadas en la pantalla de Autorizaciones

#### Módulo de Cuadre de Caja Activo
- Apertura y cierre de caja requieren autorización con PIN
- Usa el modal moderno `PinAuthorizationModal`
- Permite PIN de 6 dígitos o contraseña completa como fallback

#### Módulo de Cuadre de Caja Desactivado
- Apertura y cierre de caja usan autenticación clásica con contraseña
- Usa el modal tradicional `PeerReviewAuthorization`
- Solo requiere usuario y contraseña (no PIN)

## 📁 Archivos Modificados

### Configuración y Settings

**`src/views/component/GeneralConfig/configs/components/AuthorizationFlowSettingsSection.jsx`**
- Agregada interfaz de selección de módulos
- Validación de al menos un módulo activo
- Handlers para toggle de módulos individuales
- Estilos para las tarjetas de módulos

**`src/firebase/billing/useInitializeBillingSettings.jsx`**
- Inicialización de `enabledAuthorizationModules` con ambos módulos activos por defecto

**`src/features/cart/default/default.js`**
- Agregado `enabledAuthorizationModules` al estado por defecto

### Hook de Utilidad

**`src/hooks/useAuthorizationModules.js`** (NUEVO)
- Hook reutilizable para verificar estado de módulos
- Funciones:
  - `isModuleEnabled(moduleName)`: Verifica si un módulo está activo
  - `shouldUsePinForModule(moduleName)`: Determina si usar PIN para un módulo
  - `hasActiveModules()`: Verifica si hay al menos un módulo activo
- Acceso directo: `isInvoicesModuleEnabled`, `isCashRegisterModuleEnabled`

### Componentes de Cuadre de Caja

**`src/views/pages/CashReconciliation/page/CashRegisterOpening/CashRegisterOpening.jsx`**
- Integración del hook `useAuthorizationModules`
- Lógica condicional para usar PIN o contraseña según configuración
- Importación de `PeerReviewAuthorization` como fallback
- Handler `handleOpenAuthorization()` que decide qué modal mostrar

**`src/views/pages/CashReconciliation/page/CashRegisterClosure/CashRegisterClosure.jsx`**
- Mismas modificaciones que CashRegisterOpening
- Soporte para ambos tipos de autorización según configuración

### Pantalla de Autorizaciones

**`src/views/pages/Authorizations/AuthorizationsManager.jsx`**
- Integración del hook `useAuthorizationModules`
- Alertas informativas cuando módulos están desactivados
- Oculta tabs cuando no hay módulos activos
- Mensajes contextuales según estado de cada módulo

**`src/views/pages/Authorizations/components/PersonalPinManagement.jsx`** ⭐ ACTUALIZADO
- Filtra y muestra solo los módulos activos según configuración
- Oculta módulos desactivados de la lista de PINs del usuario
- Deshabilita botones de generar/solicitar PIN si no hay módulos activos
- Alertas contextuales cuando:
  - El flujo de autorizaciones está desactivado
  - No hay módulos activos en el sistema
  - El usuario no tiene PIN configurado
- El modal de generación solo muestra módulos activos disponibles

## 🔧 Estructura de Datos

### Configuración en Firestore

```javascript
businesses/{businessID}/settings/billing {
  authorizationFlowEnabled: boolean,
  enabledAuthorizationModules: {
    invoices: boolean,      // Módulo de facturación
    cashRegister: boolean   // Módulo de cuadre de caja
  },
  // ... otros campos
}
```

### Valores por Defecto

```javascript
{
  authorizationFlowEnabled: false,
  enabledAuthorizationModules: {
    invoices: true,
    cashRegister: true
  }
}
```

## 🚀 Uso

### Para Desarrolladores

#### Verificar si un módulo está activo

```javascript
import { useAuthorizationModules } from '../hooks/useAuthorizationModules';

function MiComponente() {
  const { isModuleEnabled, shouldUsePinForModule } = useAuthorizationModules();
  
  if (shouldUsePinForModule('cashRegister')) {
    // Usar PinAuthorizationModal
  } else {
    // Usar PeerReviewAuthorization o no requerir autorización
  }
}
```

#### Acceso directo a módulos específicos

```javascript
const { 
  isInvoicesModuleEnabled, 
  isCashRegisterModuleEnabled 
} = useAuthorizationModules();

if (isInvoicesModuleEnabled) {
  // Lógica para facturación con PIN
}
```

### Para Administradores

1. Ir a **Configuración > Flujo de Autorizaciones**
2. Activar el toggle principal "Habilitar Flujo de Autorizaciones"
3. Seleccionar los módulos deseados:
   - ✅ **Facturación**: Para control de edición de facturas
   - ✅ **Cuadre de Caja**: Para control de apertura/cierre de caja
4. Guardar cambios

**Nota**: Al menos un módulo debe estar activo mientras el flujo esté habilitado.

## 🎨 UI/UX

### Módulos de Autorización Activos

```
┌─────────────────────────────────────────────────┐
│ Módulos de Autorización Activos                │
│ Selecciona qué áreas requieren autorización... │
│                                                 │
│ ┌─────────────────────┐ ┌────────────────────┐ │
│ │ ☑ Facturación       │ │ ☑ Cuadre de Caja   │ │
│ │ Requiere autoriza-  │ │ Requiere autoriza- │ │
│ │ ción para editar... │ │ ción para apertu...│ │
│ └─────────────────────┘ └────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Alertas en AuthorizationsManager

Cuando módulos están desactivados, se muestran alertas informativas:

- 🟡 **Flujo desactivado**: Indica ir a configuración para activar
- 🔵 **Módulo de Facturación desactivado**: Informa que no habrá solicitudes de facturas
- 🔵 **Módulo de Cuadre de Caja desactivado**: Informa que se usará contraseña clásica

## 🔐 Seguridad

- **Validación en cliente**: Previene desactivar todos los módulos
- **Configuración persistente**: Los cambios se guardan en Firestore
- **Fallback seguro**: Si no hay configuración, ambos módulos están activos por defecto
- **Autorización requerida**: Incluso con módulos desactivados, se requiere contraseña para acciones críticas

## � Integración con Descuentos en Cart

El sistema de descuentos en el carrito también depende del módulo de facturación:

**`src/views/component/cart/components/InvoiceSummary/InvoiceSummary.jsx`**
- Usa `useAuthorizationModules()` para verificar si requiere PIN
- Solo cajeros necesitan PIN cuando el módulo de facturación está activo
- Administradores y managers pueden aplicar descuentos sin restricción
- Muestra mensaje de "Requiere autorización con PIN" cuando aplica
- Muestra quién autorizó el descuento una vez aprobado

```javascript
const { shouldUsePinForModule } = useAuthorizationModules();
const shouldRequirePinForDiscount = shouldUsePinForModule('invoices') && isCashier;
```

## �🐛 Debugging

Si los módulos no se comportan como esperado:

1. Verificar configuración en Firestore:
   ```
   businesses/{businessID}/settings/billing
   ```

2. Verificar que el hook retorne valores correctos:
   ```javascript
   console.log(useAuthorizationModules());
   ```

3. Verificar Redux store:
   ```javascript
   const settings = useSelector(SelectSettingCart);
   console.log(settings?.billing?.enabledAuthorizationModules);
   ```

4. Verificar en descuentos:
   ```javascript
   const { shouldUsePinForModule, isInvoicesModuleEnabled } = useAuthorizationModules();
   console.log('PIN para invoices:', shouldUsePinForModule('invoices'));
   console.log('Módulo facturación activo:', isInvoicesModuleEnabled);
   ```

## 📝 Notas Adicionales

- Los módulos son independientes entre sí
- La desactivación de un módulo no afecta a los PINs ya generados
- Los usuarios mantienen sus PINs incluso si los módulos se desactivan temporalmente
- Al reactivar un módulo, los PINs vuelven a funcionar inmediatamente

## 🎯 Casos de Uso

### Caso 1: Solo Facturación
- Activar: ✅ Facturación
- Desactivar: ❌ Cuadre de Caja
- Resultado: Facturación con PIN, Cuadre de caja con contraseña clásica

### Caso 2: Solo Cuadre de Caja
- Activar: ✅ Cuadre de Caja
- Desactivar: ❌ Facturación
- Resultado: Cuadre de caja con PIN, Facturación sin restricciones especiales

### Caso 3: Ambos Módulos
- Activar: ✅ Facturación, ✅ Cuadre de Caja
- Resultado: Todo el flujo de autorizaciones funciona con PIN

### Caso 4: Flujo Desactivado
- Desactivar flujo principal
- Resultado: Ni facturación ni cuadre de caja requieren autorizaciones especiales

## 🔄 Migración

Para sistemas existentes, la migración es automática:
- Si no existe `enabledAuthorizationModules`, se inicializa con ambos módulos activos
- Los usuarios existentes no verán cambios en el comportamiento por defecto
- Los administradores pueden configurar módulos después de la actualización
