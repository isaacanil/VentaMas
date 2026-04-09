# Plan De Mejora

Fecha: 2026-03-19
Objetivo: corregir la deuda estructural sin intentar "normalizar Firestore como SQL".

## Principio rector
No vamos a pelear contra NoSQL. Vamos a usarlo mejor.

Eso implica:

- una fuente primaria por agregado,
- duplicacion intencional para lectura rapida,
- read models regenerables,
- y menos joins cliente.

## Fase 0. Congelar la deuda activa

### Objetivo
Evitar que el modelo siga divergiendo mientras se corrigen los dominios principales.

### Acciones
- Bloquear nuevas escrituras a rutas legacy raiz: `client`, `creditLimit`, `productOutflow`, `products/6dssod`.
- Documentar en el repo cuales colecciones son canonicas y cuales son espejos.
- Dejar builders de paths por dominio para no seguir dispersando rutas.

### Criterio de salida
- Ninguna feature nueva escribe en rutas legacy.
- Cada dominio tocado en adelante declara autoridad y mirror.

## Fase 1. Hardening minimo

### Objetivo
Cerrar los agujeros que hoy hacen mas fragil cualquier rediseño posterior.

### Acciones
- Endurecer `firestore.rules` por membresia activa y negocio.
- Versionar indices reales en `firestore.indexes.json`.
- Eliminar del cliente la reserva/actualizacion de NCF y dejar solo el flujo server-side.
- Corregir APIs hibridas como `fbGetCreditLimit`.

### Criterio de salida
- No hay writes sensibles desde cliente.
- Las queries compuestas usadas por el sistema quedan declaradas.
- Las reglas dejan de ser globalmente abiertas.

## Fase 2. Declarar las fuentes primarias

### Objetivo
Separar dato canonico de read models y espejos legacy.

### Acciones por dominio

#### Negocio y membresia
- Aplanar `businesses/{id}` para eliminar el nesting `business`.
- Declarar `members/{uid}` como autoridad.
- Degradar `users.accessControl` a cache temporal o iniciar retiro.

#### Billing
- Mantener `billingAccounts/.../subscriptions/...` como fuente primaria.
- Mantener `businesses/{id}.subscription` solo como snapshot de lectura.

#### Facturacion
- Declarar `invoicesV2` como fuente primaria.
- Tratar `invoices` como proyeccion de compatibilidad, no como competidor.

#### Inventario
- Declarar `productsStock` como verdad operativa.
- Dejar `products.stock` y `batches.quantity` como derivados.

### Criterio de salida
- Cada agregado importante tiene una ruta primaria explicita.
- Los espejos quedan etiquetados como regenerables o temporales.

## Fase 3. Reducir joins cliente con read models utiles

### Objetivo
Resolver pantallas caras con documentos orientados a lectura, no con fan-out.

### Candidatos claros
- Lista de usuarios por negocio.
- Vista de cuentas por cobrar con cliente e invoice minimamente embebidos.
- Vista de jerarquia de ubicaciones para UI.
- Resultado de factura listo para frontend sin polling doble.

### Regla
Cada read model debe tener:

- owner de escritura,
- fuente primaria conocida,
- proceso de regeneracion,
- y contrato acotado a una pantalla o use case.

### Criterio de salida
- Las pantallas mas costosas dejan de usar joins por chunks o listeners en cascada.

## Fase 4. Retiro de compatibilidad legacy

### Objetivo
Bajar complejidad accidental y costo operacional.

### Acciones
- Retirar readers tolerantes tipo `raw.data || raw` y `raw.client || raw`.
- Eliminar rutas legacy fuera de tenant.
- Reducir crons de reparacion a reconciliaciones puntuales o diagnostico.
- Revisar si `warehouseStructure` sigue aportando valor medido; si no, retirarlo.

### Criterio de salida
- Menos codigo de compatibilidad silenciosa.
- Menos drift entre dominios.
- Menos procesos que "reparan" el estado de forma periodica.

## Priorizacion recomendada

### Primero
1. Reglas Firestore.
2. Rutas legacy raiz.
3. NCF server-side solamente.
4. Declarar autoridad de membresia.
5. Declarar autoridad de inventario.

### Segundo
1. Resolver dualidad `invoicesV2` / `invoices`.
2. Reducir joins cliente de usuarios y AR.
3. Replantear `warehouseStructure` y listeners jerarquicos.

### Tercero
1. Retiro progresivo de mirrors y normalizadores legacy.
2. Limpieza de APIs y snapshots transitorios.

## Checklist de exito
- El frontend puede leer la mayoria de sus pantallas sin joins por chunks.
- Cada agregado tiene una sola ruta editable.
- Los read models son explicitos y regenerables.
- La duplicacion que quede es util, medible y defendible.
- Las reglas e indices reflejan el modelo real y no un modo desarrollo permanente.
