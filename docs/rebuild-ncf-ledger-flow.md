# Flujo `rebuildNcfLedger`

## Objetivo general

`rebuildNcfLedger` es una función `onCall` de Firebase destinada a reconstruir las entradas del ledger de NCF (comprobantes fiscales) de un negocio. El flujo recorre las facturas almacenadas en `businesses/{businessId}/invoices`, re-normaliza cada NCF válido y sincroniza la colección `ncfLedger`, con opción de borrar previamente los prefijos y de ejecutar en modo simulación (`dryRun`).

## Entradas admitidas

- `businessId` _(obligatorio)_: puede llegar en varias rutas del payload (`data.businessId`, `data.business.id`, etc.).
- `userId` _(obligatorio)_: se toma de `data.userId`, `data.user.uid` o del contexto de autenticación.
- `pageSize`: tamaño máximo del lote de lectura. Se normaliza a un entero en el rango `[25, 1000]` con valor por defecto `250`.
- `prefixes`: lista opcional de prefijos NCF a procesar; se normalizan a mayúsculas y se limpian espacios.
- `truncate`: al `true` indica que se deben eliminar las entradas existentes para los prefijos objetivo antes de reconstruir (solo si no es `dryRun`).
- `dryRun`: cuando es `true`, recorre e identifica las entradas que se reconstruirían sin escribir en Firestore.
- `startAfterId`: id de factura a partir de la cual continuar el proceso (para reanudar ejecuciones parciales).

## Control de acceso y validaciones

1. Se extraen `businessId` y `userId`. Si falta alguno, la función lanza `HttpsError('invalid-argument')`.
2. Se obtiene el documento del usuario y se evalúan roles/permisos mediante `evaluateLedgerAccess`. La ausencia de permisos válidos produce `HttpsError('permission-denied')`.
3. Si el usuario no tiene acceso global (`hasGlobalAccess`) y su `businessId` asociado difiere del solicitado, se corta con `permission-denied`.

## Resolución de parámetros de ejecución

- Se registran metadatos de la solicitud (`traceId`, `businessId`, `userId`, opciones) para seguimiento en logs.
- `pageSize` se fuerza a entero y se recorta al rango permitido antes de armar la consulta.
- `prefixes` pasa por `normalizePrefixes` para descartar entradas vacías o inválidas.

## Limpieza opcional del ledger

Cuando `truncate` es `true` y `dryRun` es `false`, se invoca `wipeLedgerPrefixes`, que borra recursivamente los documentos de `ncfLedger` para los prefijos solicitados (o todos si no se especifican). Se registra el total de prefijos eliminados.

## Consulta de facturas y paginación

- Se construye una referencia a `businesses/{businessId}/invoices`, ordenada por `documentId` para paginar de forma determinista.
- Si se especifica `startAfterId`, la consulta comienza después de ese documento.
- Tras cada lote recuperado (`pageSize` documentos como máximo), se actualiza la consulta con el último `documentId` procesado para iterar hasta agotar la colección.

## Procesamiento por factura

Por cada factura del lote:

1. Se incrementan contadores (`processed`, `lastDocId`) y se extraen datos clave con `extractInvoiceDataFromSnapshot`.
2. Si la factura no tiene NCF (`invoiceData.ncf` vacío) se incrementa `emptyNcf` y se omite.
3. Se genera la representación canónica (`prefix`, `normalizedDigits`, etc.) usando `canonicalizeInvoice`. Cuando falla la canonicalización, la factura se marca como `skipped`.
4. Si se proporcionaron `prefixes` y el prefijo de la factura no está en la lista, se incrementa `skipped`.
5. En modo `dryRun` solo se contabiliza `written` sin tocar Firestore.
6. En modo normal se invoca `rebuildLedgerForInvoice`, que upserta el registro en `ncfLedger` usando `upsertLedgerEntry` para asegurar metadatos y facturas activas.

Cada lote genera un log de resumen con el estado acumulado (`processed`, `written`, `skipped`, `emptyNcf`, `lastDocId`).

## Manejo de errores y retorno

- Cualquier excepción en la lectura o escritura se captura, se registra con severidad `error` y se responde con `HttpsError('internal')`.
- Al finalizar exitosamente, se escribe un log `rebuildNcfLedger finished` con totales y opciones efectivamente aplicadas (`truncateApplied`, `pageSize`, `prefixes`, `dryRun`).
- La respuesta al cliente incluye: `status` (`rebuilt` o `dry-run`), `businessId`, contadores (`processed`, `written`, `skipped`, `emptyNcf`), `lastDocId`, `pageSize`, `truncateApplied` y la lista de prefijos usada.

## Servicios y utilidades relacionadas

- `extractInvoiceDataFromSnapshot`: normaliza la estructura de la factura y obtiene NCF, estado, totales y fechas.
- `canonicalizeInvoice` / `canonicalizeNcf`: separan prefijo y parte numérica del comprobante, calculan longitudes y secuencias para indexar en el ledger.
- `rebuildLedgerForInvoice`: delega la escritura en `ncfLedger`, manejando duplicados y metadatos.
- `wipeLedgerPrefixes`: borra prefijos completos usando `recursiveDelete`, útil para reinicializar el ledger.
- `normalizePrefixes`: estandariza la lista de prefijos solicitados.

## Consideraciones operativas

- `startAfterId` permite reanudar ejecuciones largas sin reprocesar facturas ya tratadas.
- El modo `dryRun` es útil para estimar impacto y validar filtros antes de modificar datos.
- La reconstrucción puede generar muchas escrituras; usar `pageSize` moderado para controlar el consumo y el tiempo de ejecución.
- `truncate` elimina completamente los prefijos afectados, por lo que se recomienda combinarlo con filtros de prefijo cuando se necesita reconstruir subconjuntos específicos.
