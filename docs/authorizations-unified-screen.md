# Pantalla Unificada de Autorizaciones

## 🎯 Descripción General

Se ha creado una **pantalla unificada** en `/authorizations` que combina:

1. **Solicitudes de Autorización** - Gestión de todas las solicitudes (facturas, cuentas por cobrar, etc.)
2. **Gestión de PINs** - Administración de PINs de seguridad de usuarios

Todo en una sola pantalla con tabs para fácil navegación.

---

## 📁 Estructura de Componentes

```
src/views/pages/Authorizations/
├── AuthorizationsManager.jsx          # Componente principal con tabs
├── InvoiceEditAuthorizations.jsx      # (Antiguo, ahora no se usa directamente)
└── components/
    ├── AuthorizationRequests.jsx      # Tab 1: Solicitudes
    └── PinManagement.jsx              # Tab 2: Gestión de PINs
```

---

## 🎨 Diseño de la Pantalla

### Vista Principal

```
┌────────────────────────────────────────────────────────────────┐
│  Autorizaciones                                    [🔍 Buscar]  │
└────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  Gestión de Autorizaciones y Seguridad                        │
│  Administra solicitudes de autorización y PINs de seguridad   │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 📄 Solicitudes de Autorización  |  🔑 Gestión de PINs   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  [Contenido del tab activo]                                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 📋 Tab 1: Solicitudes de Autorización

### Características

- **Vista de todas las solicitudes** de autorización (por ahora solo facturas, expandible)
- **Filtros por estado**: Pendientes, Aprobadas, Rechazadas, Usadas, Expiradas, Todas
- **Búsqueda integrada** con el MenuApp
- **Acciones rápidas**: Aprobar con PIN / Rechazar

### Columnas de la Tabla

| Columna        | Descripción                                          |
| -------------- | ---------------------------------------------------- |
| Tipo           | Tipo de solicitud (Factura, Cuenta por Cobrar, etc.) |
| Referencia     | Número de factura o identificador                    |
| Solicitado por | Usuario que hizo la solicitud                        |
| Motivos        | Razones de la solicitud                              |
| Creada         | Fecha de creación                                    |
| Expira         | Fecha de expiración                                  |
| Estado         | Tag con color: pending, approved, rejected, etc.     |
| Acción         | Botones de Aprobar/Rechazar (solo en pendientes)     |

### Flujo de Aprobación

1. Admin ve solicitud pendiente
2. Hace clic en **"Aprobar"**
3. Se abre `PinAuthorizationModal`
4. Admin ingresa su usuario + PIN
5. Sistema valida y aprueba la solicitud
6. Solicitante puede ejecutar la acción

---

## 🔑 Tab 2: Gestión de PINs

### Características

- **Estadísticas de PINs**:
  - Total de usuarios
  - Usuarios con PIN configurado
  - PINs activos
  - PINs expirados

- **Tabla de usuarios** con información de PIN:
  - Usuario (nombre + username)
  - Rol
  - Estado del PIN (Activo, Expirado, Sin PIN, Inactivo)
  - Módulos habilitados
  - Tiempo restante hasta expiración
  - Acciones: Generar/Regenerar, Desactivar

### Flujo de Generación de PIN

1. Admin selecciona usuario
2. Hace clic en **"Generar"** o **"Regenerar"**
3. Se abre modal para seleccionar módulos:
   - ☑️ Facturación
   - ☑️ Cuentas por Cobrar
4. Confirma y genera PIN
5. Se muestra el PIN (UNA SOLA VEZ)
6. Opciones de copiar o imprimir
7. Admin comparte PIN con el usuario

---

## 🔄 Integración con Sistema Existente

### Rutas Actualizadas

**ANTES:**

```javascript
// /authorizations → InvoiceEditAuthorizations (solo facturas)
// /settings/authorization-config → AuthorizationConfig (solo PINs)
```

**AHORA:**

```javascript
// /authorizations → AuthorizationsManager (todo unificado)
//   ├─ Tab 1: Solicitudes (facturas + futuras)
//   └─ Tab 2: PINs
```

### Archivos Modificados

1. **src/routes/paths/Authorizations.jsx**
   - Cambió de `InvoiceEditAuthorizations` a `AuthorizationsManager`

2. **src/routes/paths/Setting.jsx**
   - Eliminada ruta `/settings/authorization-config`
   - Eliminado import de `AuthorizationConfig`

3. **src/views/pages/setting/SettingData.jsx**
   - Eliminada opción "Configuración de Autorización"
   - Ya no aparece en menú de Settings

### Archivos Nuevos

1. **src/views/pages/Authorizations/AuthorizationsManager.jsx**
   - Componente principal con tabs
   - Maneja navegación entre solicitudes y PINs

2. **src/views/pages/Authorizations/components/AuthorizationRequests.jsx**
   - Refactorización de `InvoiceEditAuthorizations`
   - Diseñado para múltiples tipos de solicitudes

3. **src/views/pages/Authorizations/components/PinManagement.jsx**
   - Movido funcionalidad de `AuthorizationConfig`
   - Simplificado para uso en tab

---

## 🎯 Beneficios de la Unificación

### Para Administradores

✅ **Un solo lugar** para gestionar toda la seguridad
✅ **Navegación más rápida** entre solicitudes y PINs
✅ **Vista contextual** - ver solicitudes y configurar PINs sin salir
✅ **Búsqueda unificada** - funciona en ambos tabs

### Para Desarrolladores

✅ **Estructura modular** - componentes reutilizables
✅ **Fácil expansión** - agregar nuevos tipos de solicitudes es simple
✅ **Código limpio** - separación clara de responsabilidades
✅ **Mantenimiento centralizado** - un solo punto de entrada

---

## 🚀 Cómo Agregar Nuevos Tipos de Solicitudes

En el futuro, para agregar solicitudes de Cuentas por Cobrar u otros módulos:

### Paso 1: Crear Servicio Firebase

```javascript
// firebase/authorizations/accountsReceivableAuth.js

export const requestAccountReceivableEdit = async (user, account, reasons) => {
  const colRef = collection(
    db,
    'businesses',
    user.businessID,
    'authorizationRequests',
  );

  await addDoc(colRef, {
    type: 'accountsReceivable',
    accountId: account.id,
    status: 'pending',
    reasons,
    requestedBy: { uid: user.uid, name: user.name },
    createdAt: serverTimestamp(),
    expiresAt: calcExpiresAt(48),
  });
};

export const listAccountReceivableRequests = async (user, filters) => {
  // Similar a listInvoiceEditAuthorizations
};
```

### Paso 2: Actualizar AuthorizationRequests.jsx

```javascript
// En AuthorizationRequests.jsx

const load = async (statusArg) => {
  setLoading(true);
  try {
    // Cargar solicitudes de facturas
    const invoiceData = await listInvoiceEditAuthorizations(user, {...});

    // Cargar solicitudes de cuentas por cobrar
    const arData = await listAccountReceivableRequests(user, {...});

    // Combinar y mapear
    const combined = [
      ...invoiceData.map(d => ({ ...d, type: 'factura' })),
      ...arData.map(d => ({ ...d, type: 'cuentaPorCobrar' }))
    ];

    setRows(combined);
  } catch (e) {
    message.error(e?.message || 'Error cargando solicitudes');
  } finally {
    setLoading(false);
  }
};
```

### Paso 3: Agregar Columna de Tipo

La tabla ya tiene columna "Tipo", solo necesitas mapear correctamente:

```javascript
const tableData = rows.map((r) => ({
  type: r.type === 'factura' ? 'Factura' : 'Cuenta por Cobrar',
  invoice: r.invoiceNumber || r.accountId,
  // ... resto
}));
```

---

## 📊 Estructura de Datos Unificada (Futura)

Para unificar todas las solicitudes en una sola colección:

```javascript
businesses/{businessID}/authorizationRequests/{requestId}/
  type: "invoice" | "accountsReceivable" | "creditNote" | etc.
  status: "pending" | "approved" | "rejected" | "used" | "expired"

  // Campos comunes
  businessID: string
  createdAt: Timestamp
  expiresAt: Timestamp
  requestedBy: { uid, name, role }
  approvedBy: { uid, name, role } | null
  reasons: string[]

  // Campos específicos por tipo
  metadata: {
    // Para facturas
    invoiceId?: string
    invoiceNumber?: string

    // Para cuentas por cobrar
    accountId?: string
    accountNumber?: string

    // Para notas de crédito
    creditNoteId?: string
    // etc.
  }
```

---

## 🎨 Personalización Visual

### Colores de Estado (Solicitudes)

```javascript
const statusColor = {
  pending: 'gold', // 🟡 Amarillo
  approved: 'green', // 🟢 Verde
  rejected: 'red', // 🔴 Rojo
  expired: 'default', // ⚪ Gris
  used: 'blue', // 🔵 Azul
};
```

### Colores de Estado (PINs)

```javascript
const pinStatusColor = {
  active: 'green', // 🟢 Verde con icono SafetyOutlined
  expired: 'orange', // 🟠 Naranja con icono ClockCircleOutlined
  inactive: 'red', // 🔴 Rojo
  none: 'default', // ⚪ Gris "Sin PIN"
};
```

---

## 🔐 Permisos y Roles

### Acceso a la Pantalla

**Roles permitidos:**

- `admin`
- `owner`
- `dev`
- `manager`

**Otros roles:**

- Se muestra mensaje "Acceso Denegado"
- No pueden ver solicitudes ni gestionar PINs

### Funcionalidades por Rol

| Funcionalidad        | Admin | Owner | Manager | Cajero |
| -------------------- | ----- | ----- | ------- | ------ |
| Ver solicitudes      | ✅    | ✅    | ✅      | ❌     |
| Aprobar solicitudes  | ✅    | ✅    | ✅      | ❌     |
| Rechazar solicitudes | ✅    | ✅    | ✅      | ❌     |
| Ver PINs (estado)    | ✅    | ✅    | ❌      | ❌     |
| Generar PINs         | ✅    | ✅    | ❌      | ❌     |
| Desactivar PINs      | ✅    | ✅    | ❌      | ❌     |

---

## 📱 Responsive Design

La pantalla está optimizada para diferentes tamaños:

- **Desktop**: Vista completa con estadísticas y tabla amplia
- **Tablet**: Estadísticas en 2 columnas, tabla con scroll horizontal
- **Mobile**: Estadísticas en 1 columna, tabla colapsable

---

## ✅ Checklist de Implementación

### Completado ✅

- [x] Componente principal `AuthorizationsManager`
- [x] Tab de Solicitudes de Autorización
- [x] Tab de Gestión de PINs
- [x] Integración con PinAuthorizationModal
- [x] Búsqueda unificada
- [x] Estadísticas de PINs
- [x] Ruta actualizada en Authorizations.jsx
- [x] Eliminada ruta duplicada de Settings
- [x] Permisos y roles configurados

### Pendiente (Opcional)

- [ ] Agregar solicitudes de Cuentas por Cobrar
- [ ] Agregar solicitudes de Notas de Crédito
- [ ] Unificar en una sola colección Firebase
- [ ] Agregar filtros avanzados (por tipo, por usuario, por fecha)
- [ ] Agregar exportación de reportes
- [ ] Agregar notificaciones en tiempo real

---

## 🎉 Resultado Final

Una **pantalla única y completa** donde los administradores pueden:

1. ✅ Ver y aprobar todas las solicitudes de autorización
2. ✅ Gestionar PINs de todos los usuarios
3. ✅ Tener visibilidad completa de la seguridad del sistema
4. ✅ Navegar fácilmente entre solicitudes y configuración
5. ✅ Buscar en ambos tabs con un solo campo

**Acceso:** `/authorizations` en el menú lateral (sección Admin)

---

**Implementado por:** Claude AI
**Fecha:** 2025-09-30
**Versión:** 2.0 (Unificado)
