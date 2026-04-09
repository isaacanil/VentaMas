# Solicitud de Revision Senior

## Tema

Definir la fuente de verdad correcta para el catalogo de campos de suscripciones.

## Contexto actual

En el modulo de mantenimiento de suscripciones existe un modal "Catalogo de campos" que permite administrar los campos disponibles para:

- limites
- modulos
- add-ons

Hoy ese catalogo participa en dos capas:

1. Firestore
   Ruta actual: `billingConfig/subscriptionFieldCatalog`

2. Frontend
   Archivo principal: `src/modules/settings/pages/subscription/subscriptionFieldCatalog.ts`

Ademas, el hook `src/modules/settings/pages/subscription/useSubscriptionFieldCatalog.ts`:

- lee el documento desde Firestore con `onSnapshot`
- si el documento no existe, siembra el catalogo por defecto
- normaliza el documento entrante usando el catalogo hardcodeado del frontend
- permite guardar cambios nuevamente en Firestore

## Estado verificado

Se verifico manualmente que el documento `billingConfig/subscriptionFieldCatalog` ya existe y esta completo.

Conteo actual:

- `limits`: 8
- `modules`: 13
- `addons`: 4

No faltan keys respecto al catalogo canónico del codigo actual.

## Problema de arquitectura

Aunque Firestore ya contiene el catalogo, el sistema actual sigue teniendo una segunda definicion material en codigo:

- labels
- tipos
- orden
- allowUnlimited
- lista completa de keys por seccion

Eso provoca que, en la practica, tengamos una arquitectura hibrida:

- Firestore parece ser editable y persistente
- el frontend sigue actuando como fallback, validador y catalogo base completo

## Riesgos detectados

1. Doble fuente de verdad efectiva
   Si cambia Firestore pero el codigo no se actualiza, o viceversa, el comportamiento puede quedar mezclado.

2. Obsolescencia silenciosa
   El frontend puede seguir completando o normalizando datos con defaults viejos sin que el equipo lo note.

3. Acoplamiento innecesario
   Un catalogo supuestamente dinamico sigue dependiendo de despliegues de frontend para cambios estructurales relevantes.

4. Ambiguedad operativa
   No queda claro si el lugar correcto para administrar el catalogo es:
   Firebase Console, la UI dev, o el archivo TypeScript.

## Decision que necesitamos

Necesitamos validar cual de estas opciones es la correcta:

### Opcion A: Firestore como unica fuente de verdad

El catalogo vive solo en `billingConfig/subscriptionFieldCatalog`.

El codigo:

- solo lee
- valida forma minima
- reporta error si la configuracion esta incompleta o corrupta
- no reconstruye ni mezcla con un catalogo completo hardcodeado

Ventaja:
Se alinea con la existencia del modal editable y evita duplicacion de datos.

Costo:
Requiere manejar mejor errores de configuracion y semilla inicial.

### Opcion B: Codigo como unica fuente de verdad

Se elimina el catalogo editable en Firestore o se deja solo como cache derivada.

Ventaja:
Maximo control por git, revision y deploy.

Costo:
El modal "Catalogo de campos" pierde casi todo su valor como configuracion dinamica.

### Opcion C: Modelo hibrido controlado

Firestore contiene solo configuracion operativa mutable, pero el contrato estructural vive en codigo.

Por ejemplo:

- codigo define keys permitidas y tipos
- Firestore solo define orden, labels, visibilidad, descripciones

Ventaja:
Reduce riesgo estructural.

Costo:
Sigue habiendo dos capas y hay que dejar el contrato extremadamente claro.

## Mi lectura tecnica provisional

Con el estado actual del producto, la opcion mas coherente parece ser la A o una C muy estricta.

Motivo:

- ya existe UI para administrar el catalogo
- ya existe persistencia en Firestore
- ya existe consumo realtime del documento

Por tanto, mantener un catalogo completo duplicado en frontend parece complejidad accidental.

## Preguntas para revision senior

1. En este caso, cual deberia ser la fuente de verdad oficial: Firestore, codigo, o un modelo hibrido?
2. Si se elige Firestore como fuente principal, debemos eliminar por completo `DEFAULT_SUBSCRIPTION_FIELD_CATALOG` o dejar un fallback tecnico minimo?
3. Si se deja fallback, donde trazamos la linea para no volver a caer en doble fuente de verdad?
4. El sistema deberia fallar de forma visible cuando el documento este incompleto, o autocorregirlo?
5. Conviene mover la semilla inicial fuera del frontend y hacerla con script/admin setup?

## Objetivo de la revision

Salir con una decision explicita de arquitectura antes de refactorizar, para evitar:

- seguir mezclando responsabilidades
- consolidar una fuente de verdad incorrecta
- introducir mas deuda alrededor del catalogo de suscripciones

## Respuesta de revision recibida

### Decision recomendada

La recomendacion recibida es adoptar la **Opcion C: modelo hibrido controlado**.

### Justificacion principal

No conviene usar Firestore como unica fuente de verdad del catalogo estructural porque el frontend y la logica de producto necesitan conocer las keys reales que el sistema soporta.

Ejemplo:

Si en Firestore aparece un modulo nuevo como `integracion_whatsapp`, el frontend puede renderizarlo como texto, pero el sistema no tendra necesariamente logica implementada para ejecutarlo, validarlo o aplicarlo en el producto.

Por tanto, el sistema debe separar dos responsabilidades:

- **Codigo TypeScript**: dueno del contrato estructural y de la logica del sistema.
- **Firestore**: dueno de la presentacion y de reglas operativas configurables.

### Reparto de responsabilidades sugerido

#### Codigo

Debe definir:

- que keys existen realmente en el sistema
- los tipos de campo esperados
- el contrato estructural del catalogo
- la logica que depende de cada key

Ejemplo conceptual:

- `ModuleKey = 'sales' | 'inventory' | 'api'`
- `LimitKey = 'maxUsers' | 'maxProducts' | ...`

#### Firestore

Debe definir solo configuracion mutable como:

- `label`
- `order`
- `isActive`
- `allowUnlimited`
- `description`
- otras propiedades de presentacion o habilitacion administrativa

### Linea de corte recomendada

Se debe eliminar el comportamiento actual de mezclar o normalizar automaticamente el catalogo completo en frontend usando un `DEFAULT_SUBSCRIPTION_FIELD_CATALOG` como respaldo estructural activo.

La linea recomendada es esta:

- el frontend lee Firestore
- si Firestore cambia un `label`, se muestra ese `label`
- si Firestore incluye una key desconocida para TypeScript, se ignora silenciosamente
- si Firestore omite una key conocida, no se muestra en UI

Eso implica que Firestore puede controlar visibilidad y presentacion, pero no inventar capacidades nuevas del sistema.

### Criterio sobre fallback

El `DEFAULT_SUBSCRIPTION_FIELD_CATALOG` no debe participar en el flujo normal de lectura como mecanismo de mezcla o reconstruccion automatica del catalogo remoto.

Si se conserva algo en codigo, debe ser como contrato estructural y validacion, no como una segunda base de datos embebida.

### Criterio sobre autocorreccion

La recomendacion recibida es clara:

- **no autocorregir ni reescribir Firestore durante la lectura**
- el frontend debe ser un consumidor pasivo de esta configuracion

### Riesgo que se busca evitar

Autocorregir en `onSnapshot` o durante la lectura puede provocar que una version vieja del frontend vuelva a escribir configuraciones antiguas y deteriore el catalogo compartido para todos los usuarios.

### Implicacion practica

La arquitectura objetivo ya no seria:

- codigo + Firestore con mezcla bidireccional

Sino:

- codigo como contrato estructural
- Firestore como configuracion operativa y de presentacion
- frontend como consumidor pasivo del documento

## Punto aun pendiente

Queda abierta una decision operativa adicional:

1. Como sembrar o migrar el documento inicial si ya no queremos que el frontend lo escriba automaticamente.

Opciones a evaluar despues:

- script administrativo manual
- script de migracion versionado
- Cloud Function o tarea interna de setup
