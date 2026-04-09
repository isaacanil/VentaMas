# Plan Backlog: Analisis Gap Agroveterinaria (sin iniciar implementacion)

Fecha: 2026-02-16
Estado: Backlog (no iniciar implementacion sin respuestas previas)
Fuente principal: `C:\Users\jonat\Downloads\Transcripcion del Audio (Veterinaria)_.pdf`
Soporte de extraccion: `plans/backlog/_tmp_veterinaria_transcripcion.normalizado.txt`

## 1) Resumen ejecutivo

La app actual ya cubre gran parte del flujo comercial (ventas, compras, inventario, cuentas por cobrar, pagos mixtos y cuadre de caja), pero no cubre el dominio clinico veterinario.

Recomendacion: **no reemplazar lo actual**. Lo correcto es **convivencia por capacidades**:

1. Mantener el core comun para todos los negocios.
2. Agregar capacidades especificas para `agroveterinaria` por tipo de negocio + feature flags.
3. Encender solo los modulos clinicos/agro cuando aplique.

## 2) Requerimientos detectados en la entrevista (audio)

1. Facturacion de venta y compra.
2. Registro de costo, precio de venta, calculo de porcentaje de ganancia y descuentos.
3. Manejo de impuesto.
4. Alertas de vencimiento de medicamentos.
5. Ubicacion fisica por estante/fila/segmento.
6. Servicios (consulta, vacunacion, desparasitacion, peluqueria, fumigacion, abono, inseminacion, visitas a granja).
7. Cobro mixto (efectivo/tarjeta/transferencia).
8. Cuentas por cobrar con abonos parciales.
9. Cuadre de caja.
10. Salidas de inventario no comerciales (danado/perdido/consumo interno "conduce").
11. Compras por rotacion y proveedor.
12. Flujo de revision/autorizacion de precios por otro rol.
13. Ficha de mascota + propietario, historial clinico, analisis y recetas con firma del doctor.

## 3) Comparativo: que ya tenemos vs que falta

| Requerimiento | Estado actual | Evidencia tecnica | Gap |
|---|---|---|---|
| Tipos de negocio | Parcial | Solo `general` y `pharmacy` en `src/modules/settings/pages/setting/subPage/BusinessEditor/BusinessCreator.tsx:103` y `src/modules/settings/pages/setting/subPage/BusinessEditor/BusinessCreator.tsx:104` (tambien en `src/modules/settings/pages/setting/subPage/BusinessEditor/components/BusinessProfileSections.tsx:300`) | Falta tipo `agroveterinaria` |
| Servicios facturables | Parcial | Item type `service` en `src/features/updateProduct/updateProductSlice.ts:12` y selector "producto/servicio/combo" en `src/components/modals/ProductForm/components/sections/ProductInfo.tsx:152` | Existe facturacion de servicios, pero no flujo de agenda/orden de servicio agro |
| Costo/precio/impuesto/margen | Cumplido | `Costo/Impuesto` en `src/components/modals/ProductForm/components/sections/PriceInfo.tsx:36` y `src/components/modals/ProductForm/components/sections/PriceInfo.tsx:50`; margen/itbis en `src/components/modals/ProductForm/components/sections/PriceCalculator.tsx:52` y `src/components/modals/ProductForm/components/sections/PriceCalculator.tsx:62` | Sin gap critico para este punto |
| Descuentos porcentuales | Cumplido | Presets 5/10/15/20/25/50 en `src/components/modals/ProductDiscountModal/ProductDiscountModal.tsx:54` | Sin gap critico para este punto |
| Alertas de vencimiento | Parcial | Vencimiento en lote UI `src/modules/inventory/pages/Inventory/components/Warehouse/components/ProductStockOverview/components/BatchGroup.tsx:226`; digest programado incluye productos por vencer `functions/src/app/modules/Inventory/functions/stockAlertsDailyDigest.js:709` | No se ve configuracion clara por negocio para "dias de antelacion" especificos |
| Ubicaciones estante/fila/segmento | Cumplido | Jerarquia `warehouse/shelf/row/segment` en `src/modules/inventory/pages/Inventory/components/Warehouse/Warehouse.tsx:21` y `src/modules/inventory/pages/Inventory/components/Warehouse/Warehouse.tsx:149`; filtro de ubicaciones en `src/modules/inventory/pages/Inventario/pages/ItemsManager/components/InvetoryFilterAndSort/components/Body/components/FilterPanel/FilterPanel.tsx:371` | Sin gap critico |
| Cobro mixto | Cumplido | Metodos `cash/card/transfer` en `src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/PaymentMethods/PaymentMethods.tsx:69` | Sin gap critico |
| CxC con abonos | Cumplido | Opcion `partial` (abono) en `src/utils/accountsReceivable/accountsReceivable.ts:78` y tipo `SubmitPaymentOption` en `src/modules/accountsReceivable/components/PaymentForm/utils/paymentFormTypes.ts:31` | Sin gap critico |
| Cuadre de caja requerido para facturar | Cumplido | Bloqueo si no hay caja abierta en `functions/src/app/versions/v2/invoice/controllers/createInvoiceHttp.controller.js:171` | Sin gap critico |
| Salidas no comerciales / conduce | Parcial | Motivos de baja `damaged/expired/lost/other` en `src/modules/inventory/pages/Inventory/components/Warehouse/components/DetailView/components/MovementsTable.tsx:198`; modulo salida producto en `src/modules/inventory/pages/Inventario/pages/ProductOutflow/ProductOutflow.tsx:109` | No existe concepto formal de "conduce" con documento y regla contable propia |
| Compras y proveedores por rotacion | Parcial | Compras y proveedores (`src/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/Purchases.tsx:5`), reporte por proveedor (`src/modules/orderAndPurchase/pages/OrderAndPurchase/Compra/components/PurchasesReport/PurchasesReport.tsx:66`) | Falta reposicion automatica por rotacion (sugerencias de compra) |
| Revision por otro rol para cambios sensibles | Parcial | Hay autorizacion con PIN para descuentos (`src/modules/sales/pages/Sale/components/Cart/components/InvoiceSummary/InvoiceSummary.tsx:155`) | No se ve flujo especifico de "captura factura vs aprobacion de precios de compra" |
| Ficha mascota, historial clinico, analisis, receta veterinaria firmada | No cubierto | Modelo cliente actual es persona generica (`name/tel/address/personalID`) en `src/features/clientCart/clientCartSlice.ts:33`; busquedas de terminos veterinarios sin coincidencias (`agroveterinaria`, `mascota`, `historial clinico`, etc.) | Requiere modulo nuevo (paciente veterinario + historia clinica + recetas) |

## 4) Propuesta de convivencia (sin romper general/farmacia)

### 4.1 Estrategia recomendada

1. Mantener el core actual compartido: ventas, inventario, compras, CxC, caja.
2. Agregar `businessType: 'agroveterinaria'` (o `agroveterinary`).
3. Evitar condicionales duros por tipo en toda la app; mover a `features` por negocio.
4. Mantener reglas actuales de farmacia (ej. seguro) sin cambio de comportamiento.

### 4.2 Capacidades (feature flags) sugeridas

1. `features.vetClinicalRecords`
2. `features.vetPrescriptions`
3. `features.agroFieldServices`
4. `features.inventoryOutflowVoucher` (conduce)
5. `features.procurementByRotation`

Con esto, un negocio puede ser `agroveterinaria` y activar solo lo necesario; tambien permite usar funciones agro en un negocio similar sin forzar todo el paquete.

## 5) Backlog propuesto (no ejecutar aun)

## Fase 0 - Discovery funcional (obligatoria)

1. Confirmar alcance: solo consulta y farmacia, o tambien servicios clinicos completos.
2. Definir que es "conduce" para ustedes (documento, aprobacion, impacto contable/reportes).
3. Validar si la receta debe llevar firma digital, imagen o solo texto impreso.

## Fase 1 - Base multi-negocio agroveterinaria

1. Agregar `agroveterinaria` en alta/edicion de negocio.
2. Crear matriz de capacidades por negocio (`features`).
3. Mostrar/ocultar menus y pantallas segun capacidades.

## Fase 2 - Dominio veterinario clinico

1. Entidad `PetPatient` (mascota) vinculada a `Client` (propietario).
2. Entidad `ClinicalEncounter` (consulta, diagnostico, tratamiento, analisis).
3. Entidad `VetPrescription` (receta con plantilla del establecimiento + firma).

## Fase 3 - Servicios agro y operacion de campo

1. Catalogo de servicios agro (fumigacion, abono, inseminacion, visita a granja).
2. Orden de servicio con estado (pendiente/en curso/completado).
3. Facturacion directa desde orden de servicio.

## Fase 4 - Inventario especializado

1. Documento formal de salida tipo "conduce".
2. Motivos configurables (consumo interno, perdida, danado, vencido, uso clinico).
3. Reglas de impacto en reportes para no mezclar estas salidas con ventas.

## Fase 5 - Compras por rotacion y control de precios

1. Sugerencias de compra por rotacion historica.
2. Flujo de aprobacion de cambios de precio por rol (captura -> revision -> aprobado).
3. Trazabilidad de quien capturo vs quien aprobo.

## 6) Nota obligatoria antes de implementar

**No iniciar implementacion de este plan hasta responder y aprobar este checklist:**

1. Que version del alcance quieren en MVP (solo comercial vs comercial + clinico).
2. Estructura real de ficha de mascota (campos minimos obligatorios).
3. Reglas exactas de receta (formato, firma, datos legales).
4. Definicion exacta de "conduce" y como debe verse en reportes.
5. Que servicios agro deben salir en fase 1 y cuales en fase 2.
6. Roles reales para aprobacion de precios y limites de autorizacion.
7. Si requieren migracion de datos historicos manuales al nuevo modulo.

## 7) Recomendacion final de arquitectura

No hacer un fork de app por sector. Hacer una sola app con:

1. Core comun reutilizable.
2. Capas por capacidades (`features`) activadas por negocio.
3. `businessType` como preset inicial, no como unico control.

Esto permite que `general`, `pharmacy` y `agroveterinaria` convivan sin reemplazos forzados.
