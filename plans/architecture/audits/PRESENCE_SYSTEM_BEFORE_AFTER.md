# Sistema de Presencia (Antes vs Actual)

Fecha: `2026-02-26`

Estado: `Documento de análisis comparativo`

Objetivo: describir cómo funciona el sistema de presencia en toda la app, comparar la versión anterior vs la versión actual (rediseño incremental), y dejar visibles errores/riesgos pendientes para una siguiente iteración.

## Alcance

Este documento cubre dos sistemas distintos que usan la palabra "presencia":

1. `Presencia de usuario global` (auth / usuarios en línea)
   - Fuente principal: `Realtime Database`
   - Proyección resumida: `Firestore users/{uid}.presence`
   - Consumo UI: `users/list`, `user activity`

2. `Presencia de edición en inventario` (quién está editando una sesión)
   - Fuente: `Firestore businesses/{businessId}/inventorySessions/{sessionId}/editingUsers/{uid}`
   - No usa heartbeat global de auth
   - No fue modificada en este rediseño

## Resumen Ejecutivo

El problema observado en `users/list` (aparente "loading" cada ~20s) era consistente con el heartbeat de presencia:

- El cliente actualiza RTDB cada `20s` (`src/firebase/presence/useRealtimePresence.ts:23`, `src/firebase/presence/useRealtimePresence.ts:155`).
- Un trigger (`syncRealtimePresence`) espejaba esos cambios a Firestore en `users/{uid}.presence` (`functions/src/app/versions/v2/auth/triggers/presenceSync.js:43`, `functions/src/app/versions/v2/auth/triggers/presenceSync.js:123`).
- `users/list` consumía usuarios por Firestore y presencia por RTDB al mismo tiempo (`src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:460`, `src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:531`).
- La tabla ordenaba por presencia/última actividad, provocando reordenamientos y churn visible (`src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:666`).

El rediseño actual mantiene precisión en tiempo real usando RTDB, pero reduce costo/churn evitando que cada heartbeat termine en write + churn de Firestore/UI.

## Mapa del Sistema (Común a ambas versiones)

### 1) Punto de escritura de presencia (cliente)

`GlobalListeners` monta el hook de presencia global cuando hay usuario autenticado:

- `src/router/GlobalListeners.tsx:62`
- `src/router/GlobalListeners.tsx:63`

El hook `useRealtimePresence`:

- escucha `.info/connected` (`src/firebase/presence/useRealtimePresence.ts:112`)
- escribe un nodo por conexión en `presence/{uid}/{connectionId}` con `state`, `updatedAt`, `sessionId`, `deviceId`, `businessId`, `actor` (`src/firebase/presence/useRealtimePresence.ts:151`)
- mantiene heartbeat cada `20s` (`src/firebase/presence/useRealtimePresence.ts:23`, `src/firebase/presence/useRealtimePresence.ts:155`)
- marca offline en `onDisconnect`/cleanup (`src/firebase/presence/useRealtimePresence.ts:169`, `src/firebase/presence/useRealtimePresence.ts:201`)
- actualiza metadatos (`businessId`, `role`) cuando cambia contexto del usuario (`src/firebase/presence/useRealtimePresence.ts:223`)

### 2) Trigger de agregación / proyección (backend)

Cloud Function RTDB trigger:

- `functions/src/app/versions/v2/auth/triggers/presenceSync.js:43`

Responsabilidades:

- recalcular estado agregado por usuario leyendo `presence/{userId}/*`
- limpiar nodos inválidos o `offline` stale (`OFFLINE_STALE_MS`) y recalcular agregados (`functions/src/app/versions/v2/auth/triggers/presenceSync.js`)
- persistir resumen en `users/{uid}.presence` (`status`, `updatedAt`, `connectionCount`, `lastSeen`) (`functions/src/app/versions/v2/auth/triggers/presenceSync.js:123`, `functions/src/app/versions/v2/auth/triggers/presenceSync.js:140`)

### 3) Pantallas consumidoras principales

`Users List`

- Firestore users por `fbGetUsers`: `src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:460`
- RTDB presencia por usuario: `src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:531`
- genera `presenceMap` y compone filas: `src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:448`, `src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:574`
- ordena la tabla según presencia/tiempo: `src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:666`
- el overlay real de loading lo pinta `AdvancedTable`: `src/components/ui/AdvancedTable/AdvancedTable.tsx:501`

`User Activity`

- recibe `initialPresence` por navegación desde `UserList`: `src/modules/settings/pages/setting/subPage/Users/UserActivity.tsx:42`, `src/modules/settings/pages/setting/subPage/Users/UserActivity.tsx:44`, `src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:723`
- además escucha RTDB directo en `presence/{userId}`: `src/modules/settings/pages/setting/subPage/Users/UserActivity/hooks/useUserActivityData.ts:155`
- calcula `presenceStatus` y `resolvedLastSeen`: `src/modules/settings/pages/setting/subPage/Users/UserActivity/hooks/useUserActivityData.ts:235`, `src/modules/settings/pages/setting/subPage/Users/UserActivity/hooks/useUserActivityData.ts:240`

### 4) Listener de auth (Firestore users/{uid})

`useUserDocListener` escucha `users/{uid}` (`src/firebase/Auth/fbAuthV2/fbSignIn/updateUserData.ts:52`), pero construye un payload explícito sin `presence` (`src/firebase/Auth/fbAuthV2/fbSignIn/updateUserData.ts:9`) y además deduplica por `JSON.stringify(payload)` (`src/firebase/Auth/fbAuthV2/fbSignIn/updateUserData.ts:69`, `src/firebase/Auth/fbAuthV2/fbSignIn/updateUserData.ts:70`, `src/firebase/Auth/fbAuthV2/fbSignIn/updateUserData.ts:75`).

Conclusión importante:

- aunque el trigger actualice `users/{uid}.presence`, eso normalmente no provoca churn en auth global, porque el payload despachado no incluye `presence`.

## Versión Anterior (Antes del rediseño)

Nota: esta sección describe el comportamiento previo usando el estado anterior del código (reconstruido desde el diff del turno) y la arquitectura existente.

### Flujo de datos (antes)

1. Cliente autenticado monta `useRealtimePresence`.
2. Escribe `presence/{uid}/{connectionId}` y envía heartbeat cada `20s`.
3. Cada write en RTDB dispara `syncRealtimePresence`.
4. El trigger recalcula agregado y escribía resumen en `users/{uid}.presence` en Firestore incluso para heartbeat normal `online -> online`.
5. `fbGetUsers` escuchaba `users` por chunks (`onSnapshot`) y reemitía lista completa en cada snapshot.
6. `UserList` además escuchaba RTDB (`presence/{uid}` por cada usuario).
7. La tabla recomponía filas/orden y podía moverse visualmente cada ~20s.

### Problemas observados (antes)

#### 1) Redundancia de fuentes para la misma UI (`users/list`)

`UserList` ya tenía presencia precisa desde RTDB, pero también recibía el espejo de Firestore indirectamente a través de `fbGetUsers`.

Esto generaba:

- duplicidad de datos (RTDB + Firestore) para el mismo dato funcional
- más re-renders
- más costo (writes y snapshots en Firestore)

#### 2) Espejo de presencia en documento caliente `users/{uid}`

El resumen se guardaba dentro del documento principal de usuario. Eso hace que cualquier listener que lea `users/{uid}` completo vea cambios frecuentes aunque no necesite presencia.

Además, `normalizeFirestoreUser` preserva el documento raíz completo (`...(root as UnknownRecord)`) (`src/utils/users/normalizeFirestoreUser.ts:87`, `src/utils/users/normalizeFirestoreUser.ts:88`), por lo que `presence` viajaba con el payload normalizado.

#### 3) `fbGetUsers` reemitía de más

Antes del rediseño:

- emitía en cada snapshot de chunk
- llamaba `onLoad` en cada emisión (no solo carga inicial)

Eso era una semántica débil para una API de datos en tiempo real, y podía causar efectos secundarios en consumidores que interpretaran `onLoad` como "terminó de cargar" una sola vez.

#### 4) `users/list` ordenaba por un dato ultra-volátil

La lista ordenaba por bucket de presencia y `lastUpdated`. Con heartbeat cada `20s`, los usuarios online podían reordenarse constantemente y dar sensación de refresh.

#### 5) Costo innecesario (patrón)

Por cada heartbeat (aprox):

- `1` write RTDB
- `1` invocación de Cloud Function
- `1` write Firestore (`users/{uid}.presence`)
- snapshots en listeners Firestore abiertos
- recomposición + ordenamiento en `users/list`

Esto escala rápido con usuarios concurrentes.

### Evaluación (antes) con principios de ingeniería

- `Complejidad esencial`: multi-dispositivo, online/offline, última actividad.
- `Complejidad accidental`: doble fuente en UI, espejo por heartbeat, orden por dato volátil.
- `Modularidad`: aceptable (hook cliente / trigger / UI), pero con responsabilidades mezcladas en `users/list`.
- `Cohesión`: media-baja en `users/list` (usuarios + presencia + sort + navegación + acciones).
- `Acoplamiento`: alto entre presencia de Firestore y carga de usuarios.
- `Abstracción`: insuficiente en la frontera `fbGetUsers` (transportaba campos volátiles no necesarios).
- `Simplicidad`: media-baja por reactividad redundante.

## Versión Actual (Rediseño incremental aplicado)

### Objetivo del rediseño

Mantener precisión de presencia (RTDB) y reducir costo/churn sin reescribir todo el sistema.

Principio aplicado:

- `RTDB` = fuente de verdad de presencia en vivo
- `Firestore` = resumen/proyección (no necesariamente cada heartbeat)
- `users/list` = presentación estable, no acoplada al ruido del heartbeat

### Cambios implementados

### A) Trigger `syncRealtimePresence`: skip de heartbeats online->online

Se agregó detección explícita de heartbeat "solo cambió `updatedAt`":

- `safeJsonStringify`: `functions/src/app/versions/v2/auth/triggers/presenceSync.js:13`
- `isHeartbeatOnlyOnlineUpdate`: `functions/src/app/versions/v2/auth/triggers/presenceSync.js:21`
- uso dentro del trigger: `functions/src/app/versions/v2/auth/triggers/presenceSync.js:72`

Regla actual:

- si el evento es `online -> online`
- y el payload solo cambió en `updatedAt`
- y no hubo limpiezas/recalculos (`removals.length === 0`)
- entonces `NO` escribe el resumen en Firestore (`functions/src/app/versions/v2/auth/triggers/presenceSync.js:119`)

Esto mantiene:

- precisión UI en vivo (sigue viniendo de RTDB)
- resumen Firestore útil en transiciones/limpieza/eventos relevantes

### B) `fbGetUsers`: desacoplar presencia volátil y deduplicar emisiones

Cambios:

- `stripVolatileUserMirrorFields(...)` elimina `presence` del payload emitido a UI (`src/firebase/users/fbGetUsers.ts:140`)
- `safeSerializeUsers(...)` + firma para evitar reemitir arrays equivalentes (`src/firebase/users/fbGetUsers.ts:147`, `src/firebase/users/fbGetUsers.ts:216`)
- `emitLoadedOnce()` corrige semántica de `onLoad` a "carga inicial" (`src/firebase/users/fbGetUsers.ts:182`)

Efecto:

- aunque Firestore reciba cambios ajenos o snapshots repetidos, `users/list` ya no se entera si la lista efectiva de usuarios no cambió
- se elimina la contaminación por `users/{uid}.presence` en la carga de usuarios

### C) `UserList`: estabilidad de datos, loading derivado y anti-churn por heartbeat

Cambios principales:

- contexto de consulta estable por negocio (`usersQueryContext`) en vez de depender del objeto `currentUser` completo (`src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:382`)
- `loading` derivado por `businessId` cargado (`loadedUsersBusinessId` + `isUsersLoading`) (`src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:352`, `src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:440`)
- presencia RTDB sigue siendo la fuente para la tabla, pero se ignoran heartbeats `online -> online` para no rerenderizar cada 20s (`src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:486`, `src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:499`)
- orden estable para usuarios online (ya no se usa `lastUpdated` online para reordenar constantemente) (`src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:666`, `src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:677`)
- `rowKey` estable (`getRowId`) (`src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:1055`)

Resultado esperado:

- la tabla sigue mostrando online/offline con precisión
- deja de “brincar” cada heartbeat
- el overlay de `AdvancedTable` (`src/components/ui/AdvancedTable/AdvancedTable.tsx:501`) no debería reaparecer por heartbeats normales

### D) `UserActivity` (sin cambio de arquitectura, sigue preciso)

`UserActivity` mantiene comportamiento útil:

- puede arrancar con `initialPresence` desde la navegación (`src/modules/settings/pages/setting/subPage/Users/UserActivity.tsx:44`)
- se corrige en tiempo real escuchando RTDB directo (`src/modules/settings/pages/setting/subPage/Users/UserActivity/hooks/useUserActivityData.ts:155`, `src/modules/settings/pages/setting/subPage/Users/UserActivity/hooks/useUserActivityData.ts:178`)

Esto conserva precisión para detalle de actividad.

## Comparación Antes vs Actual

| Tema | Antes | Actual |
|---|---|---|
| Fuente precisa de presencia | RTDB | RTDB |
| Resumen Firestore | Se escribía casi en cada heartbeat | Se omite en heartbeat online->online puro |
| `users/list` lee presencia desde RTDB | Sí | Sí |
| `users/list` recibe presencia espejada desde Firestore | Sí (indirecto por `fbGetUsers`) | No (se filtra `presence`) |
| `fbGetUsers` reemite snapshots equivalentes | Sí | No (dedupe por firma) |
| `fbGetUsers.onLoad` | Se disparaba repetidamente | Se dispara una vez por carga inicial |
| Orden de usuarios online | Volátil (por `lastUpdated`) | Estable |
| Costo Firestore por heartbeat | Alto (write + listeners) | Menor (sin write en heartbeat puro) |
| Costo de invocación Function por heartbeat | Sí | Sigue existiendo |

## Qué se gana y qué no (muy importante)

### Garantías que sí se mantienen

- Presencia `online/offline` precisa en tiempo real en `users/list` y `UserActivity`.
- Soporte multi-conexión por usuario (`presence/{uid}/{connectionId}`).
- Limpieza de nodos stale y agregación de `connectionCount`.

### Costos que sí bajan

- Writes de Firestore por heartbeats normales.
- Churn de listeners Firestore de lista de usuarios.
- Re-renders/reordenamientos innecesarios en `users/list`.

### Costos que todavía quedan

- Invocación del trigger RTDB por heartbeat (cada cambio sigue disparando `onValueWritten`).
- Listeners RTDB por usuario en `users/list` (uno por fila/usuario observado).

## Riesgos / Errores / Deuda técnica pendientes

### 1) El trigger sigue invocándose por cada heartbeat

El cambio actual evita `writes` de Firestore en heartbeats puros, pero no evita la invocación de la Function.

Impacto:

- sigue habiendo costo de ejecución (aunque menor)
- sigue habiendo trabajo de agregación/lectura RTDB por evento

### 2) `users/list` usa un listener RTDB por usuario (escalabilidad)

Hoy la lista crea `onValue` por cada `uid` (`src/modules/settings/pages/setting/subPage/Users/components/UsersList/UserList.tsx:531`).

Para pocos/medios usuarios funciona. Para cientos, escala peor.

Mejora futura sugerida:

- índice agregado por negocio en RTDB (ej. `presenceByBusiness/{businessId}/{uid}`)
- o suscripción a subset visible/paginado

### 3) El resumen de presencia sigue viviendo dentro de `users/{uid}`

Aunque ya no se escribe en cada heartbeat, sigue siendo un campo volátil dentro del documento principal de usuario.

Mejora futura sugerida:

- mover a `userPresenceSummary/{uid}` para desacoplar cargas del perfil

### 4) `UserActivity` seguirá reaccionando a heartbeats (si está abierto)

Esto es correcto para una pantalla de detalle, pero si se busca máxima eficiencia:

- se puede coarsen/debounce la visualización de `lastSeen` mientras está `online`

### 5) Warnings existentes en `UserList` (no bloqueantes para presencia)

Persisten warnings de lint/React hooks en `UserList` que son deuda previa/no funcional:

- `setBusinessOwnerCandidates([])` dentro de effect (`react-hooks/set-state-in-effect`)
- dependencia innecesaria en un `useMemo` del `ActionMenu`

No rompen la presencia, pero sí afectan mantenibilidad.

### 6) Nota histórica: heurística de stale online (ya retirada)

Antes existía una heurística `ONLINE_STALE_MS = 30s` que expiraba conexiones `online`
por antigüedad de `updatedAt`. Eso dependía del heartbeat del cliente y podía causar
falsos offline cuando se migra a `onDisconnect` sin heartbeat.

Versión actual:

- `online` se considera activo por `state` (RTDB + `onDisconnect`)
- se conserva limpieza de `offline` stale (`OFFLINE_STALE_MS = 5m`)
- el resumen Firestore deja de depender del “latido” para sostener `online`

## Sub-sistema separado: "presencia" de edición en Inventario (sin cambios)

Hay otro uso del concepto "presencia" en inventario, pero no es el mismo sistema.

En `useInventoryCounts`, al guardar conteos se hace un "touch" en Firestore:

- `editingUsers/{uid}` con `lastActiveAt` (`src/modules/inventory/pages/InventoryControl/hooks/useInventoryCounts.ts:505`, `src/modules/inventory/pages/InventoryControl/hooks/useInventoryCounts.ts:513`, `src/modules/inventory/pages/InventoryControl/hooks/useInventoryCounts.ts:527`)

Características:

- no usa RTDB
- no usa heartbeat cada 20s
- no pasa por `syncRealtimePresence`
- representa actividad de edición de sesión, no presencia global de auth

## Checklist de verificación (para comparar V1 vs V2 en QA)

1. Abrir `users/list` y observar 2-3 minutos.
2. Confirmar que no aparece "loading" visual cada ~20s (overlay de tabla).
3. Confirmar que las etiquetas `En línea / Fuera de línea` sí cambian cuando un usuario entra/sale.
4. Confirmar que `UserActivity` sigue mostrando estado en vivo.
5. Revisar en consola Firebase:
   - RTDB `presence/{uid}/{connectionId}` sigue actualizando `updatedAt`
   - Firestore `users/{uid}.presence` ya no cambia en cada heartbeat puro
6. Verificar transiciones:
   - login -> online
   - cierre/timeout -> offline
   - cambio de negocio/rol -> actualiza metadata de conexión

## Propuesta de V3 (opcional, si se busca más ahorro)

1. Mover resumen a `userPresenceSummary/{uid}` (desacoplar `users`).
2. Mantener writes inmediatos solo en cambios de estado (`online/offline`).
3. Throttle de resumen para `lastSeen` mientras sigue online (ej. 60-300s).
4. Agregado de presencia por negocio en RTDB para listas (`presenceByBusiness/*`).
5. Métricas/observabilidad:
   - número de heartbeats/min
   - invocaciones de `syncRealtimePresence`
   - writes de resumen Firestore evitados

## Conclusión

La versión actual reduce complejidad accidental y costo sin sacrificar la precisión esencial de presencia en tiempo real:

- `Precisión`: se conserva por RTDB.
- `Costo`: baja al cortar el espejo Firestore por heartbeat.
- `UX`: mejora al estabilizar `users/list`.

Todavía existe una siguiente etapa de optimización (V3) si la concurrencia crece, especialmente por invocaciones del trigger y listeners RTDB por usuario.
