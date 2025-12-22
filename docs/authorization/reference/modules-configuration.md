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

## Integración con Descuentos en Cart

El sistema de descuentos en el carrito también depende del módulo de facturación:

**`src/views/pages/Sale/components/Cart/components/InvoiceSummary/InvoiceSummary.jsx`**

- Usa `useAuthorizationModules()` para verificar si requiere PIN
- Solo cajeros necesitan PIN cuando el módulo de facturación está activo
- Administradores y managers pueden aplicar descuentos sin restricción
- Muestra mensaje de "Requiere autorización con PIN" cuando aplica
- Muestra quién autorizó el descuento una vez aprobado

```javascript
const { shouldUsePinForModule } = useAuthorizationModules();
const shouldRequirePinForDiscount =
  shouldUsePinForModule('invoices') && isCashier;
```

## 🐛 Debugging

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
   const { shouldUsePinForModule, isInvoicesModuleEnabled } =
     useAuthorizationModules();
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
# Configuración de Módulos de Autorización

## 📘 Descripción

El flujo de configuraciones permite activar o desactivar módulos de autorización independientes: Facturación (`invoices`) y Cuadre de Caja (`cashRegister`). La UI se encuentra en `Configuración > Flujo de Autorizaciones` e incluye un toggle global y tarjetas para cada módulo. Siempre se exige mantener al menos un módulo activo cuando el flujo está habilitado.

### Comportamiento por módulo

- **Facturación activo**: edición de facturas y descuentos piden PIN (aparece en Authorizations).
- **Facturación desactivado**: las acciones vuelven a flujo clásico sin solicitudes.
- **Cuadre de caja activo**: apertura/cierre usa `PinAuthorizationModal`.
- **Cuadre de caja desactivado**: vuelve a `PeerReviewAuthorization` (usuario/contraseña).

## Campos / parámetros

### Configuración en Firestore

```javascript
businesses/{businessId}/settings/billing {
  authorizationFlowEnabled: boolean,
  enabledAuthorizationModules: {
    invoices: boolean,
    cashRegister: boolean
  }
}
```

### Valores por defecto

```javascript
{
  authorizationFlowEnabled: false,
  enabledAuthorizationModules: {
    invoices: true,
    cashRegister: true
  }
}
```

## APIs / rutas

### Hooks y utilidades

- `src/hooks/useAuthorizationModules.js`
  - `isModuleEnabled(module)`
  - `shouldUsePinForModule(module)`
  - `hasActiveModules()`
  - Helpers específicos: `isInvoicesModuleEnabled`, `isCashRegisterModuleEnabled`
- `src/firebase/billing/useInitializeBillingSettings.jsx`: inicializa `enabledAuthorizationModules`.
- `src/features/cart/default/default.js`: agrega los flags al estado inicial del carrito.

### Componentes clave

- `AuthorizationFlowSettingsSection.jsx`: UI de ajustes, validación de “al menos un módulo”.
- `CashRegisterOpening/CashRegisterClosure`: usan el hook para decidir si abrir `PinAuthorizationModal` o `PeerReviewAuthorization`.
- `Authorizations/AuthorizationsManager.jsx` y `PersonalPinManagement.jsx`: muestran/se ocultan tabs y botones según módulos activos.

### Uso recomendado

- **Desarrolladores**: consumir `useAuthorizationModules()` para decidir qué modal o flujo presentar en cada módulo.
- **Administradores**: activar el toggle global, elegir módulos deseados, guardar cambios (nota: no se permiten 0 módulos activos).

## Versionado / compatibilidad

- Disponible desde 2025-Q3; soporta únicamente `invoices` y `cashRegister`.
- El hook funciona en web y Vite; no requiere backend adicional.
- Validaciones en la UI impiden dejar el flujo sin módulos, pero el backend debe asumir defaults (`true/true`) si los campos faltan.

## Recursos relacionados

- `src/views/component/GeneralConfig/configs/components/AuthorizationFlowSettingsSection.jsx`
- `src/hooks/useAuthorizationModules.js`
- `src/views/pages/CashReconciliation/page/CashRegisterOpening/CashRegisterOpening.jsx`
- `src/views/pages/CashReconciliation/page/CashRegisterClosure/CashRegisterClosure.jsx`
- `src/views/pages/Authorizations/AuthorizationsManager.jsx`
- `src/views/pages/Authorizations/components/PersonalPinManagement.jsx`
