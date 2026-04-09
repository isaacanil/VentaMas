# Flujo del Agente AI (AiBusinessSeeding) - Implementacion Actual

## 1. Objetivo

Este documento describe **como funciona hoy** el flujo del agente AI usado en la pantalla de desarrollo `AiBusinessSeeding` (frontend + Firebase Functions + Genkit/Vertex).

No es una especificacion de producto. Es una **documentacion tecnica del flujo real implementado**.

## 2. Alcance y contexto

Este documento cubre:

- Pantalla `AiBusinessSeeding` en frontend
- Orquestacion de chat/acciones en `useAiChat`
- Callables de Firebase para `analyze` y `execute`
- Flow de Genkit/Vertex para analisis
- Ejecucion de la accion `create_business`

Este documento **no** cubre como flujo principal:

- `aiCreateBusinessAgent` (flujo legacy/draft de sugerencias)

## 3. Resumen ejecutivo

El agente funciona en **2 fases**:

1. `analyze`
2. `execute`

La IA **no ejecuta directamente** al analizar. En `analyze` solo:

- decide la accion (`chat` o `create_business`)
- devuelve un payload estructurado (`data`)

Luego el usuario confirma y se llama `execute`, donde se ejecuta la accion (real o simulada).

### Punto importante

Aunque existen endpoints separados:

- `aiBusinessSeedingAgentAnalyze`
- `aiBusinessSeedingAgentExecute`

el frontend actualmente llama el endpoint **unificado**:

- `aiBusinessSeedingAgent`

enviando `operation: 'analyze' | 'execute'`.

## 4. Mapa de componentes

### Frontend (UI / estado)

- Pagina: `src/modules/dev/pages/dev/AiBusinessSeeding/AiBusinessSeeding.tsx`
- Hook orquestador: `src/modules/dev/pages/dev/AiBusinessSeeding/hooks/useAiChat.ts`
- Catalogo de acciones: `src/modules/dev/pages/dev/AiBusinessSeeding/aiActions.ts`
- Accion `chat`: `src/modules/dev/pages/dev/AiBusinessSeeding/modules/chat.tsx`
- Accion `create_business`: `src/modules/dev/pages/dev/AiBusinessSeeding/modules/createBusiness.tsx`
- Tipos: `src/modules/dev/pages/dev/AiBusinessSeeding/types.ts`

### Frontend (API wrappers)

- Analyze wrapper: `src/modules/dev/pages/dev/AiBusinessSeeding/api/fbAiBusinessSeedingAgentAnalyze.ts`
- Execute wrapper: `src/modules/dev/pages/dev/AiBusinessSeeding/api/fbAiBusinessSeedingAgentExecute.ts`
- Seeding directo de negocio+usuarios (usado por acciones): `src/modules/dev/pages/dev/AiBusinessSeeding/api/fbSeedBusinessWithUsers.ts`

### Backend (Firebase Functions / AI)

- Export de funciones AI: `functions/src/index.js`
- Dispatcher unificado: `functions/src/app/modules/ai/functions/aiBusinessSeedingAgent.js`
- Analyze endpoint: `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentAnalyze.js`
- Execute endpoint: `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js`
- Flow Genkit de analisis: `functions/src/app/modules/ai/flows/aiBusinessSeedingAnalyze.flow.js`
- System prompt builder: `functions/src/app/modules/ai/utils/aiBusinessSeedingSystemPrompt.js`
- Config Genkit + Vertex: `functions/src/app/modules/ai/config/genkit.js`

## 5. Flujo end-to-end (paso a paso)

## 5.1 Fase `analyze` (la IA decide accion + payload)

### Paso 1. Usuario envia prompt

Desde `AiBusinessSeeding.tsx` se invoca `handleAnalyze` del hook `useAiChat`.

Referencias:

- `src/modules/dev/pages/dev/AiBusinessSeeding/AiBusinessSeeding.tsx:450`
- `src/modules/dev/pages/dev/AiBusinessSeeding/hooks/useAiChat.ts:104`

### Paso 2. `useAiChat` prepara estado

El hook:

- valida el prompt
- archiva el turno anterior (`historyTurns`)
- limpia estado actual de ejecucion
- cambia `agentPhase` a `analyzing`
- agrega logs locales de progreso

Referencias:

- `src/modules/dev/pages/dev/AiBusinessSeeding/hooks/useAiChat.ts:38` (estado `agentPhase`)
- `src/modules/dev/pages/dev/AiBusinessSeeding/hooks/useAiChat.ts:68` (`archiveCurrentTurn`)
- `src/modules/dev/pages/dev/AiBusinessSeeding/hooks/useAiChat.ts:104` (`handleAnalyze`)

### Paso 3. Frontend llama callable unificado

Wrapper frontend:

- `httpsCallable(functions, 'aiBusinessSeedingAgent')`

Payload:

```ts
{
  operation: 'analyze',
  prompt: string,
  enabledActions?: string[]
}
```

Referencias:

- `src/modules/dev/pages/dev/AiBusinessSeeding/api/fbAiBusinessSeedingAgentAnalyze.ts:18`
- `src/modules/dev/pages/dev/AiBusinessSeeding/api/fbAiBusinessSeedingAgentAnalyze.ts:26`
- `src/modules/dev/pages/dev/AiBusinessSeeding/api/fbAiBusinessSeedingAgentAnalyze.ts:27`

### Paso 4. Dispatcher backend enruta por `operation`

`aiBusinessSeedingAgent` (callable unificado) lee:

- `payload.operation`
- fallback `payload.op`
- default `analyze`

y delega al endpoint correspondiente.

Referencias:

- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgent.js:14`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgent.js:23`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgent.js:24`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgent.js:26`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgent.js:33`

### Paso 5. Analyze endpoint valida input

`aiBusinessSeedingAgentAnalyze`:

- valida `prompt`
- sanitiza `enabledActions` (lista de acciones permitidas)

Referencias:

- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentAnalyze.js:16`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentAnalyze.js:25`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentAnalyze.js:26`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentAnalyze.js:28`

### Paso 6. Genkit/Vertex analiza el prompt

El endpoint ejecuta:

- `aiBusinessSeedingAnalyzeFlow.run({ prompt, enabledActions }, ...)`

El flow llama `ai.generate(...)` usando:

- modelo Vertex (`businessCreatorModel`)
- system prompt construido dinamicamente segun `enabledActions`
- `temperature` baja (flujo estructurado)

Referencias:

- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentAnalyze.js:33`
- `functions/src/app/modules/ai/flows/aiBusinessSeedingAnalyze.flow.js:15`
- `functions/src/app/modules/ai/flows/aiBusinessSeedingAnalyze.flow.js:22`
- `functions/src/app/modules/ai/flows/aiBusinessSeedingAnalyze.flow.js:24`
- `functions/src/app/modules/ai/utils/aiBusinessSeedingSystemPrompt.js:51`
- `functions/src/app/modules/ai/config/genkit.js:13`
- `functions/src/app/modules/ai/config/genkit.js:32`

### Paso 7. Extraccion de JSON

El flow obtiene texto de la IA y extrae un bloque JSON con regex.

Retorna:

```ts
{ rawJson: string }
```

Referencias:

- `functions/src/app/modules/ai/flows/aiBusinessSeedingAnalyze.flow.js:33`
- `functions/src/app/modules/ai/flows/aiBusinessSeedingAnalyze.flow.js:35`
- `functions/src/app/modules/ai/flows/aiBusinessSeedingAnalyze.flow.js:39`

### Paso 8. Parseo del JSON y respuesta al frontend

El endpoint:

- parsea `rawJson` con `JSON.parse`
- responde con:

```ts
{
  ok: true,
  action: string,
  data: unknown,
  rawJson: string
}
```

Referencias:

- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentAnalyze.js:42`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentAnalyze.js:45`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentAnalyze.js:58`

### Paso 9. Frontend activa la accion y muestra preview

El hook `useAiChat`:

- busca la accion en `ACTIONS`
- guarda `activeAction` y `actionData`
- cambia `agentPhase` a `ready`

La pagina renderiza el `PreviewComponent` de la accion.

Referencias:

- `src/modules/dev/pages/dev/AiBusinessSeeding/aiActions.ts:10`
- `src/modules/dev/pages/dev/AiBusinessSeeding/AiBusinessSeeding.tsx:331`
- `src/modules/dev/pages/dev/AiBusinessSeeding/AiBusinessSeeding.tsx:369`

## 5.2 Fase `execute` (la accion se ejecuta)

### Paso 1. Usuario confirma ejecucion

Desde el preview del turno actual se llama `handleExecute`.

Referencias:

- `src/modules/dev/pages/dev/AiBusinessSeeding/AiBusinessSeeding.tsx:331`
- `src/modules/dev/pages/dev/AiBusinessSeeding/hooks/useAiChat.ts:171`

### Paso 2. `useAiChat` cambia a `executing`

El hook valida que existan:

- `activeAction`
- `actionData`

Luego:

- agrega logs de progreso
- cambia `agentPhase` a `executing`

Referencia:

- `src/modules/dev/pages/dev/AiBusinessSeeding/hooks/useAiChat.ts:171`

### Paso 3. Frontend llama `aiBusinessSeedingAgent` con `operation: 'execute'`

El wrapper agrega:

- `actionId`
- `actionData`
- `isTestMode`
- `sessionToken` (si existe en sesion local)

Referencias:

- `src/modules/dev/pages/dev/AiBusinessSeeding/api/fbAiBusinessSeedingAgentExecute.ts:23`
- `src/modules/dev/pages/dev/AiBusinessSeeding/api/fbAiBusinessSeedingAgentExecute.ts:37`
- `src/modules/dev/pages/dev/AiBusinessSeeding/api/fbAiBusinessSeedingAgentExecute.ts:39`
- `src/modules/dev/pages/dev/AiBusinessSeeding/api/fbAiBusinessSeedingAgentExecute.ts:43`

### Paso 4. Dispatcher backend delega a execute

El endpoint unificado detecta `operation === 'execute'` y enruta al dispatcher de ejecucion.

Referencia:

- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgent.js:33`

### Paso 5. `aiBusinessSeedingAgentExecute` valida y enruta por accion

`aiBusinessSeedingAgentExecute`:

- valida `actionId`
- lee `isTestMode`
- ejecuta segun `actionId`

Soporta:

- `chat`
- `create_business`

Referencias:

- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:171`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:180`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:182`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:184`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:188`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:197`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:205`

### Paso 6. Ejecucion por tipo de accion

#### Caso `chat`

No hay side effects de backend. Devuelve respuesta directa con `data`.

#### Caso `create_business`

Se ejecuta `runCreateBusinessExecution(...)` y se hace:

- validacion de negocio y usuarios
- normalizacion de roles
- validacion de owner unico
- normalizacion de passwords
- modo test (simulado) o modo real

Referencias:

- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:92`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:103`

### Paso 7. Modo real (`create_business`)

En modo real:

- exige `sessionToken`
- reutiliza `clientSeedBusinessWithUsers.run(...)`
- espera `businessId` valido
- retorna logs + resultado final

Referencias:

- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:112`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:113`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:121`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:128`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:150`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:160`

### Paso 8. Frontend recibe logs + resultado y cierra el turno

El hook:

- concatena logs backend con logs UI
- actualiza `actionData`
- marca `executionSuccess`
- cambia `agentPhase` a `completed`
- renderiza `ResultComponent`

Referencias:

- `src/modules/dev/pages/dev/AiBusinessSeeding/hooks/useAiChat.ts:171`
- `src/modules/dev/pages/dev/AiBusinessSeeding/AiBusinessSeeding.tsx:432`
- `src/modules/dev/pages/dev/AiBusinessSeeding/AiBusinessSeeding.tsx:433`

## 6. Maquina de estados del frontend (`agentPhase`)

Estados usados por `useAiChat`:

- `idle`: sin operacion en curso
- `analyzing`: esperando respuesta de IA (fase de analisis)
- `ready`: ya hay accion + payload listos para preview
- `executing`: accion en ejecucion
- `completed`: ejecucion exitosa
- `error`: fallo en analyze o execute

Referencia:

- `src/modules/dev/pages/dev/AiBusinessSeeding/hooks/useAiChat.ts:38`

## 7. Acciones soportadas hoy

## 7.1 `chat`

- Definicion: `src/modules/dev/pages/dev/AiBusinessSeeding/modules/chat.tsx:23`
- `id: 'chat'`: `src/modules/dev/pages/dev/AiBusinessSeeding/modules/chat.tsx:24`

Uso:

- Respuesta conversacional
- Sin side effects reales en backend

## 7.2 `create_business`

- Definicion: `src/modules/dev/pages/dev/AiBusinessSeeding/modules/createBusiness.tsx:72`
- `id: 'create_business'`: `src/modules/dev/pages/dev/AiBusinessSeeding/modules/createBusiness.tsx:73`

Uso:

- Generar preview de negocio + usuarios
- Validar datos antes de crear
- Simular o crear negocio real con usuarios

## 7.3 Catalogo de acciones

- `ACTIONS`: `src/modules/dev/pages/dev/AiBusinessSeeding/aiActions.ts:10`

Nota:

- El frontend tambien tiene `getSystemPrompt(...)` local en `aiActions.ts`, pero el analisis actual usa el prompt de backend (`aiBusinessSeedingSystemPrompt.js`).

## 8. Contratos de request/response (resumen)

## 8.1 Analyze request (frontend -> callable)

```ts
{
  operation: 'analyze',
  prompt: string,
  enabledActions?: string[]
}
```

## 8.2 Analyze response

```ts
{
  ok: true,
  action: 'chat' | 'create_business',
  data: unknown,
  rawJson: string
}
```

## 8.3 Execute request

```ts
{
  operation: 'execute',
  actionId: string,
  actionData: unknown,
  isTestMode: boolean,
  sessionToken?: string
}
```

## 8.4 Execute response

```ts
{
  ok: true,
  action: string,
  logs: Array<{
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp?: string;
  }>,
  data: unknown
}
```

## 9. Modo test vs modo real

`isTestMode` permite ejecutar la accion sin crear entidades reales.

### Modo test

- simula pasos de backend
- retorna logs simulados
- genera IDs simulados

### Modo real

- requiere `sessionToken`
- ejecuta creacion real reutilizando `clientSeedBusinessWithUsers.run(...)`

## 10. Seguridad y autorizacion (flujo actual)

Puntos relevantes:

- El execute de `create_business` en backend exige `sessionToken` en modo real
- El backend reutiliza logica existente (`clientSeedBusinessWithUsers.run`) en vez de duplicarla

Esto ayuda a reducir divergencias entre:

- creacion manual tradicional
- creacion via agente

Referencias:

- `src/modules/dev/pages/dev/AiBusinessSeeding/api/fbAiBusinessSeedingAgentExecute.ts:37`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:112`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:121`

## 11. Logs y observabilidad (lo que ve el usuario)

La UI muestra logs en el turno de conversacion combinando:

1. Logs del frontend (progreso del flujo)
2. Logs del backend devueltos en `execute`

Esto permite visualizar:

- analisis en curso
- ejecucion en curso
- errores de forma amigable (si el handler de UI los traduce)

## 12. Manejo de errores (actual)

### Analyze

Errores comunes:

- `prompt` vacio -> `invalid-argument`
- JSON invalido devuelto por la IA -> `internal`
- fallo en Genkit/Vertex -> `internal`

Referencias:

- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentAnalyze.js:28`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentAnalyze.js:51`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentAnalyze.js:63`

### Execute

Errores comunes:

- `actionId` faltante -> `invalid-argument`
- accion no soportada -> `invalid-argument`
- payload invalido / owner incorrecto / usuarios invalidos -> `invalid-argument`
- fallo interno de seeding -> `internal`

Referencias:

- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:184`
- `functions/src/app/modules/ai/functions/aiBusinessSeedingAgentExecute.js:205`

### Frontend

`useAiChat` captura errores de ambas fases y mueve `agentPhase` a `error`, dejando trazas en los logs del turno.

## 13. Historial de conversacion (importante)

El historial (`historyTurns`) es **estado local** de la pagina:

- no se persiste en Firestore
- no se persiste en la sesion del servidor
- se reinicia al recargar la pagina

Referencia:

- `src/modules/dev/pages/dev/AiBusinessSeeding/hooks/useAiChat.ts` (estado local e `archiveCurrentTurn`)

## 14. Diferencia con el flujo legacy `aiCreateBusinessAgent`

Existe otro flujo AI distinto:

- `functions/src/app/modules/ai/functions/aiCreateBusinessAgent.js`
- `functions/src/app/modules/ai/flows/businessCreator.flow.js`

Ese flujo:

- genera un **draft/sugerencia** (`suggestedBusiness`)
- responde en modo `draft`
- no usa el pipeline `analyze -> execute` del agente de chat

Referencias:

- `functions/src/app/modules/ai/functions/aiCreateBusinessAgent.js:12`
- `functions/src/app/modules/ai/functions/aiCreateBusinessAgent.js:32`
- `functions/src/app/modules/ai/functions/aiCreateBusinessAgent.js:47`
- `functions/src/app/modules/ai/functions/aiCreateBusinessAgent.js:54`
- `functions/src/app/modules/ai/functions/aiCreateBusinessAgent.js:56`
- `functions/src/app/modules/ai/flows/businessCreator.flow.js:32`

## 15. Como extender el agente (guia rapida)

Para agregar una accion nueva, normalmente hay que tocar:

1. Frontend (accion)
   - crear `modules/<accion>.tsx` con `id`, `promptInstruction`, `PreviewComponent`, `ResultComponent`
2. Frontend (catalogo)
   - registrar la accion en `ACTIONS` (`aiActions.ts`)
3. Backend (prompt)
   - agregar instrucciones en `aiBusinessSeedingSystemPrompt.js`
4. Backend (execute)
   - soportar `actionId` nuevo en `aiBusinessSeedingAgentExecute.js`
5. Validaciones y logs
   - definir validacion del payload y logs de ejecucion
6. Modo test
   - agregar simulacion si la accion tiene side effects

## 16. Limitaciones y observaciones actuales

- El analisis extrae JSON desde texto libre con regex (puede fallar si el modelo responde mal formateado).
- El historial de conversacion no se persiste.
- Hay endpoints separados (`Analyze`/`Execute`) y un endpoint unificado; el frontend usa el unificado.
- El prompt de analisis efectivo vive en backend, no en el helper local del frontend.

## 17. Relacion con el spec existente

Existe un documento mas orientado a especificacion inicial:

- `docs/specs/ai-business-seeding.md`

Este documento actual (`flow`) complementa ese spec con el **recorrido real implementado**.

