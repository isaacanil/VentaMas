# Sistema de Autorizaciones en Centro de Notificaciones

## 📘 Descripción

Se ha implementado un sistema completo de autorizaciones en el Centro de Notificaciones con las siguientes mejoras:

### ✨ Características Principales

1. **Panel de Autorizaciones** (`AuthorizationsPanel`)
   - Vista diferenciada por rol (cajeros vs admins)
   - Actualización en tiempo real con Firebase listeners
   - Acciones de aprobar/rechazar para administradores
   - Historial de solicitudes con estados

2. **Sistema de Módulos** (`ModulesNavigator`)
   - Navegación por tabs en la parte superior
   - Contenido filtrado según el rol del usuario
   - Módulos disponibles:
     - **Autorizaciones**: Visible para todos los roles
     - **Comprobantes Fiscales**: Visible para todos los roles
     - **Cuentas por Cobrar**: Solo para admins

3. **Notificaciones en Tiempo Real**
   - Listener de Firebase implementado
   - Actualizaciones automáticas cuando cambian estados
   - Sin necesidad de recargar la página

---

## 🎯 Funcionalidades por Rol

### 👤 Cajeros

- **Ver sus propias solicitudes** de autorización
- **Estados visibles**:
  - ⏳ Pendiente (amarillo)
  - ✅ Aprobada (verde)
  - ❌ Rechazada (rojo)
  - 🔵 Usada (azul)
  - ⚠️ Expirada (gris)
- **Información mostrada**:
  - Número de factura
  - Razones de la solicitud
  - Nota agregada
  - Tiempo transcurrido
  - Estado actual
  - Quién aprobó/rechazó (si aplica)

### 👨‍💼 Administradores

- **Ver todas las solicitudes pendientes** de todos los usuarios
- **Acciones disponibles**:
  - ✅ Aprobar autorización
  - ❌ Rechazar autorización
- **Información adicional**:
  - Quién solicitó la autorización
  - Todas las razones y notas
  - Historial completo

---

## Campos / parámetros

- **Módulos disponibles**: Autorizaciones (todos), Comprobantes fiscales (todos), CxC (solo administradores).
- **Estados soportados**: pendiente, aprobada, rechazada, usada, expirada (señalados con colores).
- **Colecciones**: `businesses/{bid}/authorizationRequests` (solicitudes) y listeners en tiempo real usando Firestore.
- **Filtros**: por estado, usuario solicitante (para admins), y tabs por módulo.

---

## APIs / rutas

### Nuevos Archivos

1. **`AuthorizationsPanel.jsx`**

   ```
   src/views/templates/NotificationCenter/components/panels/AuthorizationsPanel/
   ├── AuthorizationsPanel.jsx
   └── index.js
   ```

2. **`ModulesNavigator.jsx`**
   ```
   src/views/templates/NotificationCenter/components/ModulesNavigator.jsx
   ```

### Archivos Modificados

1. **`invoiceEditAuthorizations.js`**
   - Agregada función `listenToAuthorizationsByStatus()` para listeners en tiempo real
   - Importado `onSnapshot` de Firestore

2. **`NotificationCenter.jsx`**
   - Integrado `ModulesNavigator` en lugar de `NotificationPanels`
   - Mantiene la estructura y animaciones existentes

3. **`panels/NotificationPanels.jsx`**
   - Agregado import de `AuthorizationsPanel`
   - Panel colocado como primero en la lista

4. **`RequestInvoiceEditAuthorization.jsx`**
   - Simplificado para cajeros (removido campo de nota)
   - Cierre automático después de 5 segundos
   - Textos más concisos y directos
   - Tamaños de fuente ajustados (título 16px bold, razones 14px)
   - Espaciado mejorado para mejor legibilidad

---

### Funciones Firebase

#### `listenToAuthorizationsByStatus(businessID, status, userId, onUpdate, onError)`

Listener en tiempo real para autorizaciones.

**Parámetros:**

- `businessID` (string): ID del negocio
- `status` (string|null): Estado a filtrar ('pending', 'approved', etc.) o null para todos
- `userId` (string|null): ID del usuario para filtrar sus solicitudes, o null para todas
- `onUpdate` (Function): Callback que recibe el array de autorizaciones
- `onError` (Function): Callback para errores

**Retorna:**

- `Function`: Función para cancelar el listener

**Ejemplo de uso:**

```javascript
const unsubscribe = listenToAuthorizationsByStatus(
  businessID,
  'pending', // Solo pendientes
  null, // Todas las solicitudes (admin)
  (authorizations) => {
    console.log('Autorizaciones actualizadas:', authorizations);
  },
  (error) => {
    console.error('Error:', error);
  },
);

// Cancelar listener cuando el componente se desmonte
return () => unsubscribe();
```

---

### 🎨 Diseño y UX

### Colores por Estado

- **Pendiente**: Naranja (`#ffa940`, fondo `#fffbf5`)
- **Aprobada**: Verde (`#059669`)
- **Rechazada**: Rojo (`#dc2626`)
- **Usada**: Azul
- **Expirada**: Gris

### Características de Diseño

- Cards con hover effect
- Badges para conteo de pendientes (admins)
- Iconos intuitivos por estado
- Scroll suave con scrollbar personalizado
- Animaciones de entrada con framer-motion
- Responsive y adaptable

---

## Versionado / compatibilidad

- Disponible desde la refactorización del Notification Center (2025-Q3).
- Diseñado para roles cajero y admin; módulos adicionales pueden ocultarse según permisos.
- Depende de Firestore listeners (`listenToAuthorizationsByStatus`) y el nuevo `AuthorizationsPanel`.

### Próximas mejoras sugeridas

1. **Notificaciones Push**
   - Integrar con Firebase Cloud Messaging
   - Notificar a admins cuando llegue nueva solicitud
   - Notificar a cajeros cuando se apruebe/rechace

2. **Filtros y Búsqueda**
   - Filtro por rango de fechas
   - Búsqueda por número de factura
   - Filtro por usuario solicitante

3. **Exportación de Reportes**
   - Exportar historial de autorizaciones a Excel
   - Reportes de aprobaciones por administrador
   - Estadísticas de tiempo de respuesta

4. **Módulos Adicionales**
   - Alertas de inventario
   - Metas de ventas
   - Actualizaciones del sistema

---

## Recursos relacionados

### Capturas de funcionalidad

### Vista Cajero

- Lista de sus propias solicitudes
- Estados claros y visibles
- Sin acciones (solo lectura)

### Vista Admin

- Todas las solicitudes pendientes destacadas
- Botones de Aprobar/Rechazar
- Badge con conteo de pendientes
- Información completa del solicitante

---

### Debugging

Si las autorizaciones no aparecen:

1. **Verificar rol del usuario:**

   ```javascript
   console.log('User role:', user?.role);
   ```

2. **Verificar businessID:**

   ```javascript
   console.log('BusinessID:', user?.businessID);
   ```

3. **Verificar colección en Firestore:**
   - Colección: `businesses/{businessID}/authorizationRequests`
   - Documentos deben tener campos: `status`, `createdAt`, `requestedBy`

4. **Verificar listener:**
   ```javascript
   // El listener debe retornar función unsubscribe
   useEffect(() => {
     const unsubscribe = listenToAuthorizationsByStatus(...);
     return () => unsubscribe?.();
   }, [dependencies]);
   ```

---

### Soporte

Para dudas o problemas con el sistema de autorizaciones, revisar:

- `/docs/authorization/reference/modules-configuration.md`
- `/docs/authorization/explanation/unified-screen.md`
- Console logs en el navegador
- Firestore console para datos

---

**Última actualización:** 3 de octubre de 2025
**Versión:** 1.0.0
