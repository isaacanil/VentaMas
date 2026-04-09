# Pantalla Unificada de Autorizaciones

## 📋 Contexto

El flujo de autorizaciones se expandió con pantallas aisladas (solicitudes de facturas, gestión de PINs y configuraciones). Para reducir fricción operativa y estandarizar la experiencia, se consolidó todo en `/authorizations`, incluyendo tabs que permiten atender solicitudes y administrar PINs sin cambiar de vista.

## 🎯 Objetivos

- Centralizar las operaciones críticas de autorizaciones y PINs en una sola URL.
- Reutilizar componentes (`AuthorizationsManager`, `PinAuthorizationModal`) para disminuir deuda técnica.
- Ofrecer filtros, búsqueda y métricas compartidas que agilicen el trabajo de supervisores y soporte.

## ⚙️ Diseño / Arquitectura

### Estructura de componentes

```
src/views/pages/Authorizations/
├── AuthorizationsManager.jsx          # Contenedor principal con tabs
├── InvoiceEditAuthorizations.jsx      # Vista heredada (solo para compatibilidad)
└── components/
    ├── AuthorizationRequests.jsx      # Tab 1: Solicitudes
    └── PinManagement.jsx              # Tab 2: Gestión de PINs
```

`AuthorizationsManager` maneja el estado del tab activo, provee filtros y delega la carga de datos en cada tab para evitar renders globales.

### Layout general

```
┌────────────────────────────────────────────────────────────────┐
│  Autorizaciones                                    [🔍 Buscar]  │
└────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────┐
│  Gestión de Autorizaciones y Seguridad                        │
│  Administra solicitudes de autorización y PINs de seguridad   │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 📄 Solicitudes de Autorización  |  🔑 Gestión de PINs   │ │
│  └──────────────────────────────────────────────────────────┘ │
│  [Contenido del tab activo]                                   │
└────────────────────────────────────────────────────────────────┘
```

### Tab 1 · Solicitudes de autorización

- Filtros por estado (Pendientes, Aprobadas, Rechazadas, Usadas, Expiradas, Todas) y búsqueda conectada al `MenuApp`.
- Tabla con columnas: Tipo, Referencia, Solicitado por, Motivos, Creada, Expira, Estado y Acción.
- Flujo de aprobación:
  1. Admin selecciona una solicitud pendiente.
  2. Usa la acción rápida **Aprobar**.
  3. Se abre `PinAuthorizationModal` para ingresar usuario + PIN.
  4. Al validar, se actualiza el estado (`approved/used`) y el solicitante puede ejecutar la acción.

### Tab 2 · Gestión de PINs

- Métricas rápidas: total de usuarios, usuarios con PIN configurado, PINs activos y expirados.
- Tabla por usuario con columnas de rol, estado del PIN, módulos habilitados, tiempo restante y acciones (Generar/Regenerar, Desactivar).
- Flujo de generación:
  1. Seleccionar usuario.
  2. Abrir modal y elegir módulos (Facturación, Cuentas por Cobrar).
  3. Confirmar para generar/regenerar el PIN.
  4. Mostrar el PIN una sola vez con opciones de copiar/imprimir; luego se almacena cifrado.

### Integración con el sistema existente

- Rutas: `src/routes/paths/Authorizations.jsx` apunta ahora a `AuthorizationsManager`.
- Servicios:
  - `AuthorizationRequests` utiliza `listenToAuthorizationsByStatus`.
  - `PinManagement` consume `usePinAuthorization` + `fbGetUsersWithPinStatus`.
- Flags (`authorizationFlowEnabled`, `enabledAuthorizationModules`) determinan qué tab está habilitado y qué acciones se muestran.

## 📈 Impacto / Trade-offs

- 👍 Reduce la navegación para supervisores (una sola vista con tabs) y acelera onboarding.
- 👍 Mejora la reutilización de modales/servicios; menos componentes duplicados que mantener.
- ⚠️ `AuthorizationsManager` concentra más lógica; se debe vigilar el rendimiento cuando se agreguen nuevos tabs o filtros complejos.
- ⚠️ Depende del mismo modal para aprobaciones; cualquier cambio en `PinAuthorizationModal` impacta a las dos secciones.

## 🔜 Seguimiento / Próximos pasos

- [ ] Medir métricas de uso (tabs más consultados, tiempo medio de aprobación) para priorizar mejoras.
- [ ] Documentar guidelines UX antes de incluir un tercer tab (ej. autorizaciones de descuentos).
- [ ] Ejecutar revisión de accesibilidad (navegación por teclado y lectores de pantalla).
