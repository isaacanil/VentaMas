# Propuesta de Valor: AI Business Seeding & Intelligence

Este documento detalla las funcionalidades sugeridas para el módulo `/dev/tools/ai-business-seeding` (y su eventual expansión a usuarios finales). El objetivo es utilizar IA para "sembrar" (seed) valor en el negocio, tanto en su etapa inicial (setup) como en su operación diaria.

## 1. "Smart Seeding" - Asistente de Inicialización de Negocio
**Objetivo:** Reducir la fricción del "Cold Start" (arranque en frío) para nuevos usuarios.
**Uso Dev:** Generación rápida de escenarios de prueba complejos (ej: "Crea una ferretería con 500 productos y 3 meses de historial de ventas").

### Funcionalidades Propuestas:
*   **Generación de Catálogo por Rubro:**
    *   El usuario indica: "Farmacia" o "Restaurante".
    *   **IA:** Genera automáticamente categorías (Antibióticos, Higiene / Entradas, Bebidas), productos base con precios sugeridos, y unidades de medida correctas.
*   **Layout de Almacén Sugerido:**
    *   Basado en el rubro, sugerir estructura de `Warehouse` -> `Row` -> `Shelf`. (Ej: Para ropa: "Estantes por Talla/Género").
*   **Configuración de Impuestos y Reglas:**
    *   Pre-configuración de NCF (Comprobantes Fiscales) y tasas de impuestos según la región detectada.

## 2. Enriquecimiento Inteligente de Inventario
**Objetivo:** Acelerar la carga de datos individual y mejorar la calidad de la data.

### Funcionalidades Propuestas:
*   **Auto-Completado de Productos (Barcode/Nombre):**
    *   Al escanear un código de barras o escribir "Coca Cola", la IA sugiere: Nombre completo, Imagen, Categoría, y Descripción comercial.
*   **Normalización de Data:**
    *   Detectar duplicados o inconsistencias (ej: "Cocacola" vs "Coca-Cola") y sugerir fusiones.

## 3. Inteligencia Operativa (Features para Usuario Final)
Estas funciones utilizan la data "sembrada" y la enriquecen con el tiempo.

### A. Predicción de Abastecimiento (Stock Forecast)
*   **Análisis:** Analizar el historial de `Sales` y `Movements`.
*   **Insight:** "Tu stock de 'Leche' se agotará en 3 días basado en el consumo promedio de los viernes. Sugerencia: Pedir 20 unidades hoy."
*   **Valor:** Prevenir quiebres de stock (Stockouts).

### B. Auditoría de Anomalías en Ventas/Caja
*   **Análisis:** Comparar `CashCounts` (arqueos) con `Invoices`.
*   **Insight:** "Se detectó un patrón inusual de anulaciones de facturas los días martes en el turno de la tarde."
*   **Valor:** Seguridad y control de pérdidas.

### C. Reportes en Lenguaje Natural (NLP)
*   **Interacción:** Barra de búsqueda global.
*   **Query Usuario:** "¿Cuánto vendimos en Tarjeta de Crédito la semana pasada?"
*   **Acción IA:** Traduce a query de Firestore/Filtro y muestra el KPI.
*   **Valor:** Democratización del acceso a la información sin necesidad de aprender a usar filtros complejos.

### D. Generador de Promociones/Combos
*   **Análisis:** Productos con baja rotación (Low turnover).
*   **Sugerencia:** "Tienes exceso de stock en 'Producto X'. Sugerencia: Crea un combo con 'Producto Y' (que se vende mucho) con un 10% de descuento."

## 4. Implementación Técnica (Roadmap Sugerido)

1.  **Fase 1 (Dev Tool):** Script en `/dev/tools/ai-business-seeding` que acepta un JSON de configuración (Rubro, Tamaño) y popula Firestore usando los modelos existentes (`Product`, `Warehouse`, `Invoice`).
2.  **Fase 2 (Asistente Híbrido):** UI en el onboarding donde el usuario valida las sugerencias de la IA antes de guardar.
3.  **Fase 3 (Features Activos):** Jobs en Cloud Functions que corren semanalmente para generar los "Insights" de inventario y seguridad.
