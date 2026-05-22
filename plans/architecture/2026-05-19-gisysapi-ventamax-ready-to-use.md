# VentaMas + GISYS FACT e-CF ready-to-use

Fecha: 2026-05-19
Repos revisados:

- `C:\Dev\gisys\gisysapi`
- `C:\Dev\VentaMas`

## 1. GISYSAPI estudiado

GISYS FACT expone una API fiscal multi-tenant bajo `/v1`.

Endpoints cliente principales:

- `POST /v1/ecf/issue`: recibe `IssueDocumentPayload`, exige `Authorization: Bearer` y `X-Idempotency-Key`, consume cuota y responde `202` con `submissionId`, `eNcf`, `requestStatus`, `localStatus`, estados DGII, `security`, `qr`, `printData` y `links`.
- `GET /v1/ecf/:submissionId/status`: devuelve estado normalizado de la emision, `dgiiTrackId`, `dgiiSubmissionStatus`, `dgiiValidationStatus`, seguridad, QR y links XML/PDF.
- `GET /v1/ecf/:submissionId/xml`: descarga XML, con `?kind=signed-ecf` para XML firmado.
- `GET /v1/ecf/:submissionId/pdf`: existe como contrato, pero en esta revision puede devolver `ARTIFACT_NOT_READY` si la RI/PDF no fue generada.
- `GET /v1/submissions`, `/v1/submissions/:submissionId`, `/v1/submissions/by-track/:trackId`: busqueda y lectura operacional.
- `POST /v1/submissions/:submissionId/refresh-status`: consulta/actualiza estado DGII.
- `POST /v1/submissions/:submissionId/retry`: reintento manual.
- `GET /v1/dead-letters` y `GET /v1/exception-events`: errores operativos y excepciones.

Endpoints admin relevantes para dejar un contribuyente operativo:

- `POST /v1/admin/clients`
- `POST /v1/admin/client-tokens`
- `POST /v1/admin/integration-instances`
- `POST /v1/admin/taxpayers`
- `POST /v1/admin/taxpayers/:taxpayerId/certificate`
- `POST /v1/admin/series`
- endpoints de certificacion, representaciones, aprobacion comercial, contingencias y receiver.

Autenticacion y cuotas:

- Cliente: `Authorization: Bearer <token>`.
- El token debe tener scopes `ecf:issue` para emitir y `submissions:read` para consultar.
- `POST /v1/ecf/issue` exige `X-Idempotency-Key`.
- `validateQuota` aplica limites por minuto, mes y ano sobre `clientQuotaCounters`.

Contrato de emision:

- `IssueDocumentPayload` requiere `integrationInstanceCode`, `taxpayerCode`, `documentType`, `invoiceInternalId`, `issuedAt`, `buyer`, `items` y `totals`.
- Tipos soportados por el motor XML: `E31`, `E32`, `E33`, `E34`, `E41`, `E43`, `E44`, `E45`, `E46`, `E47`; VentaMas arranca con `E31`, `E32`, `E34`, `E45`.
- GISYS genera XML, firma, validacion XSD, QR/seguridad, encolado de envio DGII, RFCE cuando aplica y evidencias.

Estados y errores:

- Estado local: `received`, `validated`, `sequence_reserved`, `xml_built`, `signed_local`, `local_failed`.
- Estado request/submission: `received`, `validated`, `queued`, `processing`, `submitted`, `accepted`, `accepted_conditional`, `rejected`, `error`.
- Estado DGII: `pending`, `submitted`, `accepted`, `accepted_conditional`, `rejected`, `processing`, `not_found`.
- Errores de API usan JSON con `ok: false`, `code`, `message`, `details`; errores operativos quedan en `exceptionEvents` y `deadLetters`.

Requisitos para operar un negocio:

1. Cliente GISYS activo con token Bearer y scopes `ecf:issue`, `submissions:read`.
2. `integrationInstanceCode` creado y vinculado al cliente.
3. `taxpayerCode` del contribuyente GISYS creado.
4. Certificado digital tributario cargado y vigente.
5. Series e-CF autorizadas para los tipos que VentaMas emitira.
6. URLs DGII configuradas dentro de GISYS.
7. Cuotas suficientes.
8. En VentaMas: comprobantes fiscales habilitados, flags e-CF activos y proveedor GISYS configurado.

## 2. Auditoria VentaMas

Estado antes del cierre:

- Ya existia modulo `functions/src/app/modules/electronicTaxReceipts`.
- Ya existia mapper VentaMas -> `IssueDocumentPayload`.
- Ya existia outbox `issueElectronicTaxReceipt`.
- Ya existia secreto `GISYS_FACT_CLIENT_TOKEN`.
- Faltaban shadow runtime real, idempotencia estable, refresh status, callables de configuracion/estado, UI minima y pruebas del modulo.

Brechas cerradas:

- `electronicModelEnabled=true` ahora agenda e-CF aunque `electronicTransportEnabled=false`.
- Shadow no exige `baseUrl` ni token, pero si exige `integrationInstanceCode` y `taxpayerCode` para construir payload auditable.
- Transporte activo exige base URL y token secret ref.
- Idempotencia GISYS ya no depende del `taskId`; usa `ventamas:{businessId}:{invoiceId}:ecf:{documentType}:v1`.
- VentaMas puede consultar/refrescar estado GISYS sin reemitir.
- Snapshot electronico se guarda en `invoicesV2.snapshot.electronicTaxReceipt` y en `invoices/{invoiceId}.data.electronicTaxReceipt`.
- Se marca `fiscalMode: electronic_ecf` y `documentFormat: electronic`.
- La UI muestra configuracion GISYS en `/settings/tax-receipt`, estado e-CF en lista de facturas y detalle con accion `Consultar GISYS`.
- `fiscal-consumer` ahora mapea a `E32`.

## 3. Runbook primer negocio

Preparar GISYS local:

```powershell
Set-Location C:\Dev\gisys\gisysapi
npm run test:emulator
```

Endpoint local esperado:

```txt
http://127.0.0.1:5001/giclip/us-central1/api/v1
```

Generar/obtener token cliente GISYS para `ventamax`:

```powershell
Set-Location C:\Dev\gisys\gisysapi
npx tsx .\scripts\create-test-client-token.ts
```

Configurar secreto en VentaMas Functions:

```powershell
Set-Location C:\Dev\VentaMas
npx -y firebase-tools@latest functions:secrets:set GISYS_FACT_CLIENT_TOKEN
```

Configurar negocio desde VentaMas:

- Ir a `/settings/tax-receipt`.
- Activar comprobantes fiscales.
- En `Proveedor e-CF GISYS`, activar `Modelo e-CF`.
- Para shadow: dejar `Transporte GISYS` apagado.
- Para emision real local/QA: activar `Transporte GISYS`.
- Base URL: `http://127.0.0.1:5001/giclip/us-central1/api/v1`.
- Instancia GISYS: valor de `integrationInstanceCode` creado en GISYS.
- Contribuyente GISYS: valor de `taxpayerCode` creado en GISYS.
- Guardar.

Prueba:

1. Crear venta con comprobante `CONSUMIDOR FINAL` o `CREDITO FISCAL`.
2. En shadow, verificar que la factura quede con snapshot e-CF sin consumir serie `Bxx`.
3. En transporte activo, verificar `submissionId`, `eNcf`, links y estado.
4. En facturas, abrir detalle y usar `Consultar GISYS`.

Deploy functions afectadas:

```powershell
firebase deploy --only "functions:createInvoiceV2,functions:createInvoiceV2Http,functions:processInvoiceOutbox,functions:refreshElectronicTaxReceiptStatus,functions:updateElectronicTaxReceiptConfig"
```

## 4. Verificacion local

```powershell
npm run test:run:functions -- functions/src/app/modules/electronicTaxReceipts/config/gisysFact.config.test.js functions/src/app/modules/electronicTaxReceipts/services/electronicTaxReceiptOutbox.service.test.js functions/src/app/versions/v2/invoice/services/orchestrator.service.test.js
npm run typecheck:app
npm run test:run -- src/utils/invoice/documentIdentity.test.ts
```

Resultados:

- Functions focal: 3 archivos, 11 tests passed.
- Typecheck app: passed.
- `documentIdentity`: 1 archivo, 2 tests passed.

## 5. Limites honestos

Esto deja VentaMas listo para configurar el primer negocio y hacer la primera prueba real contra GISYS local/QA si GISYS ya tiene cliente, instancia, contribuyente, certificado y series configuradas.

No prueba certificacion DGII TEST/CERT desde esta corrida, ni garantiza PDF/RI final si GISYS devuelve `ARTIFACT_NOT_READY`; esa capacidad depende del estado operativo del proveedor GISYS.
