# Assistant 2.0: Firebase AI Logic y App Check

Este runbook deja el asistente de dev listo para operar con el flujo nuevo sin romper emuladores ni staging.

## Que cambio

- El analisis del asistente usa Genkit con salida estructurada y schema versionado.
- El cliente usa `firebase/ai` en lugar de `firebase/vertexai`.
- App Check queda preparado de forma opt-in en cliente y Functions.
- El callable de analisis devuelve metadata de modelo, region, schema y modo App Check.
- La metadata incluye duracion del analisis para comparar cambios de modelo/region.
- El menu del asistente incluye `Diagnostico asistente`, que valida configuracion, auth y presencia de App Check sin llamar al modelo ni crear datos.

## Variables del frontend

Configurar en el env del frontend cuando se quiera activar App Check o mover el modelo cliente:

```powershell
VITE_FIREBASE_APPCHECK_SITE_KEY="recaptcha-enterprise-site-key"
VITE_FIREBASE_APPCHECK_DEBUG_TOKEN="true"
VITE_FIREBASE_AI_MODEL="gemini-2.5-flash"
VITE_FIREBASE_AI_LOCATION="us-central1"
VITE_FIREBASE_AI_REMOTE_CONFIG="true"
VITE_FIREBASE_AI_REMOTE_MODEL_KEY="firebase_ai_model"
VITE_FIREBASE_AI_REMOTE_LOCATION_KEY="firebase_ai_location"
```

Notas:

- `VITE_FIREBASE_APPCHECK_SITE_KEY` activa App Check en navegadores reales.
- En emuladores App Check no se inicializa.
- `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN` es solo para desarrollo. Usar `"true"` para imprimir un token de debug o pegar un token registrado.
- Remote Config puede mover el modelo/región cliente sin redeploy. Si falla o no existe, cae a `VITE_FIREBASE_AI_MODEL` / `VITE_FIREBASE_AI_LOCATION`.
- Usar `VITE_FIREBASE_AI_REMOTE_CONFIG="false"` para apagar Remote Config y usar solo env.

## Variables de Functions

Configurar en el entorno de Functions:

```powershell
GENKIT_VERTEX_MODEL="gemini-2.5-flash"
GENKIT_VERTEX_LOCATION="us-central1"
AI_BUSINESS_SEEDING_DEBUG_ERRORS="true"
AI_AGENT_ENFORCE_APP_CHECK="false"
```

Para activar enforcement con proteccion contra replay:

```powershell
AI_AGENT_ENFORCE_APP_CHECK="true"
```

## Rollout recomendado

1. Deploy staging con `AI_AGENT_ENFORCE_APP_CHECK="false"`.
2. Configurar `VITE_FIREBASE_APPCHECK_SITE_KEY` en staging.
3. Probar el asistente desde `/dev/tools/ai-business-seeding`.
4. Ejecutar `Diagnostico asistente` desde el menu de la herramienta y confirmar `app check: presente` antes de exigir App Check.
5. Activar `AI_AGENT_ENFORCE_APP_CHECK="true"` en staging.
6. Re-deploy de las funciones del asistente.
7. Validar que el log muestre `Asistente 2.0: salida estructurada activa` con modelo, region y duracion.
8. Repetir en prod cuando staging este estable.

## Deploy puntual

`Diagnostico asistente` se atiende por la operacion `status` dentro de `aiBusinessSeedingAgent`; no existe una Function desplegable separada para status. Siempre validar primero en staging.

```powershell
firebase deploy --project ventamax-staging --only "functions:aiBusinessSeedingAgent,functions:aiBusinessSeedingAgentAnalyze,functions:aiBusinessSeedingAgentExecute,functions:aiCreateBusinessAgent"
```

La idempotencia de ejecucion usa TTL en Firestore para limpiar marcadores tecnicos del asistente. Desplegar indices/TTL en staging junto al cambio:

```powershell
firebase deploy --project ventamax-staging --only "firestore:indexes"
```

## Verificacion local

```powershell
npm run test:run:functions -- functions/src/app/modules/ai/utils/aiBusinessSeedingOperations.test.js functions/src/app/modules/ai/utils/aiBusinessSeedingStructuredOutput.test.js functions/src/app/modules/ai/config/aiCallableOptions.test.js functions/src/app/modules/ai/utils/aiBusinessSeedingStatus.test.js
npm run test:run -- src/firebase/firebaseAiRuntimeConfig.test.ts src/modules/dev/pages/dev/AiBusinessSeeding/utils/runtimeMetadata.test.ts
npm --prefix functions run build
npm run typecheck:app
```
