# Diagrama NoSQL recomendado para Firestore (VentaMas)

## 📋 Contexto

El proyecto usa Firestore como base principal y su patrón dominante es multi-tenant por negocio:

- Colecciones raíz: `users`, `businesses`, `businessInvites`, `sessionTokens`, `changelogs`.
- Dominio operativo por negocio bajo `businesses/{businessId}/...` (ej. `invoices`, `products`, `productsStock`, `batches`, `cashCounts`, `accountsReceivable`, `members`).
- Lectura frecuente en tiempo real (`onSnapshot`) y consultas por rutas concretas de negocio.

Necesitamos elegir un tipo de diagrama NoSQL que ayude a diseñar y controlar costo, velocidad y mantenibilidad.

## 🎯 Objetivos

- Elegir un diagrama principal que se adapte al patrón real de Firestore en este repositorio.
- Definir reglas claras de modelado para costo y latencia.
- Dejar buenas prácticas accionables para evolución del esquema.

## ⚙️ Diseño / Arquitectura

### Evaluación de opciones

| Opción | Ajuste al proyecto | Ventaja principal | Riesgo |
| --- | --- | --- | --- |
| 1) Jerárquico/Árbol (rutas) | Alto | Refleja exactamente cómo se consulta Firestore | Puede ocultar reglas de duplicación de datos |
| 2) Estructura de documento (JSON) | Medio | Excelente para definir campos de una entidad | No muestra bien navegación entre colecciones |
| 3) Relación Embebido vs Referenciado | Alto (como complemento) | Ayuda a decisiones de modelado y costo | No muestra mapa completo del sistema |

### Decisión recomendada

Usar **1) Diagrama Jerárquico/Árbol (rutas)** como diagrama principal.

Razón: en Firestore, el costo y la velocidad dependen directamente de la ruta, cardinalidad por colección, y patrón de query. Este tipo es el más útil para operar y escalar este proyecto hoy.

Mantener **3) Embebido vs Referenciado** como regla complementaria de diseño (no como diagrama principal).

### Diagrama principal (rutas)

```mermaid
flowchart TD
  ROOT[(Firestore)]
  ROOT --> USERS[users/{uid}]
  ROOT --> BIZ[businesses/{businessId}]
  ROOT --> INVITES[businessInvites/{inviteId}]
  ROOT --> TOKENS[sessionTokens/{tokenId}]
  ROOT --> CHANGELOGS[changelogs/{id}]

  BIZ --> MEMBERS[members/{uid}]
  BIZ --> INVOICES[invoices/{invoiceId}]
  BIZ --> AR[accountsReceivable/{arId}]
  BIZ --> ARP[accountsReceivablePayments/{paymentId}]
  BIZ --> PRODUCTS[products/{productId}]
  BIZ --> STOCK[productsStock/{stockId}]
  BIZ --> BATCHES[batches/{batchId}]
  BIZ --> MOV[movements/{movementId}]
  BIZ --> CASH[cashCounts/{cashCountId}]
  BIZ --> EXP[expenses/{expenseId}]
  BIZ --> CLIENTS[clients/{clientId}]
  BIZ --> ORDERS[orders/{orderId}]
  BIZ --> INVSESS[inventorySessions/{sessionId}]

  INVSESS --> COUNTS[counts/{countId}]
  INVSESS --> SNAP[snapshots/{snapshotId}]
```

### Regla complementaria: embebido vs referenciado

- **Embebido**: solo para datos chicos, de baja mutación y con lectura conjunta (ej. `pricing`, `presence`, `meta`).
- **Referenciado**: para listas grandes, alta frecuencia de cambio o reuso transversal (ej. `products`, `batches`, `productsStock`, `movements`).
- **Desnormalización controlada**: guardar campos espejo de lectura (`productName`, `batchNumberId`) cuando reduzca lecturas extra.

## 📈 Impacto / Trade-offs

### Controles de costo y velocidad

| Control | Impacto en costo | Impacto en velocidad | Aplicación recomendada |
| --- | --- | --- | --- |
| Consultar siempre por `businesses/{businessId}/...` | Bajo costo por menor scan lógico | Alta | Evitar rutas globales salvo administración |
| Documentos pequeños (evitar crecer sin límite) | Menos lecturas pesadas y reintentos | Alta | Partir estructuras grandes en subcolecciones |
| Evitar listeners amplios en pantallas largas | Reduce lecturas recurrentes | Media/Alta | Paginar y desuscribir al salir |
| Duplicar solo campos de lectura caliente | Puede bajar lecturas totales | Alta | Mantener espejo con jobs/funciones de consistencia |
| Índices compuestos solo para queries reales | Evita sobrecosto operativo | Alta | Crear índice al aparecer query concreta |
| Escrituras en lotes/tx para integridad | Evita inconsistencias y retrabajo | Media | Usar `batch`/`transaction` en operaciones críticas |

### Buenas prácticas clave

- Diseñar queries primero, documentos después.
- Evitar documentos "todo-en-uno" por límite y contención de escritura.
- Definir ownership por ruta (quién escribe cada colección).
- Medir colecciones calientes (invoices, products, cashCounts) con muestras reales.
- Versionar cambios de esquema y migraciones por script.

## 🔜 Seguimiento / Próximos pasos

- Crear un `reference` con campos mínimos por colección crítica (`businesses`, `users`, `invoices`, `products`, `accountsReceivable`).
- Definir checklist de revisión de modelo antes de features nuevas (ruta, query, índice, tamaño doc, estrategia de duplicación).
- Completar reglas de seguridad por colección (actualmente las reglas están abiertas para usuarios autenticados).
