# Plan Backlog: Integracion DGII e-CF (con convivencia NCF actual)

Fecha: 2026-02-16
Estado: Backlog (no iniciar implementacion sin respuestas previas)

## 1) Objetivo

Definir una ruta para agregar facturacion electronica oficial DGII (e-CF) en la app, comparando contra lo que hoy existe (NCF secuencial interno), y decidir si conviven ambos esquemas o si uno reemplaza al otro.

## 2) Hallazgos de investigacion oficial (internet)

1. El portal DGII centraliza documentacion tecnica, formatos XML/XSD y documentos operativos; el listado publico muestra actualizaciones recientes (ej. instructivo de contingencia actualizado el 10-feb-2026).
2. Marco legal publicado por DGII:
   - `Ley 32-23` (facturacion electronica obligatoria).
   - `Decreto 587-24` (reglamento).
   - Avisos de prorroga para entrada obligatoria por segmentos:
     - `Aviso 20-24`: extension de 6 meses para grandes contribuyentes locales (desde `15-may-2025`).
     - `Aviso 12-25`: extension de 6 meses para medianos contribuyentes y grandes contribuyentes locales (`hasta 15-nov-2025`).
3. Calendario de implementacion por segmentos en DGII:
   - Grandes contribuyentes nacionales y grandes locales: fechas legales originales con periodos y prorroga indicadas en avisos.
   - Medianos y demas contribuyentes: plazos diferenciados por cantidad de meses desde vigencia.
4. Formatos e-CF:
   - Tipos listados en documentacion tecnica: `31, 32, 33, 34, 41, 43, 44, 45`.
   - Reglas de firma digital, codigos de seguridad (incluyendo condiciones para e-CF de consumo) y estructura XML.
5. Servicios DGII:
   - Servicios de autenticacion y recepcion (FC/NC), con URLs para certificacion y produccion en guias oficiales.
6. Certificacion:
   - DGII exige certificacion del sistema (propio o proveedor) previo a operar en produccion, con ambiente de pruebas dedicado.
7. Operacion:
   - Existe proceso formal de contingencia.
   - FAQ oficial indica que un e-CF no enviado/no validado en DGII no tiene validez fiscal.
   - FAQ oficial tambien indica: custodia de XML por 10 anos y que cuando el 100% de comprobantes son electronicos no se remiten formatos 607/608.

## 3) Estado actual en el codigo (lo implementado hoy)

### 3.1 Facturacion fiscal actual es NCF interno (serie B)

- `functions/src/app/modules/taxReceipt/config/ncfTypes.ts:11` a `functions/src/app/modules/taxReceipt/config/ncfTypes.ts:18`:
  - Mapea `B01`, `B02`, `B15`.
- `src/firebase/taxReceipt/taxReceiptTemplates.ts:14`:
  - Plantillas RD con foco en serie B.
- `src/firebase/taxReceipt/taxReceiptTemplates.ts:22`, `src/firebase/taxReceipt/taxReceiptTemplates.ts:33`, `src/firebase/taxReceipt/taxReceiptTemplates.ts:43`, `src/firebase/taxReceipt/taxReceiptTemplates.ts:54`:
  - Configura tipos/series como `B+01/02/15/04`.

### 3.2 Generacion de NCF es secuencial local

- `functions/src/app/versions/v2/invoice/services/ncf.service.js:11`:
  - `reserveNcf(...)` reserva NCF local.
- `functions/src/app/versions/v2/invoice/services/ncf.service.js:71`:
  - Reintentos `MAX_ATTEMPTS`.
- `functions/src/app/versions/v2/invoice/services/ncf.service.js:119` y `functions/src/app/versions/v2/invoice/services/ncf.service.js:128`:
  - Registra `ncfUsage` con `status: 'pending'`.

### 3.3 V2 de facturacion depende de `ncfType` interno (no e-CF DGII)

- `functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.js:126` a `functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.js:131`:
  - Si NCF esta habilitado, exige `ncfType`.
- `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:123` a `functions/src/app/versions/v2/invoice/services/orchestrator.service.js:135`:
  - Reserva NCF dentro de orquestacion/outbox.

### 3.4 No hay integracion e-CF DGII en flujo fiscal principal

- Busqueda en modulos fiscales relevantes sin resultados para keywords operativas de e-CF (`TrackId`, `E31`, `Recepcion`, etc.) en `functions/src`, `src/services/invoice`, `src/firebase/taxReceipt`, `src/modules/settings/pages/setting/subPage/TaxReceipts`:
  - Resultado: `NO_MATCH_ECF_KEYWORDS`.

### 3.5 Lo que si existe de DGII hoy

- Consulta de RNC en frontend contra tabla `rnc` en Supabase:
  - `src/hooks/useRncSearch.ts:141` y `src/hooks/useRncSearch.ts:142`.
- Opcion `e-CF` aparece en formulario de proveedor (metadato de contacto), no en pipeline fiscal de facturacion:
  - `src/modules/contacts/pages/Contact/Provider/components/CreateContact/constants.ts:76`
  - `src/modules/contacts/pages/Contact/Provider/components/CreateContact/ProviderForm.tsx:463`.

## 4) Brecha funcional (gap)

1. Hoy generamos NCF interno; DGII e-CF requiere XML firmado + servicios DGII + estado/acuse oficial.
2. Falta modelo de datos e-CF (trackId, estado DGII, XML firmado, acuse, contingencia).
3. Falta manejo de certificado digital para firma XML.
4. Falta pipeline de envio/consulta DGII (certificacion y produccion).
5. Falta operacion de contingencia y reintentos segun lineamientos DGII.

## 5) Convivencia vs reemplazo: recomendacion

Recomendacion: **convivencia por fases** (`hybrid`) y no reemplazo inmediato.

Motivo:
1. El flujo actual NCF ya esta integrado a POS, inventario, CxC y outbox V2.
2. e-CF agrega dependencias externas (firma, API DGII, certificacion, contingencia) que elevan riesgo de corte operativo.
3. Un corte "big bang" puede afectar facturacion diaria.

Propuesta de modo operativo:
1. `mode = ncf_legacy`:
   - Se mantiene flujo actual.
2. `mode = ecf_only`:
   - Todas las facturas fiscales pasan por e-CF.
3. `mode = hybrid`:
   - Regla por tipo de documento/cliente/canal (ej. pilotos por sucursal o por caja).

## 6) Backlog tecnico propuesto

## Fase 0: Decisiones de negocio/regulatorias

1. Definir alcance inicial: solo facturas (31/32) o incluir notas (34) desde inicio.
2. Definir politica de convivencia por negocio.
3. Definir responsable del certificado digital y operacion de contingencia.

## Fase 1: Modelo de datos e-CF

1. Crear entidad fiscal v2 (`fiscalDocument`) separada de `ncfUsage`.
2. Campos minimos:
   - `fiscalMode`, `ecfType`, `eNCF`, `trackId`, `dgiiStatus`, `signedXmlHash`, `sentAt`, `acceptedAt`, `contingency`.
3. Relacionar `invoiceId` con documento fiscal (1:1).

## Fase 2: Integracion DGII (backend)

1. Servicio de firma XML (certificado, sellado de tiempo, validaciones XSD).
2. Servicio de autenticacion DGII.
3. Servicio de recepcion e-CF y consulta de estado por `trackId`.
4. Manejo de errores/reintentos idempotentes.

## Fase 3: Orquestacion con Invoice V2

1. Agregar tarea outbox `issueEcf`.
2. Estados propuestos:
   - `pending_fiscal`, `submitted_dgii`, `accepted_dgii`, `rejected_dgii`, `contingency_pending`.
3. Regla de negocio:
   - Definir si entrega al cliente ocurre en `submitted` o solo en `accepted`.

## Fase 4: UI y operacion

1. Dashboard de estado fiscal por factura.
2. Reintento manual y bitacora de errores DGII.
3. Flujo de contingencia con cola y reproceso.
4. Alertas (token vencido, certificado por vencer, rechazos recurrentes).

## Fase 5: Piloto y rollout

1. Habilitar por feature flag por negocio/caja.
2. Certificar ambiente y ejecutar pruebas de punta a punta.
3. Expandir por cohortes, con rollback a `ncf_legacy` si hay incidentes.

## 7) Nota obligatoria antes de empezar

**No iniciar desarrollo hasta responder estas preguntas:**

1. Alcance regulatorio exacto por segmento del negocio en DGII (fecha y obligacion vigente del contribuyente objetivo).
2. Si se implementara motor propio certificado o proveedor autorizado DGII.
3. Tipos e-CF de primer release (`31/32` solamente o tambien `34`, etc.).
4. Regla de convivencia inicial (`ncf_legacy`, `hybrid`, `ecf_only`) y criterio de enrutamiento.
5. Politica de continuidad de venta ante caida DGII (contingencia operativa y SLA interno).
6. Criterio fiscal para marcar factura como "finalizada" en POS (enviada vs aceptada por DGII).

## 8) Fuentes oficiales consultadas

1. DGII - Facturacion Electronica (documentacion oficial):  
   https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/documentacionSobreFacturacionElectronica.aspx
2. DGII - Marco legal y avisos (incluye Ley 32-23, Decreto 587-24, Aviso 12-25):  
   https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/marcoLegal/Paginas/default.aspx
3. DGII - Calendario/listado de contribuyentes y plazos:  
   https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/listadoContribuyentes/Paginas/default.aspx
4. DGII - Servicio de consulta de e-NCF y estados:  
   https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscales/Paginas/consultaComprobantesFiscales.aspx
5. DGII - Proceso de certificacion de sistemas para e-CF (PDF):  
   https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Documentacin%20sobre%20eCF/Proceso%20de%20Certificaci%C3%B3n%20de%20Sistemas%20de%20Facturaci%C3%B3n%20para%20e-CF.pdf
6. DGII - Instructivo de contingencia e-CF (actualizado 10-feb-2026):  
   https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Documentacin%20sobre%20eCF/Instructivo%20sobre%20contingencia%20de%20facturacion%20electronica.pdf
7. DGII - Herramienta gratuita de facturacion electronica:  
   https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/herramientaGratuitaFacturacionElectronica.aspx
8. DGII - Preguntas frecuentes e-CF (PDF):  
   https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Documentacin%20sobre%20eCF/Preguntas%20Frecuentes%20Facturaci%C3%B3n%20Electr%C3%B3nica%20v2%20(1).pdf
