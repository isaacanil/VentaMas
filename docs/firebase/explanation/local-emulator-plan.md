# Plan del entorno local con Firebase Emulator Suite para VentaMas

## 📋 Contexto

Este documento propone un plan de implementacion futura. No configura el emulador, no crea seeds y no modifica scripts. Su objetivo es dejar una ruta clara y segura para montar un entorno local util sin tocar produccion.

La propuesta esta aterrizada al flujo real de `dev#3407` y al negocio `X63aIFwHzk3r0gmT8w6P`.

## 🎯 Objetivos

- Definir que emuladores hacen falta de verdad.
- Proponer una estrategia segura de conexion del frontend y de Functions.
- Definir como deberia resolverse la autenticacion personalizada en local.
- Diseñar un seed controlado, pequeno y suficiente para navegar, leer, escribir y probar funciones.
- Dejar claro que se debe incluir, que se debe excluir y que se debe sanitizar.

## ⚙️ Diseño / Arquitectura

### Emuladores recomendados

#### Fase base obligatoria

| Emulador | Puerto recomendado | Decision |
| --- | --- | --- |
| Emulator UI | 4000 | Mantener |
| Functions | 5001 | Mantener |
| Firestore | 8081 | Mantener el puerto ya usado por este repo |
| Auth | 9099 | Agregar |
| Realtime Database | 9000 | Agregar |

Justificacion:

- `Functions` es obligatorio para `clientLogin`, `clientRefreshSession`, `clientSelectActiveBusiness` y writes de negocio.
- `Firestore` es obligatorio por users, businesses, memberships, sessions y datos del negocio.
- `Auth` es obligatorio porque el frontend termina siempre en `signInWithCustomToken`.
- `Realtime Database` es obligatorio porque la app publica presencia de forma global al autenticarse.

#### Fase opcional

| Emulador | Puerto recomendado | Cuando agregarlo |
| --- | --- | --- |
| Storage | 9199 | Cuando se necesiten uploads, logos, imagenes de productos o reglas Storage |
| Pub/Sub | 8085 | Cuando se quieran cubrir cron jobs o escenarios scheduler/pubsub |
| Hosting | 5000 | Solo si se decide probar el frontend via Hosting Emulator en vez de Vite |

#### No requerido en la primera implementacion

| Emulador | Puerto oficial | Decision actual |
| --- | --- | --- |
| Eventarc | 9299 | No necesario hoy; el repo no declara custom Eventarc handlers propios |

Nota:

- Los triggers v2 de Firestore y RTDB del proyecto ya quedan cubiertos con `functions + firestore + database`.
- `Eventarc` solo se vuelve necesario si en una fase posterior aparecen custom events v2 o extensiones que los usen.

### Estrategia futura de conexion del frontend

El frontend necesitara cambios explicitos. Hoy no basta con arrancar emuladores.

#### Cambios futuros recomendados

1. Hacer que el frontend consuma de verdad una bandera local, por ejemplo `VITE_USE_EMULATORS`.
2. Conectar condicionalmente:
   - `connectFirestoreEmulator`
   - `connectFunctionsEmulator`
   - `connectAuthEmulator`
   - `connectDatabaseEmulator`
   - `connectStorageEmulator` cuando aplique
3. Sobrescribir la base URL de HTTP Functions mediante `VITE_FIREBASE_FUNCTIONS_BASE_URL`, porque el proyecto no usa solo callables.
4. Añadir una estrategia explicita para Firestore cache en modo emulador, porque hoy el SDK usa `persistentLocalCache(...)`.
5. Garantizar que, en modo local, presencia nunca escriba a la RTDB real.

#### Variables futuras recomendadas para frontend

Estas variables no se crean en esta pasada; solo se documentan:

| Variable | Uso propuesto |
| --- | --- |
| `VITE_USE_EMULATORS` | Habilitar redireccion a emuladores |
| `VITE_FIREBASE_FUNCTIONS_BASE_URL` | Redirigir endpoints HTTP a `http://127.0.0.1:5001/{project}/{region}` |
| `VITE_EMULATOR_FIRESTORE_HOST` | Host del Firestore Emulator |
| `VITE_EMULATOR_FIRESTORE_PORT` | Puerto del Firestore Emulator |
| `VITE_EMULATOR_AUTH_URL` | URL del Auth Emulator |
| `VITE_EMULATOR_DATABASE_HOST` | Host de RTDB Emulator |
| `VITE_EMULATOR_DATABASE_PORT` | Puerto de RTDB Emulator |
| `VITE_EMULATOR_STORAGE_HOST` | Host de Storage Emulator cuando aplique |
| `VITE_EMULATOR_STORAGE_PORT` | Puerto de Storage Emulator cuando aplique |

### Estrategia futura de conexion de Functions y Admin SDK

Dentro del Functions Emulator, Firebase suele inyectar configuracion automaticamente cuando los otros emuladores estan levantados. Aun asi, para scripts externos de seed o tooling conviene documentar estas variables:

| Variable | Uso futuro |
| --- | --- |
| `GCLOUD_PROJECT=ventamaxpos` | Mantener un solo project ID en todo el stack |
| `FIRESTORE_EMULATOR_HOST=127.0.0.1:8081` | Admin SDK contra Firestore local |
| `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` | Admin SDK contra Auth local |
| `FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000` | Admin SDK contra RTDB local |
| `FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199` | Solo si Storage entra en la fase |
| `CLOUD_TASKS_EMULATOR_HOST` | Solo si luego se necesitan task queues |

Recomendacion operativa futura:

- No reutilizar `.env` actual para el modo local.
- Usar overlays locales (`.env.local` y, si hace falta, `.secret.local`) para Functions y frontend.
- Evitar cualquier path que deje `.env` apuntando a RTDB o Functions reales mientras el frontend esta en local.

### Estrategia futura para auth personalizada en local

#### Opcion recomendada: reproducir el flujo real con credenciales locales

La forma mas fiel y segura seria:

1. Sembrar en el emulador el user root `users/BdNGtDt3y0`.
2. Preservar `name = dev#3407`, `activeBusinessId`, `lastSelectedBusinessId`, `activeRole`, `accessControl`, `platformRoles.dev`, `roleSimulation` y el resto del contexto real necesario.
3. Sustituir la `password` por un hash local-only conocido para desarrollo.
4. No copiar `sessionTokens` ni `sessionLogs`.
5. Dejar que `clientLogin` cree la sesion local y emita el custom token.
6. Permitir que `signInWithCustomToken` cree el usuario en Auth Emulator en el primer login si aun no existe.

Por que esta es la mejor opcion:

- Mantiene intacto el contrato real entre frontend, Firestore, Functions y Auth.
- Evita copiar hashes reales de password desde produccion.
- Evita seeds artificiales de `sessionTokens`.

#### Opcion alternativa: atajo solo para debugging

Se podria crear despues un flujo de acceso directo para desarrollador, por ejemplo mint de custom token o bootstrap de sesion. No se recomienda como default porque baja la fidelidad del sistema real.

#### Social login

Se recomienda dejarlo fuera de la primera fase. El proyecto puede vivir inicialmente con username/password local y dejar el provider flow para una segunda capa de paridad.

#### PIN y autorizaciones modulares

El negocio inspeccionado tiene `authorizationFlowEnabled = true` y el usuario tiene `authorizationPins`.

Decision de plan:

- Preservar esos campos en el analisis.
- En la implementacion futura decidir entre dos caminos:
  - Paridad alta: generar PIN local-only conocido y mantener el flujo de autorizacion.
  - Operativo base: desactivar modulos de autorizacion solo en la copia local del negocio.

La opcion recomendada depende del objetivo del siguiente sprint. Si la siguiente fase va a tocar invoices, caja y cuentas por cobrar con fidelidad alta, conviene preservar el flujo y solo reemplazar el material sensible por equivalentes locales.

### Dataset local recomendado para `X63aIFwHzk3r0gmT8w6P`

#### Lo que si deberia incluirse

##### Capa de identidad y acceso

| Incluir | Decision |
| --- | --- |
| `users/BdNGtDt3y0` | Obligatorio |
| `businesses/X63aIFwHzk3r0gmT8w6P` | Obligatorio |
| `businesses/X63aIFwHzk3r0gmT8w6P/members/*` | Recomendado copiar completo; solo son 18 docs |
| `businesses/X63aIFwHzk3r0gmT8w6P/userPermissions/*` | Recomendado copiar completo; solo son 2 docs |
| `businesses/X63aIFwHzk3r0gmT8w6P/settings/*` | Obligatorio |
| `businesses/X63aIFwHzk3r0gmT8w6P/taxReceipts/*` | Obligatorio |
| `businesses/X63aIFwHzk3r0gmT8w6P/counters/*` | Obligatorio |

Notas:

- `members` debe preservarse porque es la fuente canonica por negocio.
- `settings/billing` debe existir para evitar autocreacion al boot.
- `taxReceipts` debe estar no vacia para evitar writes automaticos al arrancar.
- `counters` es pequena y evita fallos en creacion de entidades.

##### Catalogos pequenos que conviene copiar completos

| Coleccion | Decision |
| --- | --- |
| `categories` | Copia completa |
| `productBrands` | Copia completa |
| `warehouses` | Copia completa |
| `providers` | Copia completa |
| `expensesCategories` | Copia completa |

Estas colecciones tienen bajo volumen y suelen evitar fallos de dropdowns, referencias y escrituras.

##### Slice transaccional recomendado

Para las colecciones grandes no conviene clonar todo. La recomendacion es un slice orientado a escenarios:

| Dominio | Slice futuro recomendado |
| --- | --- |
| `products` | 15 a 25 productos representativos |
| `productsStock` | Solo los registros de stock de esos productos |
| `batches` | Solo lotes ligados a esos productos |
| `clients` | 5 a 8 clientes ligados a transacciones copiadas |
| `invoices` | 8 a 12 facturas canonicas de escenarios distintos |
| `invoicesV2` | Solo los docs correspondientes a esas facturas |
| `invoicesV2/*/outbox` | Solo subdocs ligados a facturas copiadas, si se necesitan para depuracion |
| `accountsReceivable` | Solo AR ligadas a las facturas copiadas |
| `accountsReceivablePayments` | Solo pagos ligados a esas AR |
| `accountsReceivableInstallments` | Solo cuotas ligadas a esas AR |
| `accountsReceivableInstallmentPayments` | Solo docs ligados a esas cuotas |
| `accountsReceivablePaymentReceipt` | Solo recibos de esos pagos |
| `cashCounts` | 1 a 3 docs, idealmente cerrados |
| `purchases` | 2 a 3 compras |
| `expenses` | 2 a 5 gastos |
| `ncfUsage` | Slice opcional ligado a las facturas copiadas |
| `ncfLedger` | Slice opcional para preparar la capa fiscal/contable |

Escenarios que deberian quedar cubiertos por ese slice:

- Login y seleccion de negocio.
- Navegacion inicial sin errores.
- Producto con inventario.
- Producto sin inventario o servicio.
- Cliente con saldo pendiente.
- Factura pagada en efectivo.
- Factura pagada en tarjeta o transferencia.
- Factura a credito con AR abierta.
- Pago parcial de AR.
- Caja con historial minimo.
- Compra que toque inventario.
- Gasto ligado al negocio.

##### Capa fiscal/contable recomendada para la fase siguiente

Si el objetivo inmediato despues de este entorno local es contabilidad, conviene ampliar el slice con:

| Coleccion | Decision |
| --- | --- |
| `ncfUsage` | Copiar solo registros ligados a las facturas seleccionadas |
| `ncfLedger` | Copiar solo prefixes/entries ligados al mismo set de facturas |

Hallazgo adicional:

- En la inspeccion actual no aparecio un modelo claro y activo de `exchangeRate` o `tipoCambio` dentro del flujo principal inspeccionado.
- Eso sugiere que la futura fase de tasa de cambio necesitara una decision adicional de modelado o una auditoria mas focalizada, aunque este seed ya dejaria lista la base comercial y fiscal.

#### Lo que no deberia incluirse por defecto

| Excluir | Motivo |
| --- | --- |
| `sessionTokens/*` | Se deben generar localmente via login |
| `sessionLogs/*` | Son auditoria sensible y no hacen falta para boot |
| RTDB `presence/*` | No debe clonarse desde produccion |
| `approvalLogs/*` | Ruido para la fase inicial |
| `authorizationRequests/*` | Solo si luego se prueban flujos de autorizacion |
| `pinAuthLogs/*` | Ruido y datos sensibles |
| `idempotency/*` | No necesario para boot ni lectura base |
| `usage/*` | No necesario para este objetivo |
| Copia completa de `products`, `invoices`, `invoicesV2`, `accountsReceivable` | Volumen innecesario |

#### Lo que deberia sanitizarse

| Sanitizar | Regla recomendada |
| --- | --- |
| Password del usuario de prueba | Reemplazar por hash local-only |
| PINs/autorizaciones | Reemplazar por material local-only o desactivar modulos en copia local |
| Emails y telefonos | Anonimizar salvo los estrictamente necesarios |
| Direcciones, RNC, identificaciones fiscales | Anonimizar |
| Referencias de pago, autorizaciones bancarias, tokens externos | Eliminar o reemplazar |
| Billing contact y datos de suscripcion sensibles | Mantener solo lo minimo funcional |
| Metadata de sesion, user-agent, IPs | Excluir |

### Orden recomendado de poblado futuro

Para la implementacion posterior, el orden recomendado seria:

1. Preparar el baseline local sin escribir a produccion.
2. Poblado de `users/{uid}` requeridos.
3. Poblado del negocio raiz `businesses/{businessId}`.
4. Poblado de `members`, `userPermissions`, `settings`, `taxReceipts` y `counters`.
5. Poblado de catalogos pequenos.
6. Poblado del slice de inventario.
7. Poblado del slice de clientes.
8. Poblado del slice de caja.
9. Poblado del slice de invoices e `invoicesV2`.
10. Poblado del slice de AR y pagos.
11. Poblado de compras y gastos.
12. Primer login local para generar `sessionTokens` y el usuario del Auth Emulator.

Recomendacion de seguridad para esa fase:

- Si el baseline se carga con escrituras contra emuladores ya vivos, desactivar temporalmente triggers de background durante la carga para evitar reprocesar `invoicesV2/outbox`.
- Aun mejor: generar un baseline importable y levantar emuladores desde ese baseline, en vez de poblar todo con writes en caliente.

### Arranque futuro recomendado

Cuando llegue la fase de implementacion, el orden objetivo deberia ser:

1. Levantar emuladores base.
2. Importar baseline local ya sanitizado.
3. Levantar frontend apuntando solo a emuladores.
4. Iniciar sesion con `dev#3407` local.
5. Verificar acceso al negocio `X63aIFwHzk3r0gmT8w6P`.

Comandos objetivo futuros, una vez exista la configuracion:

```powershell
firebase emulators:start --only auth,database,firestore,functions
```

Si una segunda fase agrega Storage:

```powershell
firebase emulators:start --only auth,database,firestore,functions,storage
```

Y el frontend deberia seguir levantandose por el flujo de desarrollo actual:

```powershell
npm run dev
```

### Limitaciones conocidas del entorno local

Aunque el entorno quede bien montado, no replicara todo:

- No va a reproducir fielmente integraciones externas como Azul, CardNET, Supabase, Vertex AI, email ni webhooks reales.
- Las reglas Firestore locales hoy no reflejan exactamente lo desplegado.
- Los cron jobs y flujos scheduler/pubsub no quedaran cubiertos si no se agrega Pub/Sub despues.
- Un usuario creado por `signInWithCustomToken` en Auth Emulator puede existir con metadata distinta a produccion.
- Si se preserva la complejidad actual de roles, seguira existiendo la mezcla `platformRoles.dev + ownerUid + member.role + activeRole`.

## 📈 Impacto / Trade-offs

- Mantener paridad alta exige emular cuatro servicios base, no dos.
- El dataset local debe ser pequeño para ser util, pero no tan pequeño que rompa el boot.
- Copiar todos los catalogos pequenos reduce fallos y tiene bajo costo.
- Copiar solo slices transaccionales reduce peso y acelera futuras exportaciones/importaciones.
- El mayor trade-off es entre paridad de autorizaciones modulares y simplicidad operativa local.

## 🔜 Seguimiento / Próximos pasos

Checklist recomendada para pasar de plan a implementacion:

- [ ] Agregar configuracion futura de `auth` y `database` al bloque de emuladores.
- [ ] Cablear el frontend para consumir emuladores de manera integral.
- [ ] Agregar override para HTTP Functions.
- [ ] Definir politica local de password y PIN para `dev#3407`.
- [ ] Construir la exportacion read-only y la sanitizacion del slice del negocio `X63aIFwHzk3r0gmT8w6P`.
- [ ] Validar smoke flow local: login, seleccion del negocio, lectura, escritura y una Function critica.
- [ ] Decidir si Pub/Sub y Storage entran en la primera o segunda fase.

Referencias oficiales relevantes para la futura implementacion:

- https://firebase.google.com/docs/emulator-suite/connect_auth
- https://firebase.google.com/docs/emulator-suite/connect_functions
- https://firebase.google.com/docs/emulator-suite/connect_firestore
- https://firebase.google.com/docs/emulator-suite/connect_rtdb
- https://firebase.google.com/docs/emulator-suite/connect_storage
- https://firebase.google.com/docs/emulator-suite/install_and_configure
- https://firebase.google.com/docs/auth/admin/create-custom-tokens
