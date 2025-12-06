# Facturación V2: Diseño Backend con Concurrencia y Rollback

## 📋 Contexto

El flujo actual de facturación vive en el frontend. Esta propuesta describe la versión V2 basada en backend (HTTP/Cloud Run + Functions) para dotar al proceso de atomicidad, idempotencia y mecanismos de compensación.

## 🎯 Objetivos

- Garantizar atomicidad para NCF, facturas, inventario, cuentas por cobrar y notas de crédito.
- Manejar concurrencia e idempotencia para evitar facturas duplicadas y permitir reintentos seguros.
- Incorporar un patrón de rollback por compensación y observabilidad detallada.
- Mantener compatibilidad con capacidades actuales (modo prueba, preorden).

Fuera de alcance por ahora:

- Cambiar el modelo de datos de factura más allá de los campos mínimos para estado/auditoría.
- Implementar generación/impresión de PDFs en backend.

## ⚙️ Diseño / Arquitectura

Este documento propone una versión V2 del proceso de facturación en backend, inspirada en el flujo actual del frontend pero con garantías de atomicidad, idempotencia, concurrencia segura y posibilidad de rollback por compensación.

### Arquitectura de Alto Nivel

- Entrada HTTP (Cloud Run/Express) o Callable Cloud Function: `POST /v2/invoices`
- Transacciones + Outbox Pattern para efectos secundarios.
- Disparadores backend (Functions background) para procesar outbox idempotente.
- Almacenamiento: Firestore (transacciones multi-documento), subcolecciones para outbox/audit.

Componentes:

- Servicio de Orquestación de Facturas (`invoiceOrchestrator`): valida y persiste la operación base en estado `pending` dentro de una transacción, emite un `outbox` con tareas.
- Procesador de Outbox (`outboxWorker`): ejecuta efectos (inventario, AR, notas de crédito, cerrar preorden) idempotentemente y marca progreso.
- Servicio NCF (`ncfService`): reserva/consume con control de versiones.
- Idempotency Store: tabla/colección para claves de idempotencia.
- Lock/Lease opcional para preorden o escenarios críticos.

### Estados de la Factura

- `pending`: creada base de factura y outbox generado, aún sin efectos confirmados.
- `committing`: procesando outbox.
- `committed`: todos los efectos aplicados correctamente.
- `failed`: fallo no recuperable; se aplican compensaciones.
- `voided` (opcional): factura anulada por compensación total.

### Contrato de API

- Método: `POST /v2/invoices`
- Header: `Idempotency-Key` (obligatorio, único por operación de checkout)
- Body:
  - `userId`, `businessId`
  - `cart`: productos, totales, pagos, `isAddedToReceivables`, `creditNotePayment`, etc. (los productos deben enviar `productStockId`/`batchId` en `null` cuando no exista relación real para que Firestore no reciba `undefined`)
  - `client`: `{ id, name, ... }`
  - `ncf`: `{ enabled: boolean, type: string }`
  - `dueDate`: timestamp ms | null
  - `preorder`: `{ isPreorder: boolean }`
  - `insurance`: `{ enabled, AR, auth }`
  - `testMode`: boolean
  - `invoiceComment`: string
- Respuesta 200:
  - `{ invoiceId, status, invoice, warnings? }`
- Respuesta 202 (opcional):
  - `{ invoiceId, status: 'committing' }` (si se quiere asincronía completa)
- Reintentos con misma `Idempotency-Key` retornan la respuesta persistida de la primera ejecución.

### Flujo Transaccional (sincronía base)

1. Validaciones:

- Carrito válido, cliente (o genérico), reglas de pagos, límites básicos.
- Cash Count abierto (si aplica, no en testMode).

2. Reserva de NCF (si habilitado):

- `ncfService.reserve(ncfType)` dentro de la transacción.
- Marca reserva con versión y TTL (por ejemplo `expiresAt`).

3. Persistencia base (Transacción Firestore):

- Crear doc `invoices/{invoiceId}` con estado `pending` y payload mínimo: `NCF`, `client`, `cart snapshot`, `cashCountId`, `dueDate`, `createdAt`, `idempotencyKey`.
- Crear subcolección `invoices/{invoiceId}/outbox` con tareas: `updateInventory`, `setupAR`, `consumeCreditNotes`, `closePreorder` (según aplique).
- Registrar `idempotencyKey -> invoiceId` en `idempotency/{key}`.

4. Procesamiento de Outbox (worker asíncrono):

- Marca `committing` y ejecuta tareas en orden con idempotencia (cada tarea mantiene su propio `taskStatus` y `attempts`).
- Efectos por tarea:
  - Inventario: decremento por producto con verificación de stock; idempotente por `invoiceId`.
  - CxC: crear AR + cuotas; idempotente por `invoiceId`.
  - Notas de crédito: consumir y registrar aplicaciones; idempotente por `invoiceId`.
  - Preorden: marcar como facturada/convertida.
- Si todo ok → marcar factura `committed` y `ncfService.consume(reservationId)`.

5. Errores y Compensación (Saga):

- Si una tarea falla de forma permanente:
  - Ejecutar compensaciones en orden inverso a lo aplicado:
    - Preorden: revertir estado si se cambió.
    - Notas de crédito: revertir aplicaciones.
    - CxC: cerrar/eliminar registros creados o marcarlos `voided`.
    - Inventario: reponer cantidades.
    - NCF: liberar reserva (`status: available`) si no se consumió.
  - Marcar factura `failed` o `voided` según el alcance de las compensaciones.

### Concurrencia y Idempotencia

- Idempotency-Key:
  - Requerido en la API. Mapeado a `invoiceId`. Si existe, se retorna respuesta previa.
  - Útil para doble click, reintentos de red, múltiples dispositivos usando la misma sesión.
- Optimistic Concurrency (NCF):
  - Reserva y consumo con `version` (campo incrementado) o uso de `update with precondition` para asegurar exclusividad.
- Lock leve (opcional):
  - Para casos extremos, doc `locks/{hash(cart)}` con lease TTL (e.g., 30s) adquirido antes de crear la factura. Libera al finalizar.
- Evitar duplicados por cart hash:
  - Guardar `cartHash` en la factura; crear índice único lógico que el worker verifique antes de aplicar efectos.

### Modo Prueba

- Atajo en orquestador: si `testMode`, no se persiste nada en BD.
- Se genera un mock de `invoice` con NCF `TEST-*` y se retorna `committed` virtual.
- Se loguea la operación con fines de auditoría si se desea.

### Seguridad

- Autenticación y autorización por rol (cajero, admin) y `businessId`.
- Validar `cashCount` abierto para ventas reales.
- Firestore Rules: solo backend escribe `committed`, `failed` y outbox; clientes solo leen.
- Sanitizar entrada y validar totales/calculos en backend (no confiar en el front).

### Observabilidad y Auditoría

- `invoices/{id}/audit`: entradas por paso, timestamp, actor y resultado.
- Métricas por etapa, duración de transacción, reintentos del outbox.
- Trazas correlacionadas por `invoiceId` y `idempotencyKey`.

### Esquema de Outbox (sugerido)

- Doc: `invoices/{invoiceId}/outbox/{taskId}`
  - `type`: `updateInventory | setupAR | consumeCreditNotes | closePreorder`
  - `status`: `pending | done | failed`
  - `attempts`: number
  - `payload`: datos necesarios
  - `lastError`: string

### Pseudocódigo (Orquestador)

```
POST /v2/invoices (Idempotency-Key: k)
  if exists idempotency[k]: return stored response

  if testMode:
    return mockInvoice()

  in transaction:
    validateCart(cart)
    cashCount = requireOpenCashCount(user)
    ncfRes = ncf.enabled ? ncf.reserve(type) : null

    invoiceId = newId()
    write invoices/{invoiceId} { status: 'pending', snapshot, ncfRes, cashCountId, idempotencyKey }
    write outbox tasks under invoices/{invoiceId}/outbox
    write idempotency/{k} -> { invoiceId }

  enqueue outboxWorker(invoiceId)
  return { invoiceId, status: 'committing' | 'pending' }
```

### Pseudocódigo (Outbox Worker)

```
process(invoiceId):
  mark invoice.status = 'committing'
  for task in ordered(outbox):
    if task.status == 'done': continue
    try:
      run(task) // each task idempotent by invoiceId
      mark task.status = 'done'
    catch (e):
      if retryable(e) and attempts < N: backoff and retry
      else:
        compensate(doneTasks)
        mark invoice.status = 'failed'
        ncf.releaseIfReserved()
        return
  ncf.consumeReservation()
  mark invoice.status = 'committed'
```

### Plan de Implementación (fases)

1. Endpoint + Idempotencia

- Crear `POST /v2/invoices` con validaciones mínimas y `Idempotency-Key` persistida.
- Retornar `pending` con `invoiceId`.

2. Reserva NCF + Estados de Factura

- Transacción para crear factura `pending` + `ncf.reserve`.
- Añadir campos `status`, `idempotencyKey`, `audit` básico.

3. Outbox + Worker (Inventario primero)

- Implementar outbox y worker con una sola tarea: `updateInventory`.
- Idempotencia por `invoiceId` y locks por producto si aplica.

4. AR y Notas de Crédito

- Añadir tareas `setupAR` y `consumeCreditNotes` con idempotencia.

5. Preorden y Consumo NCF

- Añadir `closePreorder` y `ncf.consume` al final del worker.

6. Compensaciones + Retries

- Implementar compensaciones y política de reintentos exponenciales.

7. Seguridad + Reglas + Observabilidad

- Endurecer reglas de Firestore, métricas y auditoría.

8. Integración Frontend

- `InvoicePanel` llama al endpoint con `Idempotency-Key`.
- Polling o suscripción al `invoice.status` para imprimir solo cuando `committed`.

### Migración desde V1

- Bandera de característica (`billing.invoiceServiceVersion = 'v2'`).
- Ejecutar en modo prueba con tiendas piloto.
- Migración por etapas del frontend al endpoint V2.

---

## 📈 Impacto / Trade-offs

- 👍 Aporta garantías transaccionales y observabilidad, reduciendo incidencias de facturas duplicadas o parciales.
- 👍 Permite escalar horizontalmente al separar orquestación y efectos (outbox worker).
- ⚠️ Incrementa la complejidad operativa (workers, colas, compensaciones) y requiere monitoreo estricto.
- ⚠️ La migración debe ser gradual para evitar interrumpir ventas mientras conviven V1 y V2.

## 🔜 Seguimiento / Próximos pasos

- Completar la fase 1 del plan (endpoint + idempotencia) y liberar pruebas internas.
- Diseñar el catálogo de tareas del outbox y definir contratos de idempotencia/compensación para cada una.
- Preparar dashboards de métricas (duración transacción, reintentos por tarea, reservas NCF activas).

Este diseño prioriza robustez e idempotencia, eliminando las condiciones de carrera que hoy pueden ocurrir cuando se disparan varias facturas simultáneamente desde distintos dispositivos o reenvíos de red.
