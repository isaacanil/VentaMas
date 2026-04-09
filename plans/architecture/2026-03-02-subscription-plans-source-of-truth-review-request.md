# Solicitud de Revision Senior

## Tema

Definir la fuente de verdad oficial del modulo `/dev/tools/subscription-maintenance/planes`.

## Nota de lectura

Este documento mezcla dos momentos:

- una fotografia inicial del estado auditado antes de los cambios del `2026-03-02`
- una seccion posterior con el estado despues de la implementacion

Por eso aparecen referencias historicas a archivos que ya no existen, como:

- `functions/src/app/versions/v2/billing/config/planCatalogDefaults.js`
- `src/modules/settings/pages/subscription/subscriptionPlanDefaults.ts`

Las referencias operativas vigentes para ese tema quedaron movidas a:

- `functions/src/app/versions/v2/billing/config/planCatalogBootstrapDefaults.js`
- `functions/src/app/versions/v2/billing/services/planCatalog.service.js`

## Pregunta concreta

Hoy los planes de suscripcion estan hardcodeados, persistidos, o mezclados?

## Respuesta corta

La implementacion actual es **hibrida**.

No es correcto decir que todo esta hardcodeado, pero tampoco es correcto decir que Firestore es la unica fuente de verdad.

Hoy conviven dos capas reales:

1. **Firestore**
   - Coleccion: `billingPlanCatalog/{planCode}`
   - Subcoleccion: `billingPlanCatalog/{planCode}/versions/{versionId}`

2. **Defaults hardcodeados del sistema**
   - Backend: `functions/src/app/versions/v2/billing/config/planCatalogDefaults.js`
   - Frontend: `src/modules/settings/pages/subscription/subscriptionPlanDefaults.ts`

## Flujo actual verificado

### 1. Ruta y pagina

La ruta `/dev/tools/subscription-maintenance/planes` renderiza:

- `src/modules/settings/pages/subscription/DeveloperSubscriptionMaintenancePlansPage.tsx`

La ruta esta registrada en:

- `src/router/routes/paths/Dev.tsx`

### 2. Como llega la data al tab de planes

La pagina raiz del modulo developer dispara `loadPlans()` al montar:

- `src/modules/settings/pages/subscription/DeveloperSubscriptionMaintenancePage.tsx`

Ese hook llama:

- `requestDevListPlanCatalog()`

definido en:

- `src/firebase/billing/billingManagement.ts`

Ese callable no lee un archivo local del frontend para poblar la lista. La lista visible del tab sale del backend.

### 3. Que hace el backend

El callable de catalogo termina en:

- `functions/src/app/versions/v2/billing/services/planCatalog.service.js`

La funcion `listPlanCatalog()`:

- lee Firestore en `billingPlanCatalog`
- carga tambien `BILLING_PLAN_DEFAULTS`
- mezcla ambos mundos
- si un plan default no existe en Firestore, igual lo inyecta en el resultado
- si existe el documento base pero no existen versiones, usa tambien el fallback default para ciertos planes

## Evidencia tecnica

### Firestore si participa como fuente principal operativa

El catalogo editable vive en:

- `billingPlanCatalog/{planCode}`
- `billingPlanCatalog/{planCode}/versions/{versionId}`

Eso se ve en `planCatalog.service.js` cuando:

- `listPlanCatalog()` lee `billingPlanCatalog`
- `upsertPlanCatalogDefinition()` guarda la definicion base
- `upsertPlanCatalogVersion()` guarda versiones

### Pero hay fallback hardcodeado real en backend

`BILLING_PLAN_DEFAULTS` define al menos:

- `demo`
- `plus`
- `legacy`

Ese archivo no es decorativo. Hoy influye de verdad en runtime:

1. `listPlanCatalog()` agrega defaults aunque no existan documentos en Firestore.
2. `resolvePlanVersionSnapshot()` devuelve el default si el plan no existe en Firestore.
3. `assertPlanCatalogAssignable()` permite asignar un plan default aunque no tenga documento en Firestore.
4. `assertPlanCatalogDeletable()` impide eliminar por completo un plan que venga de defaults del sistema.

## Conclusion de fuente de verdad

La fuente de verdad actual **no es unica**.

La implementacion efectiva hoy es:

- **Firestore** como catalogo editable y persistente
- **Backend hardcodeado** como fallback estructural y fuente implicita de planes base del sistema

En otras palabras:

- para planes creados por UI, Firestore manda
- para planes base del sistema (`demo`, `plus`, `legacy`), el backend sigue siendo fuente de verdad parcial

## Hardcode adicional en frontend

Ademas del backend, el frontend tambien tiene defaults propios:

### 1. Defaults del editor

`src/modules/settings/pages/subscription/useDeveloperTools.ts`

usa:

- `resolveSubscriptionPlanDefault('plus')`

desde:

- `src/modules/settings/pages/subscription/subscriptionPlanDefaults.ts`

Eso llena por defecto el editor de limites, modules y addons con valores hardcodeados de `plus`.

Importante:

- esto no parece ser la fuente principal para renderizar la lista del tab
- pero si afecta el estado inicial del editor y puede sesgar creacion/edicion si el catalogo real ya divergio

### 2. Fallback de simulaciones

`src/modules/settings/pages/subscription/DeveloperSubscriptionMaintenancePage.tsx`

tiene `FALLBACK_SIMULATED_PLANS` con `demo`, `plus` y `legacy`.

Eso parece mas acotado al sandbox/mock que al catalogo editable, pero sigue duplicando conocimiento de planes en frontend.

## Riesgos detectados

1. **Doble fuente de verdad**
   Firestore parece el catalogo oficial, pero el backend puede reconstruir o suplir planes desde codigo.

2. **Deriva entre frontend y backend**
   `subscriptionPlanDefaults.ts` y `planCatalogDefaults.js` duplican valores parecidos pero en capas distintas.

3. **Ambiguedad operativa**
   No queda claro si para cambiar `plus` o `legacy` el equipo debe:
   - editar Firestore
   - usar la UI dev
   - cambiar codigo y desplegar functions

4. **Planes "inamovibles"**
   Los defaults del sistema no pueden eliminarse completamente desde el panel, lo que confirma que el sistema los trata como builtin.

5. **Editor sesgado**
   Si el editor sigue sembrando desde defaults hardcodeados, puede crear nuevas versiones basadas en una foto vieja del plan en vez del estado real esperado.

## Mi lectura tecnica provisional

Hoy el tab `planes` no esta "100% hardcodeado".

Pero **si depende de hardcodes reales** para el comportamiento del catalogo, sobre todo en backend.

La respuesta correcta para el equipo seria:

> El sistema actual usa un modelo hibrido. Firestore es el catalogo operativo, pero los planes base siguen teniendo soporte hardcodeado en backend, y el frontend todavia conserva defaults locales para edicion y simulacion.

## Decisiones que necesitamos del senior

1. La fuente de verdad oficial para `demo`, `plus` y `legacy` debe seguir viviendo en codigo o debe migrarse completamente a Firestore?
2. Si mantenemos planes builtin en codigo, cual es la linea exacta entre:
   - contrato estructural del sistema
   - configuracion mutable del negocio
3. El editor del frontend debe dejar de usar `subscriptionPlanDefaults.ts` como seed por defecto y leer siempre desde el catalogo remoto?
4. Debemos permitir que un plan builtin exista solo en Firestore, o siempre debe tener representacion en codigo?
5. Cuando Firestore y defaults diverjan, quien gana explicitamente?

## Opciones de arquitectura

### Opcion A: Firestore como unica fuente de verdad

- Todo plan, incluyendo `demo`, `plus` y `legacy`, existe solo en `billingPlanCatalog`.
- El backend deja de inyectar defaults en runtime.
- La semilla inicial se hace por script administrativo o migracion.

Ventaja:

- elimina ambiguedad
- simplifica operacion

Costo:

- requiere migracion y estrategia de bootstrap

### Opcion B: Codigo como fuente de verdad para planes builtin + Firestore para planes custom

- `demo`, `plus`, `legacy` son builtin y viven en codigo
- Firestore solo agrega override limitado o planes nuevos

Ventaja:

- protege planes core del producto

Costo:

- mantiene modelo hibrido
- exige contrato muy claro para evitar confusiones

### Opcion C: Firestore como fuente operativa, codigo solo como bootstrap tecnico

- los defaults existen solo para semilla inicial o recuperacion controlada
- no participan en listados normales si Firestore ya esta poblado
- el frontend no usa seeds estructurales locales para editar

Ventaja:

- reduce deuda sin perder capacidad de recuperacion

Costo:

- requiere separar bien bootstrap de runtime

## Recomendacion provisional

Mi recomendacion provisional es la **Opcion C**, con esta regla:

- **runtime normal**: Firestore manda
- **bootstrap/migracion**: codigo solo inicializa o recupera
- **frontend**: no debe sembrar planes estructurales locales para editar un catalogo que ya existe remotamente

Eso baja complejidad accidental sin obligar a borrar de inmediato toda capacidad de bootstrap.

## Referencias de codigo

- `src/router/routes/paths/Dev.tsx`
- `src/modules/settings/pages/subscription/DeveloperSubscriptionMaintenancePage.tsx`
- `src/modules/settings/pages/subscription/DeveloperSubscriptionMaintenancePlansPage.tsx`
- `src/modules/settings/pages/subscription/useDeveloperTools.ts`
- `src/modules/settings/pages/subscription/subscriptionPlanDefaults.ts`
- `src/firebase/billing/billingManagement.ts`
- `functions/src/app/versions/v2/billing/config/planCatalog.constants.js`
- `functions/src/app/versions/v2/billing/config/planCatalogBootstrapDefaults.js`
- `functions/src/app/versions/v2/billing/services/planCatalog.service.js`

## Estado despues de la implementacion del 2026-03-02

Se aplico la direccion acordada para mover la operacion normal a Firestore como fuente unica de verdad.

### 1. Builtins sembrados en Firestore antes de borrar fallbacks

Se sembraron en el proyecto `ventamaxpos` los planes:

- `demo`
- `plus`
- `legacy`

Cada uno quedo persistido en:

- `billingPlanCatalog/{planCode}`
- `billingPlanCatalog/{planCode}/versions/{versionId}`

con un `currentVersion` real y el flag:

- `isSystemBuiltin: true`

### 2. Bootstrap separado de runtime

El archivo viejo `functions/src/app/versions/v2/billing/config/planCatalogDefaults.js` dejo de existir.

Ahora hay dos capas separadas:

- `functions/src/app/versions/v2/billing/config/planCatalog.constants.js`
  - solo contrato tecnico reutilizable
- `functions/src/app/versions/v2/billing/config/planCatalogBootstrapDefaults.js`
  - defaults exclusivos para bootstrap/siembra

Ademas existe el script:

- `functions/scripts/seedBillingPlanCatalog.js`

para sembrar el catalogo inicial sin mezclarlo con el runtime.

### 3. Runtime sin inyeccion de defaults

`functions/src/app/versions/v2/billing/services/planCatalog.service.js` ya no inyecta defaults hardcodeados en:

- `listPlanCatalog()`
- `resolvePlanVersionSnapshot()`
- `assertPlanCatalogAssignable()`
- `updatePlanCatalogLifecycle()`

Nueva regla:

- si `billingPlanCatalog` no existe o esta vacio, el backend responde con error de precondicion
- no reconstruye planes en memoria

### 4. Frontend sin seeds estructurales locales

Se elimino:

- `src/modules/settings/pages/subscription/subscriptionPlanDefaults.ts`

El editor dev y el sandbox ahora dependen del catalogo real cargado desde backend y muestran advertencias cuando Firestore no tiene planes disponibles.

### 5. Proteccion de builtin basada en Firestore

La proteccion ya no depende de una lista hardcodeada en backend.

Ahora el sistema usa `isSystemBuiltin === true` leido desde Firestore para:

- impedir borrado definitivo del plan builtin
- informar en UI que se trata de un plan del sistema

## Pregunta abierta residual

La arquitectura ya quedo mejor definida, pero queda una decision de producto:

- si `demo`, `plus` y `legacy` deben seguir tratandose como un conjunto cerrado de keys reservadas en codigo
- o si en el futuro hasta esa nocion de builtin debe pasar a configuracion administrable con reglas separadas
