# Sistema de Autorización con PIN - Diagrama de Flujos

## 📊 Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                      SISTEMA DE AUTORIZACION                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐        ┌──────────────────┐              │
│  │  CONFIGURACION  │        │  AUTORIZACION    │              │
│  │  (Admin Only)   │        │  (Todos)         │              │
│  └────────┬────────┘        └────────┬─────────┘              │
│           │                          │                         │
│     ┌─────▼──────┐            ┌──────▼─────────┐             │
│     │  Generar   │            │  Validar PIN   │             │
│     │  PIN       │            │  + Ejecutar    │             │
│     └─────┬──────┘            └────────────────┘             │
│           │                                                    │
│     ┌─────▼──────────────────────────┐                       │
│     │     Firebase Firestore         │                       │
│     │  users/{id}/authorizationPin   │                       │
│     │  businesses/{id}/pinAuthLogs   │                       │
│     └────────────────────────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo 1: Configuración de PIN (Admin)

```
┌──────────────────────────────────────────────────────────────────┐
│                     CONFIGURACION DE PIN                         │
└──────────────────────────────────────────────────────────────────┘

    Usuario Admin
         │
         ▼
    ┌─────────────────────┐
    │ Navega a Settings   │
    │ > Configuración de  │
    │   Autorización      │
    └──────────┬──────────┘
               │
               ▼
    ┌──────────────────────────────────┐
    │ AuthorizationConfig.jsx          │
    │ - Lista usuarios                 │
    │ - Muestra estado de PINs         │
    │ - Estadísticas                   │
    └──────────┬───────────────────────┘
               │
               │ Admin hace clic en "Generar"
               │
               ▼
    ┌──────────────────────────────────┐
    │ GeneratePinModal.jsx             │
    │ - Seleccionar módulos            │
    │   □ Facturación                  │
    │   □ Cuentas por Cobrar           │
    └──────────┬───────────────────────┘
               │
               │ Confirmar
               │
               ▼
    ┌──────────────────────────────────┐
    │ fbGenerateUserPin()              │
    │ 1. Genera PIN random (6 dígitos) │
    │ 2. Hashea con bcrypt             │
    │ 3. Guarda en Firestore           │
    │ 4. Log de auditoría              │
    └──────────┬───────────────────────┘
               │
               │ PIN generado
               │
               ▼
    ┌──────────────────────────────────┐
    │ PinDetailsModal.jsx              │
    │ ┌──────────────────────────────┐ │
    │ │   PIN: 123456                │ │
    │ │   (mostrado UNA sola vez)    │ │
    │ └──────────────────────────────┘ │
    │ - Usuario: Juan Pérez            │
    │ - Módulos: Facturación, CxC      │
    │ - Expira: 30/09/2025 20:00       │
    │                                  │
    │ [Copiar]  [Imprimir]             │
    └──────────┬───────────────────────┘
               │
               │ Admin anota el PIN
               │ Admin comparte PIN con usuario
               │
               ▼
         PIN LISTO PARA USAR
```

---

## 🔐 Flujo 2: Autorización con PIN (Operación Inmediata)

```
┌──────────────────────────────────────────────────────────────────┐
│              AUTORIZACION CON PIN (INMEDIATA)                    │
└──────────────────────────────────────────────────────────────────┘

    Usuario intenta
    operación sensible
         │
         ▼
    ┌──────────────────────────────────┐
    │ Componente solicita autorización │
    │ useAuthorizationPin() hook       │
    └──────────┬───────────────────────┘
               │
               │ showModal()
               │
               ▼
    ┌──────────────────────────────────────────┐
    │ PinAuthorizationModal.jsx                │
    │                                          │
    │  Se requiere autorización                │
    │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
    │                                          │
    │  Usuario: [____________]                 │
    │  PIN:     [● ● ● ● ● ●]                 │
    │                                          │
    │  ¿No tienes PIN? Usa contraseña →       │
    │                                          │
    │        [Cancelar]  [Autorizar]           │
    └──────────┬───────────────────────────────┘
               │
               │ Usuario ingresa credenciales
               │
               ▼
    ┌──────────────────────────────────────────┐
    │ fbValidateUserPin()                      │
    │                                          │
    │ 1. Busca usuario por nombre              │
    │ 2. Verifica businessID                   │
    │ 3. Verifica PIN existe                   │
    │ 4. Verifica PIN activo                   │
    │ 5. Verifica no expirado                  │
    │ 6. Verifica módulo habilitado            │
    │ 7. Compara PIN (bcrypt)                  │
    │ 8. Verifica rol permitido                │
    │ 9. Log de auditoría                      │
    └──────────┬───────────────────────────────┘
               │
         ┌─────┴─────┐
         │           │
    ✅ VÁLIDO    ❌ INVÁLIDO
         │           │
         ▼           ▼
    ┌─────────┐  ┌────────────────┐
    │ onAuth- │  │ Mostrar error  │
    │ orized()│  │ - PIN incorr.  │
    │         │  │ - Expirado     │
    │ Ejecutar│  │ - Sin PIN      │
    │ operac. │  │ - Módulo no    │
    └─────────┘  │   habilitado   │
                 └────────────────┘
```

---

## 📝 Flujo 3: Solicitud/Aprobación (Facturas)

```
┌──────────────────────────────────────────────────────────────────┐
│           FLUJO DE SOLICITUD/APROBACION (FACTURAS)               │
└──────────────────────────────────────────────────────────────────┘

        CAJERO                        SISTEMA                      ADMIN
          │                             │                            │
          │  Intenta editar factura     │                            │
          │  > 24h antigüedad           │                            │
          ├─────────────────────────────►                            │
          │                             │                            │
          │◄────────────────────────────┤                            │
          │  useInvoiceEditAuthorization│                            │
          │  detecta: requiere autoriza │                            │
          │                             │                            │
          │◄────────────────────────────┤                            │
          │  Muestra:                   │                            │
          │  RequestInvoiceEdit-        │                            │
          │  AuthorizationModal         │                            │
          │                             │                            │
          │  Cajero ingresa motivo:     │                            │
          │  "Cliente solicitó cambio"  │                            │
          ├─────────────────────────────►                            │
          │                             │                            │
          │                        ┌────▼────┐                       │
          │                        │Firestore│                       │
          │                        │ Status: │                       │
          │                        │ pending │                       │
          │                        └────┬────┘                       │
          │                             │                            │
          │                             │  Admin abre app            │
          │                             │◄───────────────────────────┤
          │                             │                            │
          │                             │  Ve notificación           │
          │                             │◄───────────────────────────┤
          │                             │                            │
          │                             │  Navega a Autorizaciones   │
          │                             │◄───────────────────────────┤
          │                             │                            │
          │                        ┌────▼────────────────────────┐  │
          │                        │InvoiceEditAuthorizations   │  │
          │                        │┌──────────────────────────┐│  │
          │                        ││ Factura | Solicitante    ││  │
          │                        ││ B001-001│ Juan (cajero)  ││  │
          │                        ││ Motivo: Cliente...       ││  │
          │                        ││ [Aprobar] [Rechazar]     ││  │
          │                        │└──────────────────────────┘│  │
          │                        └────┬────────────────────────┘  │
          │                             │                            │
          │                             │  Admin clic "Aprobar"      │
          │                             │◄───────────────────────────┤
          │                             │                            │
          │                        ┌────▼────────────────────────┐  │
          │                        │ handleApprove()            │  │
          │                        │ setPendingApproval(id)     │  │
          │                        │ showPinModal()             │  │
          │                        └────┬────────────────────────┘  │
          │                             │                            │
          │                        ┌────▼────────────────────────┐  │
          │                        │ PinAuthorizationModal      │  │
          │                        │                            │  │
          │                        │ Usuario: [admin]           │◄─┤
          │                        │ PIN:     [● ● ● ● ● ●]     │  │
          │                        │                            │  │
          │                        │    [Cancelar] [Autorizar]  │  │
          │                        └────┬────────────────────────┘  │
          │                             │                            │
          │                             │  Admin ingresa PIN         │
          │                             │◄───────────────────────────┤
          │                             │                            │
          │                        ┌────▼────┐                       │
          │                        │Validate │                       │
          │                        │  PIN    │                       │
          │                        └────┬────┘                       │
          │                             │                            │
          │                        ┌────▼────┐                       │
          │                        │Firestore│                       │
          │                        │ Status: │                       │
          │                        │approved │                       │
          │                        │         │                       │
          │                        │approvedBy│                      │
          │                        │  = admin │                      │
          │                        └────┬────┘                       │
          │                             │                            │
          │◄────────────────────────────┤                            │
          │  Notificación:              │                            │
          │  "Solicitud aprobada"       │                            │
          │                             │                            │
          │  Ahora puede editar factura │                            │
          │                             │                            │
          ▼                             ▼                            ▼
```

---

## 🔄 Flujo 4: Fallback a Contraseña

```
┌──────────────────────────────────────────────────────────────────┐
│                 FALLBACK A CONTRASEÑA                            │
└──────────────────────────────────────────────────────────────────┘

    Usuario abre
    PinAuthorizationModal
         │
         ▼
    ┌──────────────────────────────────┐
    │ Modo: PIN                        │
    │                                  │
    │ Usuario: [____________]          │
    │ PIN:     [● ● ● ● ● ●]          │
    │                                  │
    │ ¿No tienes PIN? Usa contraseña → │
    └──────────┬───────────────────────┘
               │
               │ Usuario hace clic en link
               │
               ▼
    ┌──────────────────────────────────┐
    │ toggleMode()                     │
    │ setUsePassword(true)             │
    └──────────┬───────────────────────┘
               │
               ▼
    ┌──────────────────────────────────┐
    │ Modo: CONTRASEÑA                 │
    │                                  │
    │ Usuario:    [____________]       │
    │ Contraseña: [............]       │
    │                                  │
    │ ← Usar PIN de 6 dígitos          │
    └──────────┬───────────────────────┘
               │
               │ Usuario ingresa contraseña
               │
               ▼
    ┌──────────────────────────────────┐
    │ fbValidateUser()                 │
    │ (función existente)              │
    │ - Busca usuario                  │
    │ - Valida contraseña (bcrypt)     │
    │ - Verifica rol                   │
    └──────────┬───────────────────────┘
               │
               ▼
         AUTORIZADO
    (mismo resultado que con PIN)
```

---

## 🕐 Flujo 5: Expiración de PIN

```
┌──────────────────────────────────────────────────────────────────┐
│                      EXPIRACION DE PIN                           │
└──────────────────────────────────────────────────────────────────┘

    Generación de PIN
         │
         ▼
    PIN creado
    expiresAt = now + 24h
         │
         ┊  (Tiempo transcurre)
         ┊
         ┊  ⏰ 23 horas después
         ┊  ← Usuario todavía puede usar PIN
         ┊
         ┊  ⏰ 24 horas después
         ▼
    PIN EXPIRADO
         │
         ├──────────────────────────────┐
         │                              │
         ▼                              ▼
    Usuario intenta           Admin revisa config
    usar PIN expirado         de PINs
         │                              │
         ▼                              ▼
    fbValidateUserPin()       AuthorizationConfig
         │                              │
    Detecta:                       Detecta:
    expiresAt < now                expiresAt < now
         │                              │
         ▼                              ▼
    ❌ Error:                      🟠 Tag "Expirado"
    "PIN expirado"                 en tabla
         │                              │
         │                              │
         │                              ▼
         │                       Admin regenera PIN
         │                              │
         │                              ▼
         │                       Nuevo PIN generado
         │                       expiresAt = now + 24h
         │                              │
         └──────────────┬───────────────┘
                        │
                        ▼
                 PIN ACTIVO
                 nuevamente
```

---

## 📊 Flujo 6: Logs de Auditoría

```
┌──────────────────────────────────────────────────────────────────┐
│                    LOGS DE AUDITORIA                             │
└──────────────────────────────────────────────────────────────────┘

Cualquier operación con PIN
         │
         ▼
    ┌──────────────────────────┐
    │ logPinAction()           │
    │ (automático)             │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────────────┐
    │ Firestore Collection:            │
    │ businesses/{id}/pinAuthLogs      │
    │                                  │
    │ {                                │
    │   action: "generate" |           │
    │           "validate_success" |   │
    │           "validate_failed" |    │
    │           "deactivate",          │
    │   timestamp: Timestamp,          │
    │   performedBy: {                 │
    │     uid, name, role              │
    │   },                             │
    │   targetUserId: string,          │
    │   targetUserName: string,        │
    │   module: string,                │
    │   reason: string | null          │
    │ }                                │
    └──────────┬───────────────────────┘
               │
               ▼
    Logs disponibles para:
    - Auditoría de seguridad
    - Debugging
    - Análisis de uso
    - Detección de intentos
      de acceso no autorizados
```

---

## 🎯 Resumen de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENTES DEL SISTEMA                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FRONTEND                                                       │
│  ├── Pantallas                                                  │
│  │   └── AuthorizationConfig.jsx                              │
│  │       ├── GeneratePinModal.jsx                             │
│  │       └── PinDetailsModal.jsx                              │
│  │                                                             │
│  ├── Modals Compartidos                                        │
│  │   └── PinAuthorizationModal.jsx                            │
│  │                                                             │
│  ├── Hooks                                                     │
│  │   └── useAuthorizationPin.js                               │
│  │                                                             │
│  └── Integraciones                                             │
│      └── InvoiceEditAuthorizations.jsx (modificado)           │
│                                                                 │
│  BACKEND (Firebase)                                            │
│  ├── Servicios                                                 │
│  │   └── firebase/authorization/pinAuth.js                    │
│  │       ├── fbGenerateUserPin()                              │
│  │       ├── fbValidateUserPin()                              │
│  │       ├── fbDeactivateUserPin()                            │
│  │       ├── fbGetUserPinStatus()                             │
│  │       ├── fbGetUsersWithPinStatus()                        │
│  │       └── fbGetPinAuthLogs()                               │
│  │                                                             │
│  └── Firestore Collections                                     │
│      ├── users/{id}                                            │
│      │   └── authorizationPin: { pin, expiresAt, modules }    │
│      └── businesses/{id}/pinAuthLogs/{logId}                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Capas de Seguridad

```
┌─────────────────────────────────────────────────────────────────┐
│                     CAPAS DE SEGURIDAD                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1️⃣  HASHING                                                    │
│      └─ PINs hasheados con bcrypt (10 rounds)                  │
│         Nunca se almacenan en texto plano                       │
│                                                                 │
│  2️⃣  EXPIRACION                                                 │
│      └─ Automática cada 24 horas                                │
│         Previene uso prolongado de PINs comprometidos           │
│                                                                 │
│  3️⃣  MODULOS ESPECIFICOS                                        │
│      └─ PINs solo válidos para módulos habilitados              │
│         Principio de mínimo privilegio                          │
│                                                                 │
│  4️⃣  VERIFICACION DE ROLES                                      │
│      └─ Solo roles permitidos pueden autorizar                  │
│         Doble verificación (PIN + rol)                          │
│                                                                 │
│  5️⃣  AISLAMIENTO DE NEGOCIOS                                    │
│      └─ PINs solo válidos dentro del mismo businessID           │
│         No hay cross-business authorization                     │
│                                                                 │
│  6️⃣  LOGS DE AUDITORIA                                          │
│      └─ Todas las operaciones registradas                       │
│         Trazabilidad completa                                   │
│                                                                 │
│  7️⃣  DESACTIVACION MANUAL                                       │
│      └─ Admin puede desactivar PINs sospechosos                 │
│         Respuesta rápida a incidentes                           │
│                                                                 │
│  8️⃣  FALLBACK SEGURO                                            │
│      └─ Siempre disponible contraseña completa                  │
│         No hay pérdida de funcionalidad                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

**Este diagrama proporciona una visión completa del sistema de autorización con PIN implementado.**
