# Firebase I/O 2026 audit for VentaMas

Fecha: 2026-05-29

Este documento cruza las novedades recientes de Firebase con el estado real del repo `C:\Dev\VentaMas`. La recomendacion operativa es staging primero: `ventamax-staging`.

## Evidencia local

### Proyectos Firebase

- `.firebaserc` define `default` y `prod` como `ventamaxpos`, y `staging` como `ventamax-staging`.
- `firebase.json` despliega Hosting `prod` y `staging`, Firestore rules/indexes, Storage rules y Functions desde `functions/`.
- Firestore inspeccionado por CLI:
  - `ventamax-staging`: `(default)`, `STANDARD`, `FIRESTORE_NATIVE`.
  - `ventamaxpos`: `(default)`, `STANDARD`, `FIRESTORE_NATIVE`.

### Versiones instaladas

| Paquete                   |       Repo | Instalado | Publicado en npm al 2026-05-29 | Lectura                                                                                                      |
| ------------------------- | ---------: | --------: | -----------------------------: | ------------------------------------------------------------------------------------------------------------ |
| `firebase`                |  `^11.0.1` | `11.10.0` |                      `12.14.0` | Hay salto mayor; probar en staging antes de usar features web nuevas como limited-use App Check en AI Logic. |
| `firebase-tools`          | `^15.17.0` | `15.17.0` |                      `15.19.0` | Cerca de latest; actualizar es bajo riesgo relativo.                                                         |
| `firebase-functions`      |   `^7.2.3` |   `7.2.3` |                        `7.2.5` | Patch menor disponible.                                                                                      |
| `firebase-admin`          |  `^12.7.0` |  `12.7.0` |                      `13.10.0` | Hay salto mayor; revisar cambios de Admin SDK antes de actualizar.                                           |
| `genkit`                  |  `^1.18.0` |  `1.29.0` |                       `1.36.0` | Conviene probar con las funciones de AI en staging.                                                          |
| `@genkit-ai/google-genai` |  `^1.18.0` |  `1.29.0` |                       `1.36.0` | Igual que Genkit.                                                                                            |

### Servicios Firebase usados por el repo

- Web SDK: Auth, Firestore, Functions, Storage, Realtime Database, Remote Config, App Check y Firebase AI Logic.
- Functions: callables v2, scheduled functions, Firestore triggers v2 y algunos usos legacy de `firebase-functions`.
- Firestore: muchas consultas con filtros, `in`, `array-contains`, collection groups, agregaciones (`getCountFromServer`, `getAggregateFromServer`, `AggregateField.sum`) e indices compuestos declarados en `firestore.indexes.json`.
- AI actual: asistente dev de seeding con Genkit backend, salida estructurada, metadata de runtime, App Check opt-in, Remote Config para modelo cliente y diagnostico.

## Novedades relevantes de Firebase I/O 2026

### 1. Firebase AI Logic: modelos Gemini 3.x, seguridad y control de prompts

Google anuncio que Firebase AI Logic expande soporte de Gemini 3.x, mejora seguridad con `template-only` para server prompt templates, prepara `authentication-mode`, y agrega proteccion contra replay de App Check con one-time tokens.

Aplicacion a VentaMas:

- Ya migramos el cliente a `firebase/ai`, que es el camino correcto frente a `firebase/vertexai`.
- Ya tenemos App Check opt-in en cliente y callable options compartidas para el asistente.
- Ya tenemos Remote Config para mover modelo/region del cliente sin redeploy.
- Ya tenemos metadata para ver modelo, region, duracion, uso y estado de App Check.
- Pendiente recomendable: probar `firebase@12.x` en staging antes de depender de limited-use App Check para AI Logic web.
- Pendiente recomendable: evaluar server prompt templates en modo `template-only` cuando el flujo del asistente pase a usar llamadas cliente directas para tareas sensibles. Hoy el prompt principal del asistente vive en backend Genkit, asi que el riesgo de prompt injection desde cliente ya esta mas contenido.

### 2. AI monitoring: costo, latencia, errores y tokens

La checklist oficial de AI Logic recomienda monitoreo de requests, latencia, errores y token usage.

Aplicacion a VentaMas:

- El asistente ya devuelve metadata de uso y duracion al UI.
- Siguiente paso de valor: registrar `usage`, `durationMs`, `model`, `location`, `structuredOutput`, `contextTruncated` y `action` en Cloud Logging estructurado por request. Eso permite comparar modelos en staging antes de cambiar prod.
- No conviene medir solo "funciona/no funciona"; para IA conviene medir costo por accion completada.

### 3. App Check y staging-first

Firebase recomienda App Check para proteger AI Logic y backends de abuso. Para Cloud Functions existe enforcement, y la proteccion replay puede sumar latencia porque consume tokens.

Aplicacion a VentaMas:

- Mantener `AI_AGENT_ENFORCE_APP_CHECK=false` primero en staging.
- Verificar desde el menu `Diagnostico asistente` que el token llegue como presente.
- Luego activar enforcement en staging y observar errores reales.
- Solo pasar a prod cuando staging confirme App Check presente en navegadores reales.

### 4. Firestore Query Explain

Query Explain permite inspeccionar plan, indices usados, lecturas, documentos escaneados e index entries. Funciona desde server client libraries y es ideal para consultas puntuales.

Aplicacion a VentaMas:

- Muy aplicable para pantallas con costo potencial: cuentas por cobrar, inventario, productos, facturas, caja y auditorias dev.
- El repo ya tiene indices compuestos densos y sparse; Query Explain puede validar si una consulta usa el indice esperado o si esta escaneando demasiado.
- No requiere migrar a Enterprise para usarlo en consultas puntuales; se puede crear una herramienta dev/admin que ejecute explain con Admin SDK.
- No aplica a listeners streaming; para `onSnapshot` hay que medir por patron de consulta y volumen.

### 5. Firestore Enterprise / MongoDB compatibility

Firestore Enterprise con compatibilidad MongoDB y Native Enterprise trae query engine mas potente y capacidades nuevas, pero los dos proyectos actuales estan en Firestore STANDARD/native.

Aplicacion a VentaMas:

- No recomendar migracion ahora como primer paso. El costo/riesgo es alto porque VentaMas usa mucha estructura por `businesses/{businessId}/...`, reglas e indices ya orientados a Standard.
- Si aparece una necesidad real de busqueda compleja, regex, vector search o pipelines, probar primero en un proyecto separado o una base nueva Enterprise, no sobre staging principal.
- Para eficiencia inmediata, Query Explain + indices + agregaciones actuales da mejor retorno.

### 6. Crashlytics for web y A/B Testing/Remote Config

Firebase anuncio Crashlytics para web proximamente y A/B Testing con targeting mas rico via Remote Config.

Aplicacion a VentaMas:

- Crashlytics web seria interesante cuando este disponible publicamente para capturar errores reales del POS y flujos de dev/staging.
- Remote Config ya entro en el asistente para modelo/region. Se puede expandir luego para toggles de AI por entorno o cohortes dev.

## Cambios aplicados al asistente en esta rama

### Idempotencia de ejecucion

El `create_business` del asistente ahora recibe `executeRequestId` desde el frontend. La Function calcula un hash estable del payload normalizado y reserva una ejecucion en Firestore antes de crear el negocio.

Beneficio:

- Si el navegador reintenta por timeout, no crea un negocio duplicado.
- Si la misma llave se reutiliza con otro payload, la Function lo bloquea.
- Si una ejecucion ya termino, devuelve el `createdBusinessId` registrado.
- No guarda passwords ni payload completo en Firestore.

Archivos:

- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js`
- `functions/src/app/modules/ai/utils/aiBusinessSeedingExecutionIdempotency.js`
- `src/modules/dev/pages/dev/AiBusinessSeeding/hooks/useAiChat.ts`
- `src/modules/dev/pages/dev/AiBusinessSeeding/api/fbAiBusinessSeedingAgentExecute.ts`

### TTL para marcadores tecnicos

Los marcadores viven bajo:

```text
aiBusinessSeedingExecutionRequestActors/{actorUid}/aiBusinessSeedingExecutionRequestItems/{executeRequestId}
```

Cada marcador incluye `expiresAt` a 7 dias y `firestore.indexes.json` declara TTL para `aiBusinessSeedingExecutionRequestItems.expiresAt`.

Beneficio:

- Staging no acumula intentos tecnicos del asistente.
- No se expone por reglas del cliente porque queda fuera de los matches permisivos de `users/{uid}`.

## Recomendacion priorizada

1. Desplegar a staging solamente las Functions del asistente y Firestore indexes.
2. Activar/validar App Check en staging sin enforcement.
3. Usar `Diagnostico asistente` y ejecutar un `create_business` real de prueba.
4. Revisar Cloud Logs y UI metadata: modelo, region, tokens, duracion, App Check y si hubo reutilizacion por idempotencia.
5. Actualizar `firebase-tools` patch en repo si no rompe deploy.
6. Abrir un PR separado para probar `firebase@12.x` y App Check limited-use en staging.
7. Crear una herramienta dev de Query Explain para 3 consultas caras antes de pensar en Firestore Enterprise.

## Comandos staging

Deploy de Functions afectadas:

```powershell
firebase deploy --project ventamax-staging --only "functions:aiBusinessSeedingAgent,functions:aiBusinessSeedingAgentAnalyze,functions:aiBusinessSeedingAgentExecute,functions:aiCreateBusinessAgent"
```

Deploy de indices/TTL:

```powershell
firebase deploy --project ventamax-staging --only "firestore:indexes"
```

Validacion local:

```powershell
npm run test:run:functions -- functions\src\app\modules\ai\utils\aiBusinessSeedingExecutionIdempotency.test.js functions\src\app\modules\ai\utils\aiBusinessSeedingAvailability.test.js functions\src\app\modules\ai\utils\aiBusinessSeedingConversationContext.test.js functions\src\app\modules\ai\utils\aiBusinessSeedingStructuredOutput.test.js functions\src\app\modules\ai\utils\aiBusinessSeedingStatus.test.js functions\src\app\modules\ai\utils\aiBusinessSeedingSystemPrompt.test.js functions\src\app\modules\ai\utils\aiBusinessSeedingOperations.test.js functions\src\app\modules\ai\config\aiCallableOptions.test.js
npm run test:run -- src\modules\dev\pages\dev\AiBusinessSeeding\utils\conversationContext.test.ts src\modules\dev\pages\dev\AiBusinessSeeding\utils\runtimeMetadata.test.ts src\firebase\firebaseAiRuntimeConfig.test.ts
npm --prefix functions run build
npm run typecheck:app
```

## Fuentes oficiales usadas

- Firebase I/O 2026 announcements: https://firebase.blog/posts/2026/05/google-io-2026-announcements
- Firebase AI Logic production checklist: https://firebase.google.com/docs/ai-logic/production-checklist
- Firebase AI Logic server prompt templates: https://firebase.google.com/docs/ai-logic/server-prompt-templates/get-started
- Firebase AI Logic App Check: https://firebase.google.com/docs/ai-logic/app-check
- Firestore Query Explain: https://firebase.google.com/docs/firestore/query-explain
- Firestore Enterprise MongoDB compatibility: https://firebase.google.com/docs/firestore/enterprise/mongodb-compatibility-overview
