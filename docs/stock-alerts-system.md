# Sistema de Alertas de Stock / Stock Alerts System

> Documento de referencia interna. Explica el diseño, configuración y operación del sistema de alertas de productos con bajo inventario.

---

## 1. Objetivo

Detectar productos con existencia baja o crítica y notificar por correo electrónico a cada negocio según sus propios umbrales de configuración. Hay dos modalidades planificadas:

- (A) Evento inmediato (onWrite / trigger) – pendiente o en otra parte del código.
- (B) Resumen diario ("digest") – implementado en `stockAlertsDailyDigest` (programado vía Cloud Scheduler / functions v2 `onSchedule`).

Este documento se centra en el digest diario (archivo: `functions/src/modules/Inventory/functions/stockAlertsDailyDigest.js`).

---

## 2. Componentes Principales

| Componente                                              | Rol                                                                     |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| `stockAlertsDailyDigest`                                | Función programada que recorre negocios y envía un resumen consolidado. |
| Firestore `businesses`                                  | Colección raíz con documentos de negocios.                              |
| Subdocumento `businesses/{businessId}/settings/billing` | Almacena configuración de alertas (activación, emails, thresholds).     |
| Subcolección `businesses/{businessId}/productsStock`    | Inventario (campos claves: `quantity`, `status`, `productName`).        |
| `mailer.js`                                             | Abstracción para envío de correo vía nodemailer y parámetros/secretos.  |
| Parámetros / Secrets (`secrets.js`)                     | Fuentes de configuración para runtime (defineString / defineSecret).    |

---

## 3. Flujo del Digest Diario (Resumen)

1. Se dispara según cron configurado (`DIGEST_CRON` + `DIGEST_TZ`).
2. Obtiene hasta `DIGEST_BUSINESS_LIMIT` negocios, ordenados por `DIGEST_BUSINESS_ORDER_FIELD` (default: `business.createdAt`).
3. Para cada negocio:
   - Lee `settings/billing`.
   - Valida: `stockAlertsEnabled === true` y existencia de `stockAlertEmail`.
   - Determina umbrales: `stockLowThreshold` y `stockCriticalThreshold` (defaults 20 y 10 si faltan).
   - Consulta productos con `quantity <= low` y `status == 'active' OR status == null` (dos queries fusionadas; fallback a una sola query si falla por índices).
   - Clasifica productos en CRÍTICOS (<= critical) y BAJOS (> critical y <= low).
   - Si hay al menos uno, construye HTML + texto y envía correo (o lo simula si `STOCK_ALERT_DRY_RUN=true`).
4. Registra métricas (contadores de skips, negocios procesados, etc.) y logs detallados si `debug` o `verbose`.

---

## 4. Umbrales

- `critical` = `billing.stockCriticalThreshold` (default 10)
- `low` = `billing.stockLowThreshold` (default 20)
- Un producto con `quantity <= critical` entra a CRÍTICO.
- Si `quantity <= low` pero > critical entra a BAJO.

---

## 5. Configuración (Parámetros y Variables de Entorno)

La función intenta primero leer parámetros (defineString / defineSecret) y si no, cae a `process.env` (útil en entornos locales).

### Flags / Parámetros Operativos

| Nombre Param/Env                        | Descripción                                                 | Default                                      |
| --------------------------------------- | ----------------------------------------------------------- | -------------------------------------------- |
| `DIGEST_CRON`                           | Expresión CRON para schedule.                               | `0 13 * * *` (ejemplo; revisar `secrets.js`) |
| `DIGEST_TZ`                             | Zona horaria (ej: `America/Santo_Domingo`).                 | `UTC` o definido en params                   |
| `DIGEST_VERBOSE`                        | Log extendido.                                              | `false`                                      |
| `STOCK_ALERT_DEBUG`                     | Activa logs de depuración adicionales.                      | `false`                                      |
| `STOCK_ALERT_DRY_RUN`                   | Simula envío (no manda correo).                             | `false`                                      |
| `DIGEST_BUSINESS_LIMIT`                 | Máximo de negocios por ejecución.                           | `100`                                        |
| `DIGEST_BUSINESS_ORDER_FIELD`           | Campo para `orderBy`.                                       | `business.createdAt`                         |
| `STOCK_ALERT_ALLOWED_RECIPIENT_DOMAINS` | Lista de dominios permitidos (coma). `*` = sin restricción. | `*`                                          |

### Configuración de Correo (SMTP / Service)

Ver `mailer.js`.
| Env / Param | Tipo | Ejemplo | Notas |
|-------------|------|---------|-------|
| `STOCK_ALERT_MAIL_USER` | Secret | `notifier@dominio.com` | Requerido para enviar |
| `STOCK_ALERT_MAIL_PASS` | Secret | `********` | App Password si Gmail |
| `STOCK_ALERT_MAIL_SERVICE` | defineString | `gmail` | Alternativa a host/port |
| `STOCK_ALERT_MAIL_HOST` | defineString | `smtp.mailgun.org` | SMTP directo |
| `STOCK_ALERT_MAIL_PORT` | defineString | `587` | |
| `STOCK_ALERT_MAIL_SECURE` | defineString | `true/false` | `true` fuerza TLS (465) |
| `STOCK_ALERT_MAIL_FROM` | defineString | `Stock Alerts <no-reply@dominio.com>` | Remitente visible |
| `STOCK_ALERT_MAIL_POOL` | defineString | `true` | Habilita pooling |
| `STOCK_ALERT_MAIL_MAX_CONN` | defineString | `5` | Conexiones en pool |
| `STOCK_ALERT_MAIL_MAX_MSG` | defineString | `100` | Mensajes por conexión |

### Campos en Billing Settings (Firestore)

Ruta: `businesses/{bid}/settings/billing`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `stockAlertsEnabled` | boolean | Activa/desactiva alertas para el negocio. |
| `stockAlertEmail` | string | Lista coma-separada de destinatarios. |
| `stockLowThreshold` | number | Umbral bajo personalizado. |
| `stockCriticalThreshold` | number | Umbral crítico personalizado. |

---

## 6. Estructura de Datos Relevante

```
/businesses (colección)
  {businessId} (doc)
    business.createdAt (timestamp)  // usado para orden
    ...otros campos...
    /settings/billing (doc)
      stockAlertsEnabled: true
      stockAlertEmail: "correo1@dom.com, correo2@dom.com"
      stockLowThreshold: 25
      stockCriticalThreshold: 8
    /productsStock (colección)
      {productStockId}
        quantity: 7
        status: 'active' | null | 'inactive'
        productName: 'Batería AAA'
```

---

## 7. Lógica de Filtrado de Productos

1. Dos queries separadas para evitar problemas con `status == null`:
   - `where('quantity', '<=', low).where('status', '==', 'active')`
   - `where('quantity', '<=', low).where('status', '==', null)`
2. Se fusionan los resultados en un `Map` para evitar duplicados.
3. Fallback: una sola query `where('quantity', '<=', low)` si falla (índice faltante o restricción Firestore).
4. Productos con `status` distinto de `'active'` (cuando el fallback trae más) se descartan en memoria.

---

## 8. Política de Dominios Permitidos

- Param / env: `STOCK_ALERT_ALLOWED_RECIPIENT_DOMAINS`.
- Ejemplo: `empresa.com, distribuidor.do`
- `*` = sin restricción.
- Se filtra cada destinatario por el dominio (`parte@dominio`). Si todos son filtrados, se hace `continue` y se loggea warning.

---

## 9. Envío de Correo (`mailer.js`)

- Usa `nodemailer` con transporte creado bajo demanda y cacheado.
- Verifica el transport una única vez (`transport.verify()`).
- Construye `from` a partir de param `MAIL_FROM` o user.
- Normaliza destinatarios a lista limpio (coma-separados).
- Si faltan `MAIL_USER` o `MAIL_PASS`, no envía (log warning) y retorna `{ skipped: true }`.

---

## 10. Flags de Control y Cómo Probar

| Escenario                   | Acción                                          |
| --------------------------- | ----------------------------------------------- |
| Probar sin enviar correos   | `STOCK_ALERT_DRY_RUN=true`                      |
| Ver detalles de skips       | `DIGEST_VERBOSE=true`                           |
| Depuración de queries/envío | `STOCK_ALERT_DEBUG=true`                        |
| Limitar alcance             | Reducir `DIGEST_BUSINESS_LIMIT` (p.ej. 5)       |
| Validar dominio filtrado    | Ajustar `STOCK_ALERT_ALLOWED_RECIPIENT_DOMAINS` |

### Ejecución Manual (Local / Emulador)

1. Establecer variables de entorno necesarias (especialmente MAIL_USER / MAIL_PASS si se prueba real).
2. Ejecutar la función manualmente (por ahora, invocar handler exportado o ajustar script de test). En producción la invoca el scheduler.
3. Revisar logs para `summary`.

---

## 11. Escalabilidad y Límites

- `DIGEST_BUSINESS_LIMIT` previene leer todos los negocios de golpe.
- Cada negocio realiza hasta 2 queries de productos (más 1 fallback potencial). Considerar índice y límites de lectura.
- Se podría paginar (futuro): almacenar última marca procesada (ej. `createdAt` / docId) y reprogramar colas.
- Para volúmenes muy grandes, mover la generación por negocio a una cola (Cloud Tasks / PubSub) y paralelizar.

---

## 12. Índices Recomendados Firestore

Para evitar fallbacks:

1. Colección: `businesses` – single field index en `business.createdAt` (ascendente).
2. Colección: `businesses/{bid}/productsStock` – índices compuestos potenciales dependiendo de reglas (ej. `quantity` + `status`). Sin embargo Firestore soporta `where('quantity','<=',X)` + `where('status','==','active')` con índice compuesto (status asc, quantity asc). Crear también para `status == null` puede no ser necesario pues null eq no siempre requiere índice adicional; revisar consola si aparece error `FAILED_PRECONDITION`.

---

## 13. Manejo de Errores y Fallbacks

| Situación                                 | Comportamiento                                                          |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| Error `orderBy` (campo faltante / índice) | Log warning y reintenta sin `orderBy`.                                  |
| Error queries productos                   | Log warning y fallback a una query simple.                              |
| Error envío correo                        | Log `logger.error` con `bid` + mensaje. Continúa con siguiente negocio. |
| Transport inválido                        | Se omite envío (warning) y no se corta la ejecución.                    |

Los logs finales incluyen un resumen (`summary`) con métricas de saltos.

---

## 14. Roadmap / Mejoras Futuras

- Integrar envío inmediato (onWrite) para alertar cambios críticos (si no existe ya en otro módulo).
- Cache de thresholds si se hacen múltiples funciones similares.
- Paginación multi-ejecución del digest (batching real).
- Plantilla HTML personalizable por negocio.
- Integración con extensión Firebase Trigger Email como alternativa a nodemailer.
- Reintentos con colas si el SMTP rechaza temporalmente.

---

## 15. Checklist para Activar en un Nuevo Entorno

1. Crear parámetros / secrets de correo (`MAIL_USER`, `MAIL_PASS`, host o service, `MAIL_FROM`).
2. Configurar CRON (`DIGEST_CRON`) y zona (`DIGEST_TZ`).
3. Verificar índices: `business.createdAt` y compuestos de `productsStock` si son requeridos.
4. Poner `stockAlertsEnabled = true` y `stockAlertEmail` en billing de al menos un negocio de prueba.
5. (Opcional) Establecer dominios permitidos: `STOCK_ALERT_ALLOWED_RECIPIENT_DOMAINS`.
6. Hacer una ejecución en modo `STOCK_ALERT_DRY_RUN=true` para validar logs.
7. Desactivar `DRY_RUN` y monitorear primer envío.
8. Documentar credenciales y rotación.

---

## 16. FAQ Rápida

**No se envían correos**: Verificar logs `[mailer] No se envía correo: transport nulo` → faltan credenciales.

**Recipientes filtrados**: Ajustar `STOCK_ALERT_ALLOWED_RECIPIENT_DOMAINS` o revisar dominios de emails.

**Sin productos en correo**: Puede haber sido clasificado y luego filtrado; revisar `idsEmptyAfterClass` con `DIGEST_VERBOSE=true`.

**Muchos negocios omitidos**: Revisar contadores `noBillingSettings`, `alertsDisabled`, `noEmails` en el resumen.

**Thresholds no aplican**: Confirmar que los valores en billing son números (`number`), no strings.

**Orden no parece correcto**: Validar que el campo `business.createdAt` existe y es `Timestamp`. Si no, se cuenta en `skippedNoCreatedAt`.

---

## 17. Ejemplo de Log Final

```
[stockDigest] Fin ejecución {
  ms: 2310,
  orderField: 'business.createdAt',
  processedBusinesses: 3,
  emailsQueued: 3,
  skippedNoCreatedAt: 1,
  skips: {
    noBillingSettings: 2,
    alertsDisabled: 5,
    noEmails: 1,
    noProductsBelowThreshold: 4,
    emptyAfterClassification: 0
  },
  dryRun: false,
  debug: false,
  verbose: false
}
```

---

## 18. Referencias de Código

- `functions/src/modules/Inventory/functions/stockAlertsDailyDigest.js`
- `functions/src/core/config/mailer.js`
- `functions/src/core/config/secrets.js` (para parámetros y defineSecret)

---

## 19. Notas Finales

Mantener este documento actualizado si:

- Cambian los nombres de parámetros.
- Se introduce un nuevo modo de envío.
- Se agregan campos a la configuración billing.

> Última actualización automática: (generado por asistente) — revisar y ajustar si se despliega en producción.
