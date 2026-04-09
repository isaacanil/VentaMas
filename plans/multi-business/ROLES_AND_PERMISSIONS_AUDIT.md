# Roles and Permissions Audit

Scope: Frontend (`src/`) and Backend (`functions/`) as of current workspace. Goal is to map role catalog, owner vs admin distinction, multi-tenancy enforcement, UI guards, and backend guards.

---

## 1. Catalogo de Roles (Role Mapping)

### Roles detectados (Frontend)

- **Definicion tipada (union):** `owner`, `admin`, `manager`, `cashier`, `buyer`, `dev`, `specialCashier1`, `specialCashier2`.  
  Fuente: `src/types/users.ts`.
- **Roles de UI (lista de opciones):** `admin`, `manager`, `cashier`, `buyer`, `dev`.  
  Fuente: `src/abilities/roles.ts` (nota: **no incluye `owner` ni `specialCashier1/2`**).
- **Mapeo de abilities por rol:** `owner`, `admin`, `manager`, `cashier`, `buyer`, `dev`, `specialCashier1`, `specialCashier2`.  
  Fuente: `src/abilities/index.ts`.

### Roles detectados (Backend)

- **Roles usados en controles:** `admin`, `owner`, `dev`, `manager` (sets de permisos).  
  Fuentes:
  - `functions/src/app/versions/v2/auth/pin/pin.constants.js`
  - `functions/src/app/modules/business/functions/ensureDefaultWarehouseForBusiness.js`
  - `functions/src/app/versions/v2/invoice/controllers/ncfLedgerAccess.util.js`
- **Roles adicionales implicitos / legacy:** `super-admin` aparece en el ledger (no tipado en frontend).  
  Fuente: `functions/src/app/versions/v2/invoice/controllers/ncfLedgerAccess.util.js`.
- **Rol de sistema:** `system` se usa en el actor de rotacion de PINs.  
  Fuente: `functions/src/app/versions/v2/auth/pin/pin.constants.js`.

### Conclusiones de catalogo

- **No existe un enum centralizado compartido** entre frontend y backend.
- En frontend hay una union tipada (`UserRoleId`), pero backend usa **strings sueltas** (magic strings) en `Set`s y comparaciones directas.
- **Desalineacion**: `owner` no aparece en `src/abilities/roles.ts` (lista de opciones), pero si en `src/types/users.ts` y en el mapeo de abilities.
- **Rol `super-admin`** solo aparece en backend (ledger) y no existe en tipos frontend.

---

## 2. Analisis del "Dueno" vs "Admin"

### Distincion en Frontend

Si existe una distincion clara en UI:

- **Owner**: `can('manage','all')` pero **no puede acceder** a `/users` y rutas de usuarios.  
  Fuente: `src/abilities/roles/owner.ts`.
- **Admin**: `can('manage','all')` y **si puede acceder** a `/users` y sub-rutas.  
  Fuente: `src/abilities/roles/admin.ts`.

Esto indica que el **dueno no es un super-admin** en UI; de hecho tiene restricciones que el admin no tiene.

### Distincion en Backend

Hay diferenciacion parcial:

- `owner` aparece en **listas de roles permitidos** para PINs, ledger NCF y funciones de negocio (`ensureDefaultWarehouse...`).
  Fuentes: `functions/src/app/versions/v2/auth/pin/pin.constants.js`, `functions/src/app/versions/v2/invoice/controllers/ncfLedgerAccess.util.js`, `functions/src/app/modules/business/functions/ensureDefaultWarehouseForBusiness.js`.
- **No existe un concepto tecnico de "creador del negocio"** (no hay campo `business.ownerId` o similar en el codigo revisado). El rol `owner` es solo un string en el usuario.

### Subscription / Payment / Billing

- No se encontraron flujos de **subscription/stripe/billing payments** con restricciones por rol.
- Configuraciones de "billing" (facturacion) en UI se muestran dentro de "General Config", pero el bloqueo se hace por ability **manage Business** (cashier queda fuera).  
  Fuente: `src/modules/settings/components/GeneralConfig/GeneralConfig.tsx`.
- **No hay evidencia de "owner-only" para billing/pagos** en backend ni frontend.

**Hallazgo clave:** No hay una distincion tecnica "creador del negocio" vs "admin" en backend. La distincion actual es **solo por rol** y principalmente en UI. Esto es critico para futuras integraciones de pagos/recuperacion de cuentas.

---

## 3. Aislamiento de Negocios (Multi-tenancy)

### Frontend

Patron comun: el `businessID` del usuario se usa para construir paths de Firestore.
Ejemplo:

- `useAccountsReceivablePaymentReceipts` filtra por `businessID` en la ruta y por `role` en el query.  
  Fuente: `src/firebase/accountsReceivable/paymentReceipt/useAccountsReceivablePaymentReceipts.ts`.

Esto **no es un control de seguridad** (solo UI). Si un cliente modifica el `businessID`, podria consultar otro negocio **a menos que las reglas de Firestore lo impidan**. Las reglas no estan en este repo.

### Backend (Callables / HTTP)

Hay validaciones **mixtas**. Algunos endpoints validan business match, otros no:

- **Con validacion de businessID:**
  - `createInvoiceV2` verifica que el `userId` pertenece al `businessId`.  
    Fuente: `functions/src/app/versions/v2/invoice/controllers/createInvoice.controller.js`.
  - `getInvoiceV2Http` valida `businessId` vs `users/{uid}.businessID`.  
    Fuente: `functions/src/app/versions/v2/invoice/controllers/getInvoiceHttp.controller.js`.
  - `getNcfLedgerInsights` valida business y roles/permisos del ledger.  
    Fuente: `functions/src/app/versions/v2/invoice/controllers/getNcfLedgerInsights.controller.js`.
  - PINs v2 usan `ensureBusinessMatch` entre actor y usuario target.  
    Fuente: `functions/src/app/versions/v2/auth/pin/pin.users.js`.

- **Sin validacion explicita de businessID:**
  - `ensureDefaultWarehouseForBusiness` solo valida rol y recibe `businessID` desde el cliente.  
    Fuente: `functions/src/app/modules/business/functions/ensureDefaultWarehouseForBusiness.js`.

**Conclusiones multi-tenancy:**

- Hay **controles parciales** en backend, no un middleware centralizado.
- Muchas operaciones dependen de **reglas de Firestore** (no presentes en este repo) para garantizar aislamiento.
- Riesgo: endpoints que reciben `businessID` desde el cliente sin verificarlo contra el usuario.

---

## 4. Autorizacion Frontend (UI Guards)

### Guardias de ruta

- `RequireAuth` solo verifica que exista un usuario en Redux.  
  Fuente: `src/modules/auth/components/RequireAuth.tsx`.
- `processRoute` decide publico vs protegido, pero **no aplica roles**.  
  Fuente: `src/router/routes/requiereAuthProvider.tsx`.

### Menu / Sidebar

- Los menus se filtran via abilities CASL (`abilities.can('access', route)`), usando `useFilterMenuItemsByAccess`.  
  Fuente: `src/utils/menuAccess.ts`.
- `routeVisibility` controla `hideInMenu` por meta/status, no por rol.  
  Fuente: `src/router/routes/routeVisibility.ts`.

### Pantallas sensibles

- General Config bloquea acceso si el usuario no puede `manage Business` (por ejemplo, cashiers).  
  Fuente: `src/modules/settings/components/GeneralConfig/GeneralConfig.tsx`.
- En varios modulos se usan listas `allowedRoles` locales (ej. Cash Count, Invoice Summary, PIN modal).  
  Fuentes:
  - `src/modules/cashReconciliation/pages/CashReconciliation/page/CashRegisterOpening/CashRegisterOpening.tsx`
  - `src/modules/sales/pages/Sale/components/Cart/components/InvoiceSummary/InvoiceSummary.tsx`
  - `src/components/modals/PinAuthorizationModal/PinAuthorizationModal.tsx`

**Conclusiones UI:**

- La autorizacion en frontend es **principalmente ocultar/mostrar** (menus + componentes).
- No es un control de seguridad real si no existe enforcement en backend/reglas.

---

## 5. Autorizacion Backend (API Guards)

### Guards existentes

- `assertAdminAccess` protege operaciones admin en auth v2.  
  Fuente: `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js`.
- `resolveHttpAuthUser` valida session token o Firebase ID token en endpoints HTTP.  
  Fuente: `functions/src/app/versions/v2/auth/services/httpAuth.service.js`.
- `ensureActiveSession` valida session token en callables de auth.  
  Fuente: `functions/src/app/versions/v2/auth/controllers/clientAuth.controller.js`.
- Ledger NCF aplica roles/permisos con `evaluateLedgerAccess`.  
  Fuente: `functions/src/app/versions/v2/invoice/controllers/ncfLedgerAccess.util.js`.
- PIN Auth v2 valida rol y negocio (`ensureBusinessMatch`).  
  Fuente: `functions/src/app/versions/v2/auth/controllers/pin.controller.js`.

### Facturacion / Inventario

- **Factura (invoice):**
  - `createInvoiceV2` valida que el usuario pertenezca al negocio pero **no valida rol**.
  - `getInvoiceV2Http` valida auth y business pero **no valida rol**.
- **Inventario:** no se observan guards de rol en controladores del backend revisados; la mayoria son cron/trigger/servicios sin contexto de usuario.

**Conclusiones Backend:**

- Existe autenticacion (session o Firebase token), pero **la autorizacion por rol es inconsistente** fuera de PIN/NCF.
- Muchas operaciones dependen de que el cliente envie `businessID` correcto.

---

## Resumen Ejecutivo (para roadmap pagos / recuperacion)

- **Existe rol `owner`**, pero **no hay concepto tecnico de "creador del negocio"** en backend.
- **Admin vs Owner** se diferencia en UI, no en un modelo de negocio robusto.
- **Multi-tenancy**: enforcement parcial; sin reglas de Firestore no se puede garantizar aislamiento.
- **Para pagos/recuperacion** se recomienda:
  1. Introducir campo `business.ownerId` y/o lista de `business.adminIds`.
  2. Enforce roles en backend (middleware central para callables/HTTP).
  3. Alinear roles (frontend/back) en un enum compartido o constantes.
  4. Mover permisos criticos a backend/reglas, no solo UI.
