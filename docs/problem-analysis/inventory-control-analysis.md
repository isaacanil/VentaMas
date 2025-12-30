# Análisis del Módulo de Control de Inventario

**Ruta Analizada:** `src/views/pages/InventoryControl/**`
**Fecha:** 29 de Diciembre de 2025

Este documento detalla los hallazgos tras revisar el código fuente del módulo de Control de Inventario. Se han categorizado los puntos en problemas de rendimiento, anti-patrones y mejores prácticas ausentes.

## 1. Problemas de Rendimiento (Performance)

### 🔴 Escrituras en Serie en Firestore (Crítico)
- **Ubicación:** `hooks/useInventoryCounts.js` (Función `saveCounts`).
- **El Problema:** El código itera sobre el array de cambios (`countsData`) y ejecuta `await setDoc(...)` de forma secuencial dentro de un bucle `for`.
- **Impacto:**
    - Latencia Extrema: El tiempo de guardado aumenta linealmente con cada ítem editado ($Tiempo = N 	imes RTT$). Para 50 ítems, pueden ser varios segundos de espera.
    - Riesgo de Inconsistencia: Si la conexión falla a la mitad, se guardan solo algunos registros.
- **Recomendación:** Utilizar `writeBatch` de Firestore para agrupar operaciones (hasta 500) en una única transacción atómica de red.

### 🟠 Carga de Datos "Firehose" (Sin Paginación) (Alto)
- **Ubicación:** `hooks/useInventoryStocksProducts.js`.
- **El Problema:** Se utiliza `onSnapshot` para escuchar **toda** la colección `productsStock` y `products` del negocio sin límites ni filtros de servidor.
- **Impacto:**
    - Uso excesivo de ancho de banda y memoria en el cliente.
    - Costos elevados de lectura en Firebase cada vez que se carga la página.
    - Bloqueo del hilo principal al procesar snapshots grandes.
- **Recomendación:** Implementar paginación (infinite scroll) o carga bajo demanda. Usar índices compuestos para filtrar en el servidor en lugar de en el cliente.

### 🟡 Resolución de Ubicaciones N+1 (Medio)
- **Ubicación:** `hooks/useLocationNames.js` -> `utils/inventoryHelpers.js`.
- **El Problema:** `resolveLocationLabel` realiza múltiples llamadas `getDoc` secuenciales (Warehouse -> Shelf -> Row -> Segment) para construir el nombre de *una* sola ubicación.
- **Impacto:** Renderizar una tabla con 50 ubicaciones únicas puede disparar cientos de lecturas a la base de datos, saturando la red y ralentizando el renderizado.
- **Recomendación:** Cargar la topología del almacén en una sola consulta al inicio (caché) o desnormalizar el nombre completo de la ubicación en los documentos de stock.

### 🟡 Cálculos Pesados en el Render (Cliente)
- **Ubicación:** `utils/buildInventoryGroups.js` invocado en `InventoryControl.jsx`.
- **El Problema:** La agrupación y filtrado de todos los stocks se realiza en el cliente en cada render o cambio de búsqueda.
- **Impacto:** "Jank" (interfaz trabada) al escribir en el buscador si el inventario supera unos pocos miles de ítems.

## 2. Anti-patrones ("Cosas que no deberíamos hacer")

### ❌ Lógica de Administración en Bundle de UI
- **Ubicación:** `tools/migrateInventoryCounts.js`.
- **El Problema:** Un script de migración masiva de base de datos está incluido en el código fuente de las vistas.
- **Riesgo:** Aumenta el tamaño de la aplicación y expone lógica sensible de escritura masiva en el cliente.
- **Acción:** Mover a Cloud Functions o a una carpeta de scripts de administración separada del build de producción.

### ❌ Lógica de Negocio Compleja en JSX
- **Ubicación:** `components/GroupedLotsModal.jsx`.
- **El Problema:** Cálculos complejos de variables (`aggregatedTopCount`, `real`, `diff`, `isMarkedForRemoval`) mezclados directamente dentro del retorno del componente (render).
- **Riesgo:** Dificulta la legibilidad, el mantenimiento y hace imposible el testeo unitario de esa lógica.

## 3. Mejores Prácticas Faltantes ("Cosas que deberíamos hacer")

### 🔹 Manejo de Errores en UI (Error Boundaries)
- **Estado Actual:** Si falla un cálculo de fecha o formato en `InventoryGroupedTable`, toda la pantalla podría romperse (pantalla blanca).
- **Recomendación:** Envolver componentes complejos en `ErrorBoundary` para fallar elegantemente solo en la fila o sección afectada.

### 🔹 Internacionalización (i18n) Hardcoded
- **Estado Actual:** Textos como "Finalizar inventario", "Guardar Cambios" están quemados en el código.
- **Recomendación:** Extraer textos a archivos de recursos o constantes para facilitar mantenimiento y futura traducción.

### 🔹 Virtualización
- **Estado Actual:** Se renderizan componentes pesados (`Tooltip`, `Tag`) para todas las filas, incluso las que no se ven.
- **Recomendación:** Implementar virtualización (windowing) para renderizar solo las filas visibles en el DOM.

### 🔹 Optimistic UI
- **Estado Actual:** La UI espera a que el servidor confirme el guardado para dar feedback (estado `saving`).
- **Recomendación:** Reflejar el éxito inmediatamente en la UI mientras se sincroniza en segundo plano.

## Plan de Acción Sugerido

1.  **Prioridad 1 (Performance/Seguridad):** Refactorizar `useInventoryCounts.js` para usar `batch.commit()` en lugar de escrituras secuenciales.
2.  **Prioridad 2 (Limpieza):** Mover `migrateInventoryCounts.js` fuera de `src/views`.
3.  **Prioridad 3 (UX/Performance):** Optimizar la resolución de nombres de ubicaciones (evitar N+1 reads).
4.  **Prioridad 4 (Arquitectura):** Planear la paginación para `productsStock` para soportar inventarios grandes.
