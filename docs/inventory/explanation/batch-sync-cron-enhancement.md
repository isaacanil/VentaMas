# Mejora: Sincronización de Batches en Cron de Inventario

## 📋 Contexto

El cron `syncProductsStockCron` resuelve discrepancias entre lotes (`batches`) y stocks físicos (`productStock`). Antes, las cantidades se desalineaban y dejaban batches activos sin stock o inactivos con unidades disponibles.

## 🎯 Objetivos

- Detectar automáticamente inconsistencias de estado o cantidad entre batches y productStock.
- Registrar auditoría (motivo, acción, timestamp) cada vez que el cron corrige un lote.
- Exponer métricas y logs suficientes para monitorear el comportamiento nocturno del job.

## ⚙️ Diseño / Arquitectura

### Problema detectado

Cuando hay desincronización entre `batch` y `productStock`, pueden ocurrir inconsistencias:

- **Batch inactivo** (`status: 'inactive'`) pero con **productStocks activos** (`status: 'active'`, `quantity > 0`)
- **Batch activo** (`status: 'active'`) pero **sin productStocks activos** o con `quantity = 0`
- **Cantidad del batch** no coincide con la suma de cantidades en `productStock`

### Consecuencias sin la corrección:

- ❌ Datos inconsistentes en reportes de inventario
- ❌ Batches con cantidades negativas
- ❌ Imposibilidad de vender productos que aparentemente tienen stock
- ❌ Batches inactivos que deberían estar activos

### Solución implementada

Se agregó lógica al cron `syncProductsStockCron.js` que:

### 1. **Rastreo de cantidades por batch**

Durante el recorrido de `productsStock`, se calcula por cada batch:

- `totalQuantity`: suma de cantidades de todos los productStocks
- `activeStockCount`: cantidad de productStocks activos con quantity > 0
- `inactiveStockCount`: cantidad de productStocks inactivos

#### 2. **Detección de desincronizaciones**

Se identifican tres casos problemáticos:

##### **Caso 1: Batch inactivo con stocks activos**

```javascript
if (batchStatus === 'inactive' && meta.activeStockCount > 0 && meta.totalQuantity > 0)
```

**Acción:** Reactivar el batch y actualizar su cantidad

##### **Caso 2: Batch activo sin stocks activos**

```javascript
if (batchStatus === 'active' && (meta.activeStockCount === 0 || meta.totalQuantity <= 0))
```

**Acción:** Desactivar el batch y poner cantidad en 0

##### **Caso 3: Cantidad del batch no coincide**

```javascript
if (Math.abs(batchQuantity - meta.totalQuantity) > 0.01)
```

**Acción:** Actualizar la cantidad del batch con el valor calculado

#### 3. **Actualización en lote**

Las correcciones se aplican usando `BulkWriter` para eficiencia:

```javascript
updatePayload = {
  status: 'active' | 'inactive',
  quantity: <calculado>,
  updatedAt: serverTimestamp(),
  updatedBy: 'system:inventory-batch-sync-cron',
  lastBatchSyncAt: serverTimestamp(),
  lastBatchSyncSource: 'inventory-sync-cron',
  lastBatchSyncReason: 'inactive-batch-with-active-stocks' | 'active-batch-without-active-stocks' | 'quantity-mismatch',
  lastBatchSyncAction: 'reactivated' | 'deactivated' | 'quantity-updated',
}
```

### Campos de auditoría agregados

Los batches sincronizados tendrán estos nuevos campos:

- `lastBatchSyncAt`: Timestamp de la última sincronización
- `lastBatchSyncSource`: Siempre `'inventory-sync-cron'`
- `lastBatchSyncReason`: Motivo de la sincronización
  - `'inactive-batch-with-active-stocks'`
  - `'active-batch-without-active-stocks'`
  - `'quantity-mismatch'`
- `lastBatchSyncAction`: Acción realizada
  - `'reactivated'`
  - `'deactivated'`
  - `'quantity-updated'`
- `lastBatchSyncQuantityDifference`: (solo para quantity-mismatch) Diferencia detectada

### Logs generados

### Log de información (cuando hay sincronizaciones)

```
[syncProductsStockCron] Sincronización de batches
{
  businessId: "...",
  batchesSynced: 3,
  details: [
    { batchId: "abc123", reason: "inactive-batch-with-active-stocks", action: "activate" },
    { batchId: "def456", reason: "quantity-mismatch", action: "update-quantity" },
    ...
  ]
}
```

### Resumen final

```
[syncProductsStockCron] Finalizado
{
  processedBusinesses: 15,
  batchesSynced: 8,
  updatedProducts: 42,
  ...
}
```

### Ejecución del cron

**Frecuencia:** Configurada por `INVENTORY_SYNC_CRON` (default: `'0 3 * * *'` - todos los días a las 3 AM)  
**Zona horaria:** `INVENTORY_SYNC_TZ` (default: `'America/Santo_Domingo'`)  
**Región:** `INVENTORY_SYNC_REGION` (default: `'us-central1'`)  
**Timeout:** 540 segundos (9 minutos)  
**Memoria:** 1 GiB

### Variables de entorno

```bash
# .env
INVENTORY_SYNC_CRON="0 3 * * *"
INVENTORY_SYNC_TZ="America/Santo_Domingo"
INVENTORY_SYNC_REGION="us-central1"
INVENTORY_SYNC_INCLUDE_INACTIVE="true"  # Incluir stocks inactivos en el análisis
```

### Beneficios

✅ **Corrección automática** de desincronizaciones cada día  
✅ **Sin intervención manual** requerida  
✅ **Auditoría completa** con campos de seguimiento  
✅ **Logs detallados** para monitoreo  
✅ **Sincronización eficiente** con BulkWriter  
✅ **Prevención de errores** en ventas futuras

### Casos de uso resueltos

### Escenario 1: Venta completa un batch

1. **Antes:** Batch queda con `quantity: 0` pero `status: 'active'`
2. **Cron detecta:** active-batch-without-active-stocks
3. **Resultado:** Batch actualizado a `status: 'inactive', quantity: 0`

### Escenario 2: Ajuste manual de inventario

1. **Antes:** Se agrega stock a un productStock cuyo batch estaba inactivo
2. **Problema:** Batch inactivo impide vender ese stock
3. **Cron detecta:** inactive-batch-with-active-stocks
4. **Resultado:** Batch reactivado y cantidad actualizada

### Escenario 3: Error en transacción parcial

1. **Antes:** Se actualizó productStock pero no el batch
2. **Problema:** batch.quantity no coincide con suma de productStocks
3. **Cron detecta:** quantity-mismatch
4. **Resultado:** Cantidad del batch corregida

### Notas técnicas

- La sincronización **NO afecta** la lógica de `createInvoiceV2`
- Es un **mecanismo de corrección** complementario, no preventivo
- Se ejecuta **fuera de horario laboral** para minimizar conflictos
- Los batches corregidos mantienen su historial completo en los campos de auditoría

## 📈 Impacto / Trade-offs

- 👍 Evita ventas fallidas al reactivar lotes automáticamente y corrige cantidades antes de la jornada laboral.
- 👍 BulkWriter mantiene los costos controlados aun cuando se corrigen decenas de batches.
- ⚠️ Depende de que los contadores nocturnos se ejecuten a tiempo; si el cron falla, las inconsistencias permanecen.
- ⚠️ Los cambios se aplican fuera del flujo principal, por lo que las pantallas deben refrescar para reflejar nuevas cantidades.

## 🔜 Seguimiento / Próximos pasos

- [ ] Alertar en Slack cuando `batchesSynced` supere umbrales atípicos.
- [ ] Añadir pruebas unitarias al módulo `syncProductsStockCron` para nuevos casos.
- [ ] Evaluar si conviene disparar re-sync manual desde panel cuando se detecten errores graves.
