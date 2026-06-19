# Sistema RNC SQLite

Este runbook documenta el lookup RNC con snapshot SQLite en Cloud Storage. El
runtime normal consulta `lookupRnc`; Supabase queda solo como rollback explicito
si se fuerza por Remote Config o por variable de entorno en el siguiente build.

## Estado actual del runtime

- Backend por defecto: el frontend consulta `lookupRnc` aunque
  `VITE_RNC_LOOKUP_SOURCE` no exista.
- Rollback legacy explicito: Remote Config `rnc_lookup_source=legacy-supabase`
  o fallback de build `VITE_RNC_LOOKUP_SOURCE=legacy-supabase`.
- Shadow/comparacion opcional: `VITE_RNC_LOOKUP_SOURCE=shadow` consulta
  Supabase y `lookupRnc`, pero devuelve Supabase. Usarlo solo para diagnostico.
- Snapshot runtime actual: `lookupRnc` lee `rnc/current.json`, resuelve el
  `manifestPath` versionado, carga el manifest completo y usa el `snapshotPath`
  para refrescar cache por instancia. El objeto legacy `rnc.sqlite.gz` solo se
  lee cuando `current.json` no existe y
  `RNC_SQLITE_ENABLE_LEGACY_FALLBACK=true`.
- Metadata runtime actual: el refresco sube el SQLite gzip a
  `rnc/snapshots/{sha256}.sqlite.gz`, guarda el manifest completo en
  `rnc/manifests/{sha256}.json` y luego publica `rnc/current.json` como
  puntero.

## Hardening de produccion

Estos puntos deben mantenerse verdes en cada ambiente. Si alguno falla en el
ambiente objetivo, usar Remote Config `rnc_lookup_source=legacy-supabase`
mientras se corrige.

- Snapshots versionados: publicar cada build bajo
  `rnc/snapshots/{sha256}.sqlite.gz`.
- Manifest versionado: publicar `rnc/manifests/{sha256}.json` con la version
  activa, row counts, hashes, validacion, bytes, parser y origen DGII.
- Puntero actual: publicar `rnc/current.json` con `manifestPath` y `sha256`.
- Promocion atomica: subir primero el snapshot y manifest versionados con
  `ifGenerationMatch=0` porque son objetos inmutables esperados como
  inexistentes. Si ya existen por un retry idempotente, validar que bytes,
  hashes y campos criticos coincidan antes de reutilizarlos. Solo despues
  publicar `rnc/current.json` con comparacion de generacion: usar la generacion
  leida si existe y `ifGenerationMatch=0` solo cuando se confirmo que el objeto
  no existe.
- Rollback probado: restaurar `rnc/current.json` apuntando al manifest anterior
  usando comparacion de generacion. El path legacy `rnc.sqlite.gz` solo aplica
  si `current.json` no existe y `RNC_SQLITE_ENABLE_LEGACY_FALLBACK=true`.
- App Check: confirmar que staging y prod inicializan App Check con
  `VITE_FIREBASE_APPCHECK_SITE_KEY` antes de exigir enforcement en `lookupRnc`.
- Telemetria: revisar logs de `lookupRnc` despues de cada despliegue o snapshot
  nuevo.

## Actualizacion automatica

La funcion exportada conserva el nombre `refreshRncSnapshotWeekly`, pero el
schedule actual corre diario a las 03:30 en `America/Santo_Domingo`.

Flujo actual:

```text
Cloud Scheduler
  -> refreshRncSnapshotWeekly
  -> lee rnc/current.json si existe
  -> descarga https://dgii.gov.do/app/WebApps/Consultas/RNC/DGII_RNC.zip
  -> si el SHA-256 del ZIP coincide, termina skipped sin publicar current
  -> extrae TMP/DGII_RNC.TXT
  -> si el SHA-256 del TXT coincide, termina skipped sin publicar current
  -> genera /tmp/.../rnc.sqlite
  -> comprime rnc.sqlite.gz
  -> sube rnc/snapshots/{sha256}.sqlite.gz
  -> sube rnc/manifests/{sha256}.json
  -> publica rnc/current.json como puntero
```

El run diario es el camino normal de produccion. Un run manual despues del
deploy sigue siendo util para generar el primer snapshot o verificar que el
lookup carga el objeto nuevo.

El no-op es intencional: si DGII entrega el mismo ZIP o el mismo TXT extraido,
la funcion registra `skipped: true` y conserva `rnc/current.json` apuntando al
snapshot vigente.

La descarga usa headers de navegador (`User-Agent` y `Referer`) porque DGII
puede responder 403 a clientes sin esos headers.

## Reuso, skip y parserVersion

El skip por fuente sin cambios solo es seguro cuando el manifest actual sigue
siendo reutilizable para el runtime que esta corriendo. Antes de aceptar
`source-zip-unchanged`, `source-text-unchanged` o `snapshot-unchanged`, el
manifest vigente debe conservar `validation.quickCheck=ok`, el mismo
`expectedEntryName`, el mismo minimo de filas, los mismos canarios configurados,
metricas de duplicados dentro de los limites actuales y el mismo
`parserVersion` que el runtime.

`parserVersion` invalida reuse/skip. Si se cambia el parser DGII, la
normalizacion de campos, la politica de duplicados, la decodificacion, los
canarios o cualquier semantica que pueda cambiar el SQLite generado, se debe
subir `RNC_PARSER_VERSION` y el siguiente refresh debe regenerar y validar el
SQLite aunque `source.zipSha256` o `source.textSha256` coincidan con el
manifest anterior. En otras palabras, un manifest con `parserVersion` viejo no
puede bloquear una publicacion nueva por hashes de fuente iguales.

## Memoria, ZIP, duplicados y determinismo

- `refreshRncSnapshotWeekly` corre con `memory: 4GiB`, `timeoutSeconds: 540`,
  `concurrency: 1` y `maxInstances: 1`. Lee el ZIP con limite por stream,
  valida su central directory, rechaza entradas inseguras o duplicadas y extrae
  solo el TXT esperado con limite de bytes:
  `RNC_DGII_MAX_ZIP_BYTES=134217728` y
  `RNC_DGII_MAX_TEXT_BYTES=536870912`.
- El lookup corre con `memory: 2GiB`, `timeoutSeconds: 180` y concurrencia
  configurable. En vez de cargar el SQLite completo en memoria, hace stream del
  gzip desde Storage, calcula hashes durante la descarga/descompresion y escribe
  el SQLite en `/tmp/ventamas-rnc/`.
- El ZIP siempre se descarga para hashearlo. El sistema solo evita extraer,
  regenerar SQLite y publicar cuando `source.zipSha256` o `source.textSha256`
  coinciden con un manifest actual versionado y reutilizable.
- El gzip se genera con nivel 9 y `mtime: 0`; asi el mismo SQLite produce bytes
  gzip estables y el hash del gzip puede usarse como path versionado.
- Los RNC duplicados se cuentan en `duplicateRncCount`; `rowCount` representa
  RNC unicos finales y `validSourceRows` representa filas fuente validas antes
  de deduplicar. La tabla usa `INSERT OR REPLACE`, por lo que gana la ultima
  fila valida del archivo DGII.
- Guardrails de duplicados:
  `RNC_SNAPSHOT_MAX_DUPLICATE_RNC_RATIO` tiene default `0.01` (1% de
  `validSourceRows`); `RNC_SNAPSHOT_MAX_DUPLICATE_RNC_RATIO_INCREASE` tiene
  default `0.005` (0.5 puntos contra el snapshot anterior) y acepta el alias
  legacy `RNC_SNAPSHOT_MAX_DUPLICATE_RNC_INCREASE_RATIO`;
  `RNC_SNAPSHOT_MAX_DUPLICATE_RNC_COUNT` no tiene default, por lo que no hay
  limite absoluto salvo que se configure, y acepta el alias legacy
  `RNC_SNAPSHOT_MAX_DUPLICATE_RNC_ROWS`.
- Los retries de publicacion son deterministas: si el snapshot o manifest
  versionado ya existe, el runtime valida contenido, hashes y campos criticos
  antes de aceptarlo. No se acepta reemplazar un objeto versionado con contenido
  distinto.

## Configuracion backend lookup

Por defecto `lookupRnc` usa `storage-sqlite`. Para desactivarlo temporalmente:

```powershell
$env:RNC_LOOKUP_SOURCE = 'unavailable'
```

Configuracion opcional del snapshot actual:

```powershell
$env:RNC_SQLITE_BUCKET = 'bucket-opcional-si-no-es-el-default'
$env:RNC_SQLITE_STORAGE_PATH = 'rnc.sqlite.gz'
$env:RNC_SQLITE_TABLE = 'rnc'
$env:RNC_SQLITE_RNC_COLUMN = 'rnc_number'
$env:RNC_SQLITE_CACHE_TTL_MS = '900000'
$env:RNC_SQLITE_ENABLE_LEGACY_FALLBACK = 'false'
$env:RNC_CURRENT_MANIFEST_PATH = 'rnc/current.json'
$env:RNC_SNAPSHOT_MANIFEST_PREFIX = 'rnc/manifests'
```

Configuracion objetivo cuando exista `current.json`:

```powershell
$env:RNC_SQLITE_STORAGE_PATH = 'rnc.sqlite.gz'
$env:RNC_SNAPSHOT_PREFIX = 'rnc/snapshots'
$env:RNC_SNAPSHOT_MANIFEST_PREFIX = 'rnc/manifests'
$env:RNC_CURRENT_MANIFEST_PATH = 'rnc/current.json'
$env:RNC_SNAPSHOT_SKIP_UNCHANGED_ZIP = 'true'
$env:RNC_SNAPSHOT_MAX_SKIPPED_ROWS = '1000'
$env:RNC_SNAPSHOT_MAX_ROW_COUNT_DROP_RATIO = '0.15'
$env:RNC_SNAPSHOT_MAX_ROW_COUNT_INCREASE_RATIO = '0.3'
$env:RNC_SNAPSHOT_MAX_DUPLICATE_RNC_RATIO = '0.01'
$env:RNC_SNAPSHOT_MAX_DUPLICATE_RNC_RATIO_INCREASE = '0.005'
$env:RNC_SNAPSHOT_MAX_DUPLICATE_RNC_COUNT = ''
$env:RNC_SNAPSHOT_MAX_SQLITE_BYTES = '536870912'
$env:RNC_SQLITE_MAX_BYTES = '536870912'
$env:RNC_DGII_MAX_TEXT_BYTES = '536870912'
$env:RNC_DGII_MAX_ZIP_BYTES = '134217728'
$env:RNC_DGII_DOWNLOAD_TIMEOUT_MS = '240000'
$env:RNC_SNAPSHOT_REJECTED_SHA256_LIST = ''
$env:RNC_SNAPSHOT_ROLLBACK_HOLD_UNTIL = ''
$env:RNC_SNAPSHOT_VALIDATE_RNCS = '401506254,101027797,101000155'
$env:RNC_SNAPSHOT_VALIDATE_RECORDS_JSON = '[{"rnc":"101027797","full_name":"3 M DOMINICANA SRL","status":"ACTIVO","condition":"NORMAL"}]'
$env:RNC_LOOKUP_DISTRIBUTED_RATE_LIMIT = 'true'
$env:RNC_LOOKUP_DISTRIBUTED_RATE_LIMIT_FAIL_OPEN = 'false'
```

Aliases legacy aceptados por compatibilidad:

```powershell
$env:RNC_SNAPSHOT_MAX_DUPLICATE_RNC_INCREASE_RATIO = '0.005'
$env:RNC_SNAPSHOT_MAX_DUPLICATE_RNC_ROWS = ''
$env:RNC_SNAPSHOT_MIN_ROWS = '500000'
$env:RNC_DGII_EXPECTED_ENTRY_NAME = 'TMP/DGII_RNC.TXT'
$env:RNC_SNAPSHOT_KNOWN_RNCS = '401506254,101027797,101000155'
```

En cold start `lookupRnc` descarga el gzip desde Cloud Storage, calcula el
SHA-256 del gzip mientras descarga, lo descomprime calculando `sqliteSha256`,
valida tamano/hash y `PRAGMA user_version`, lo deja en `/tmp/ventamas-rnc/`
cacheado por snapshot/hash, abre SQLite en modo lectura con `PRAGMA query_only`
y reutiliza el handle mientras la instancia siga viva. La descarga es
single-flight por snapshot dentro de cada instancia: los requests simultaneos
hasta la concurrencia configurada (`RNC_LOOKUP_CONCURRENCY`, default `20`)
comparten una sola descarga del mismo gzip. Si una activacion nueva falla y la
instancia ya tenia un SQLite valido, continua sirviendo el anterior.
Cada 15 minutos por instancia revisa
`rnc/current.json` y refresca si el puntero activo cambio. Si el manifiesto no
existe, usa `RNC_SQLITE_STORAGE_PATH` como fallback legacy solo cuando
`RNC_SQLITE_ENABLE_LEGACY_FALLBACK=true`; otros errores no activan fallback.

Recursos explicitos de `lookupRnc`:

```text
memory: 2GiB
timeoutSeconds: 180
concurrency: RNC_LOOKUP_CONCURRENCY, default 20, rango permitido 1-80
maxInstances: RNC_LOOKUP_MAX_INSTANCES, default 10, rango permitido 1-100
```

## Contrato callable

Payload:

```json
{ "rnc": "401007551" }
```

Respuesta exitosa:

```json
{
  "ok": true,
  "status": "found",
  "source": "storage-sqlite",
  "rnc_number": "401007551",
  "record": {
    "rnc_number": "401007551",
    "full_name": "EMPRESA EJEMPLO SRL"
  },
  "data": {
    "rnc_number": "401007551",
    "full_name": "EMPRESA EJEMPLO SRL"
  }
}
```

`record` es el campo canonico para consumidores nuevos. `data`, `rnc_number` y
`full_name` se mantienen como alias de compatibilidad.

## Rollback y diagnostico frontend

El frontend usa `backend` por defecto. El control operativo recomendado es
Firebase Remote Config con la llave:

```text
rnc_lookup_source
```

Valores aceptados:

```text
backend
legacy-supabase
shadow
```

`VITE_RNC_LOOKUP_SOURCE` queda como fallback de build. Cambiarlo requiere nuevo
build/deploy de Hosting; no sirve como interruptor inmediato de una app ya
desplegada.

Fallback de build:

```powershell
$env:VITE_RNC_LOOKUP_SOURCE = 'legacy-supabase'
```

Para volver al camino normal:

```powershell
$env:VITE_RNC_LOOKUP_SOURCE = 'backend'
```

Shadow sigue disponible solo para diagnostico:

```powershell
$env:VITE_RNC_LOOKUP_SOURCE = 'shadow'
```

## App Check

Antes de exigir App Check en `lookupRnc`, validar que el frontend de staging y
prod inicializa App Check:

```powershell
$env:VITE_FIREBASE_APPCHECK_SITE_KEY = 'recaptcha-enterprise-site-key'
```

Checklist:

- Staging carga sin `appCheck/recaptcha-error`.
- El callable responde desde un navegador real con App Check activo.
- Los emuladores no dependen de App Check.
- Si se activa enforcement en Functions, probar primero con shadow y revisar
  errores `permission-denied` o `unauthenticated` en Cloud Logs.
- En produccion, activar `RNC_LOOKUP_ENFORCE_APP_CHECK=true` cuando el frontend
  tenga site key estable.
- Ajustar `RNC_LOOKUP_MAX_INSTANCES` con datos de latencia fria/caliente.
- Activar `RNC_LOOKUP_DISTRIBUTED_RATE_LIMIT=true` si se necesita un limite
  global entre instancias.

## Validacion local

```powershell
npm run test:run:functions -- functions/src/app/modules/rnc functions/src/index.exportSurface.test.js functions/src/index.importGraph.test.js
npm run test:run -- src/modules/contacts/repositories/rnc.repository.test.ts src/modules/contacts/hooks/useRncSearch.test.ts
npm --prefix functions run build
npm run typecheck:app
```

## Operacion produccion

Controles recomendados antes de marcar produccion como estable:

- Cuentas de servicio separadas: `lookupRnc` con lectura de
  `rnc/current.json`, `rnc/manifests/**` y `rnc/snapshots/**`. Si se activa
  `RNC_LOOKUP_DISTRIBUTED_RATE_LIMIT=true`, tambien necesita permisos minimos
  de transaccion sobre
  `runtimeRateLimits/rncLookup/rncLookupBuckets/*`. Refresh necesita escritura
  sobre los paths de Storage RNC.
- Storage Rules: negar lectura/escritura cliente sobre `rnc/**`; el backend
  debe entrar por IAM, no por reglas de cliente. Negar tambien el objeto raiz
  `rnc.sqlite.gz`.
- Retencion: conservar siempre el snapshot actual, su manifest y varios
  anteriores. Borrar snapshots viejos solo si no estan referenciados por
  `rnc/current.json` ni por una ventana de rollback definida.
- Rate limit distribuido: si se activa, configurar TTL de Firestore sobre
  `runtimeRateLimits/rncLookup/rncLookupBuckets/*` usando el campo `resetAt`.
  El documento usa hashes; no guardar UID, IP ni `x-forwarded-for` en claro.
- Revisar latencia fria/caliente usando el `latencyMs` de `lookupRnc` y los
  logs de activacion del snapshot SQLite.

### Checklist SLO y alertas

SLO recomendado para `lookupRnc`: disponibilidad mensual de 99.5% para
respuestas `found` y `not_found_in_contributors_snapshot`; excluir
`invalid-argument` del denominador operativo. Latencia caliente recomendada:
p95 menor de 500 ms y p99 menor de 1500 ms. Activaciones frias deben quedar
por debajo de 30 s p95 y 60 s p99; alertar si una activacion supera 120 s.

Alertas recomendadas:

- Refresh sin exito ni skip (`ok=true`) por 26 horas: warning; por 36 horas:
  critico.
- Duracion de `refreshRncSnapshotWeekly` mayor de 8 minutos: warning; timeout
  o fallo de funcion: critico.
- `rnc/current.json` ausente, manifest ausente, `snapshotPath` ausente o hash
  inconsistente: critico inmediato.
- `validation.quickCheck` distinto de `ok`: critico inmediato.
- `rowCountDropRatio` mayor de 0.10: warning; mayor de 0.15: critico y el
  default lo rechaza.
- `rowCountIncreaseRatio` mayor de 0.20: warning; mayor de 0.30: critico y el
  default lo rechaza.
- `skippedRows` mayor de 0: warning; mayor de 1000: critico y el default lo
  rechaza.
- `duplicateRncRatio` mayor de 0.005: warning; mayor de 0.01: critico y el
  default lo rechaza.
- `duplicateRncRatioIncrease` mayor de 0.002: warning; mayor de 0.005:
  critico y el default lo rechaza.
- Si se configura `RNC_SNAPSHOT_MAX_DUPLICATE_RNC_COUNT`, alertar al 80% del
  limite y marcar critico cuando lo supere.
- `nullFullNameRows` o `nullStatusRows` mayor de 0: critico. `nullConditionRows`
  mayor de 500: warning; mayor de 1000: critico.
- Error rate de `lookupRnc` (`internal`, `failed-precondition`, `unavailable`)
  mayor de 1% durante 5 minutos: warning; mayor de 5%: critico.
- `resource-exhausted` mayor de 2% o mas de 10 eventos por minuto: warning;
  mas de 50 eventos por minuto: critico y revisar rate limit/abuso.
- Cualquier uso de fallback legacy `rnc.sqlite.gz` en produccion: critico.

## Pruebas pendientes antes de produccion

Antes de declarar produccion estable, completar y registrar evidencia de estas
pruebas:

- Carga caliente de `lookupRnc`: 200 requests concurrentes durante 15 minutos,
  mezcla de RNC existentes/no existentes, p95 menor de 500 ms y error rate
  menor de 0.5% excluyendo `invalid-argument`.
- Activacion fria: despues de deploy o cold starts forzados, disparar al menos
  50 requests simultaneos y verificar single-flight por instancia, sin
  descargas duplicadas por request, sin OOM, sin `SQLITE_BUSY` y sin choques en
  `/tmp/ventamas-rnc/`.
- Cambio de snapshot bajo trafico: consultar mientras cambia `current.json` y
  confirmar que el SQLite anterior sigue sirviendo hasta que el nuevo este
  descargado, hasheado, validado y abierto.
- Rate limit distribuido: con varias instancias, confirmar limite global de
  120/min por llave, fallo cerrado cuando Firestore no permite validar el
  bucket y que usuarios distintos no se bloqueen entre si.
- Carreras de publicacion: ejecutar scheduler retry/manual run en paralelo y
  validar CAS de `current.json`, retry idempotente de snapshot/manifest,
  conflicto por generacion obsoleta, `rollbackHoldUntil` y
  `rejectedSha256List`.
- Limites de archivo: probar ZIP/TXT/SQLite cercanos a
  `RNC_DGII_MAX_ZIP_BYTES`, `RNC_DGII_MAX_TEXT_BYTES` y
  `RNC_SNAPSHOT_MAX_SQLITE_BYTES`, con timeout total menor de 540 segundos y
  memoria bajo 4GiB.
- Fallos DGII/Storage: simular 403, timeout, ZIP corrupto, manifest corrupto y
  snapshot corrupto; confirmar que no cambia `current.json` y que el lookup
  conserva el ultimo SQLite valido.

## Deploy selectivo

No usar deploy masivo desde un arbol sucio. Si se despliega este cambio de
Functions, usar solo las funciones afectadas.

Staging con helper del repo:

```powershell
npm run deploy -- staging:functions lookupRnc,refreshRncSnapshotWeekly
```

Produccion con helper del repo:

```powershell
npm run deploy -- prod:functions lookupRnc,refreshRncSnapshotWeekly
```

Equivalente Firebase directo para staging:

```powershell
firebase deploy --project staging --only "functions:lookupRnc,functions:refreshRncSnapshotWeekly"
```

Equivalente Firebase directo para produccion:

```powershell
firebase deploy --project prod --only "functions:lookupRnc,functions:refreshRncSnapshotWeekly"
```

## Ejecucion manual del job

Despues del deploy, se puede correr el job manualmente para generar el primer
snapshot:

```powershell
gcloud scheduler jobs run firebase-schedule-refreshRncSnapshotWeekly-us-central1 --location us-central1 --project ventamax-staging
```

Si el proyecto usa otra region, listar primero:

```powershell
gcloud scheduler jobs list --location us-central1 --project ventamax-staging --filter="name:refreshRncSnapshotWeekly"
```

Para produccion, cambiar el proyecto:

```powershell
gcloud scheduler jobs run firebase-schedule-refreshRncSnapshotWeekly-us-central1 --location us-central1 --project ventamaxpos
```

## Rollback operativo

Rollback recomendado cuando exista `rnc/current.json`: apuntar al manifest
versionado anterior y dejar los objetos versionados intactos.

Ejemplo de inspeccion:

```powershell
gcloud storage cat gs://ventamax-staging.firebasestorage.app/rnc/current.json
gcloud storage ls gs://ventamax-staging.firebasestorage.app/rnc/snapshots/
gcloud storage ls gs://ventamax-staging.firebasestorage.app/rnc/manifests/
```

Ejemplo de rollback por puntero preservando hashes rechazados previos:

```powershell
$hash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
$badHash = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
$manifestObject = "gs://ventamax-staging.firebasestorage.app/rnc/manifests/$hash.json"
$snapshotObject = "gs://ventamax-staging.firebasestorage.app/rnc/snapshots/$hash.sqlite.gz"
gcloud storage objects describe $manifestObject --format=json | Out-Null
gcloud storage objects describe $snapshotObject --format=json | Out-Null
node tools/rnc/validate-rollback-target.mjs --bucket gs://ventamax-staging.firebasestorage.app --hash $hash
node tools/rnc/prepare-rollback-pointer.mjs --bucket gs://ventamax-staging.firebasestorage.app --hash $hash --reject-hash $badHash --rollback-hold-hours 12 --publish
```

Para inspeccionar antes de publicar, omitir `--publish` o usar `--output`:

```powershell
$tmp = Join-Path $env:TEMP 'rnc-current-rollback.json'
node tools/rnc/prepare-rollback-pointer.mjs --bucket gs://ventamax-staging.firebasestorage.app --hash $hash --reject-hash $badHash --rollback-hold-hours 12 --output $tmp
Get-Content -Raw -Path $tmp
```

La herramienta lee `rnc/current.json`, une su `rejectedSha256List` existente con
`--reject-hash` y escribe JSON UTF-8 sin BOM. Con `--publish`, publica con CAS
usando la generacion leida de `current.json` y falla si el objeto cambia durante
la lectura. Esto reemplaza el bloque manual con `Get-GcsObjectGenerationOrZero`
y equivale al control `gcloud storage cp $tmp $currentObject
--if-generation-match=$currentGeneration`; `$currentGeneration` debe ser la
generacion real de `rnc/current.json`. Solo puede ser `0` si el `describe`
confirmo que el objeto no existe; `0` no es un CAS valido para reemplazar un
objeto existente.

Fallback legacy explicito: solo se lee `rnc.sqlite.gz` cuando no existe
`rnc/current.json` y `RNC_SQLITE_ENABLE_LEGACY_FALLBACK=true`. No usarlo como
rollback normal si `current.json` existe. Resolver la generacion del objeto
legacy antes de copiar; esto reemplaza el helper conceptual
`Get-GcsObjectGenerationOrZero`:

```powershell
$legacyObject = 'gs://ventamax-staging.firebasestorage.app/rnc.sqlite.gz'
$snapshotObject = 'gs://ventamax-staging.firebasestorage.app/rnc/snapshots/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.sqlite.gz'
gcloud storage objects describe $snapshotObject --format=json | Out-Null
$errorFile = New-TemporaryFile
try {
  $legacyGeneration = gcloud storage objects describe $legacyObject --format='value(generation)' 2>$errorFile
  if ($LASTEXITCODE -ne 0) {
    $message = Get-Content -Path $errorFile -Raw
    if ($message -notmatch '(?i)(404|not found|No URLs matched)') {
      throw "No se pudo leer $legacyObject. gcloud exit=$LASTEXITCODE. $message"
    }
    $legacyGeneration = '0'
  }
} finally {
  Remove-Item -LiteralPath $errorFile -Force -ErrorAction SilentlyContinue
}
gcloud storage cp $snapshotObject $legacyObject --if-generation-match=$legacyGeneration
```

Para el objeto legacy, `--if-generation-match=0` solo aplica si
`$legacyGeneration` es `0` porque `rnc.sqlite.gz` no existe. Si existe, usar su
generacion actual para evitar sobrescrituras perdidas.

Despues del rollback, esperar el TTL de cache (`RNC_SQLITE_CACHE_TTL_MS`, 15
minutos por defecto) o reiniciar instancias con un deploy selectivo si hay que
forzar cold starts.
