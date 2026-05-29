# Plan MVP RRHH, nomina y comisiones

Fecha: 2026-05-29
Repo: `C:\Dev\VentaMas`
Estado: diseno antes de implementacion

## Resumen ejecutivo

La forma mas sana de implementarlo en VentaMas es crear un modulo nuevo de
`hrPayroll`, pero no como isla. El modulo debe integrarse con tres cosas que ya
existen:

- Facturacion y cobros, donde nace la comision.
- Contabilidad, via `accountingEvents -> journalEntries`.
- Tesoreria/caja/banco, via salidas de efectivo y `cashMovements` cuando aplique.

La decision central es no usar `users/{uid}` como empleado, cliente o proveedor.
Un usuario es acceso al sistema. Una persona o empresa del mundo real debe vivir
en una identidad comun del negocio, y desde ahi puede tener perfiles: empleado,
cliente, proveedor, colaborador comisionable y usuario vinculado.

Esto permite casos reales:

- Un cajero es un usuario con rol operativo `cashier`.
- Ese mismo cajero puede estar vinculado a un empleado activo para nomina.
- Ese empleado puede recibir comisiones por servicios vendidos.
- La misma persona podria ser cliente o proveedor sin duplicar identidad.

## Que aprender de Odoo, ERPNext y Dynamics

### Odoo

Odoo separa varias responsabilidades que conviene copiar:

- `Employees` centraliza expediente, contratos y jerarquia.
- `Payroll` calcula desde contrato, estructura salarial, entradas de trabajo y
  genera payslips.
- `Pay runs` agrupa payslips por periodo, salario/estructura/departamento y
  luego permite crear asiento, reporte de pago y marcar pagado.
- `Payroll commissions` trata la comision como pago al empleado y puede generar
  payslips separados de comision.
- `Sales commissions` define planes por objetivos o logros y calcula desde
  metricas de venta, facturacion, cantidad, margen o MRR.
- `POS multi-employee` permite empleados/cajeros con permisos minimos, basicos o
  avanzados y rastrea el empleado de cada orden.

Leccion para VentaMas: separar "calculo de comision" de "pago por nomina". La
venta genera una comision pendiente; la nomina o corte la aprueba y paga.

### ERPNext / Frappe HR

ERPNext aporta dos ideas utiles:

- `Salary Structure` separa ingresos y deducciones; puede tener formulas o
  montos manuales, frecuencia de pago y cuenta de pago.
- `Salary Slip` toma datos del empleado y de su estructura asignada, y computa
  totales por periodo.
- En ventas, un `Sales Person` se puede vincular a un empleado, y varias personas
  pueden compartir una venta con porcentaje de contribucion.
- Para comisiones de terceros, ERPNext muestra un camino distinto: la comision de
  partner puede no impactar contabilidad hasta pagarse como proveedor.

Leccion para VentaMas: empleado interno y partner externo no son lo mismo. Si es
empleado, va por RRHH/nomina. Si es tercero, puede terminar en proveedor/CxP.

### Microsoft Dynamics 365 Human Resources

Dynamics ayuda con el modelado organizacional:

- `Job` define la funcion o tipo de puesto.
- `Position` es una plaza concreta, con fechas efectivas y relacion de reporte.
- La elegibilidad de compensacion puede depender de departamento, puesto,
  region, funcion, tipo de trabajo y nivel.
- Antes de pagar, valida que el perfil del trabajador este completo: direccion,
  empleo, identificacion, nombre, posicion y compensacion.

Leccion para VentaMas: no conviene empezar con toda la estructura de puestos, pero
si conviene dejar campos para `departmentId`, `jobTitle`, `managerEmployeeId` y
validacion "readyToPay".

## Fuentes consultadas

- Odoo Employees: https://www.odoo.com/documentation/19.0/applications/hr/employees.html
- Odoo Payroll: https://www.odoo.com/documentation/19.0/applications/hr/payroll.html
- Odoo Contracts: https://www.odoo.com/documentation/19.0/applications/hr/payroll/contracts.html
- Odoo Payslips: https://www.odoo.com/documentation/19.0/applications/hr/payroll/payslips.html
- Odoo Pay runs: https://www.odoo.com/documentation/19.0/applications/hr/payroll/pay_runs.html
- Odoo Payroll commissions: https://www.odoo.com/documentation/19.0/applications/hr/payroll/commissions.html
- Odoo Sales commissions: https://www.odoo.com/documentation/19.0/applications/sales/sales/commissions.html
- Odoo POS multi-employee: https://www.odoo.com/documentation/19.0/applications/sales/point_of_sale/employee_login.html
- Frappe HR Salary Slip: https://docs.frappe.io/hr/salary-slip
- Frappe HR Salary Structure: https://docs.frappe.io/hr/salary-structure
- ERPNext Sales Person: https://docs.frappe.io/erpnext/sales-person
- ERPNext Sales Persons in transactions: https://docs.frappe.io/erpnext/sales-persons-in-the-sales-transactions
- ERPNext Sales Commission: https://docs.frappe.io/erpnext/how-to-give-commission-to-sales-partner
- Dynamics 365 Positions: https://learn.microsoft.com/en-us/dynamics365/human-resources/hr-personnel-positions
- Dynamics 365 Jobs: https://learn.microsoft.com/en-us/dynamics365/human-resources/hr-personnel-jobs
- Dynamics 365 Variable compensation: https://learn.microsoft.com/en-us/dynamics365/human-resources/hr-compensation-variable-plans
- Dynamics 365 Ready to pay: https://learn.microsoft.com/en-us/dynamics365/human-resources/hr-compensation-payroll
- DGII ISR 2026: https://dgii.gov.do/cicloContribuyente/obligacionesTributarias/principalesImpuestos/Paginas/impuestoSobreRenta.aspx
- DGII fechas de pago: https://dgii.gov.do/cicloContribuyente/obligacionesTributarias/declaracionPagoImpuestos/Paginas/PagodeImpuesto.aspx
- TSS topes de cotizacion 2026: https://tss.gob.do/tss-informa-nuevos-topes-de-cotizacion-del-regimen-contributivo-del-sdss/
- TSS registro de empleadores: https://tss.gob.do/tipo-servicio/registro-empleadores/

## Decision de modulo

Crear un modulo nuevo:

- Frontend: `src/modules/hrPayroll`
- Backend Functions: `functions/src/app/modules/hrPayroll`
- Tipos frontend: `src/types/hrPayroll.ts`
- Utilidades compartidas: `src/utils/hrPayroll`
- Firebase hooks: `src/firebase/hrPayroll`

Nombre visible en UI:

- "Recursos Humanos"
- Submodulos: "Colaboradores", "Comisiones", "Cortes", "Nomina", "Pagos",
  "Reportes", "Configuracion"

No usar Vue/PrimeVue del prompt original. Este repo usa React, Vite,
styled-components, Firebase client SDK y callable Functions.

## Modelo de identidad recomendado

### `businessParties`

Nueva coleccion por negocio:

`businesses/{businessId}/businessParties/{partyId}`

Representa una persona o empresa real.

Campos:

- `id`
- `businessId`
- `type`: `individual | company`
- `displayName`
- `legalName`
- `documentType`
- `documentId`
- `email`
- `phone`
- `status`: `active | inactive`
- `linkedUserIds`: `string[]`
- `profileRefs`:
  - `employeeId`
  - `clientId`
  - `providerId`
  - `commissionCollaboratorId`
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`

Regla: el party no reemplaza clientes/proveedores/usuarios. Los conecta.

### Usuarios y miembros

Mantener:

- `users/{uid}` como perfil de acceso global.
- `businesses/{businessId}/members/{uid}` como membresia y rol operativo.

Agregar opcionalmente:

- `users/{uid}.partyLinks.{businessId}.partyId`
- `businesses/{businessId}/members/{uid}.partyId`

Esto permite que un usuario sea `cashier` y al mismo tiempo este vinculado a un
empleado o cliente.

### Clientes y proveedores

Mantener colecciones actuales:

- `businesses/{businessId}/clients/{clientId}`
- `businesses/{businessId}/providers/{providerId}`

Agregar opcional:

- `partyId`
- `partySnapshot`

No migrar todo de golpe. Para el MVP, solo crear party cuando el flujo lo necesite
o cuando se vincule manualmente.

### Empleados / colaboradores

Nueva coleccion:

`businesses/{businessId}/hrEmployees/{employeeId}`

Campos minimos:

- `id`
- `businessId`
- `partyId`
- `linkedUserId`
- `code`
- `fullName`
- `documentId`
- `email`
- `phone`
- `status`: `active | inactive`
- `employmentType`: `employee | contractor | partner`
- `payType`: `salary | commission_only | salary_plus_commission`
- `baseSalaryAmount`
- `commissionEnabled`
- `defaultPaymentMethod`: `bank_transfer | cash | check`
- `bankAccountMasked`
- `departmentId`
- `jobTitle`
- `managerEmployeeId`
- `readyToPayStatus`: `ready | incomplete`
- `readyToPayIssues`: `string[]`
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`

Un cajero normal:

- Es `users/{uid}` + `members/{uid}.role = cashier`.
- Si cobra nomina o comision, tambien tiene `hrEmployees/{employeeId}`.
- Si no cobra nomina/comision, no necesita empleado.

## Comisiones

### Relacion con lo existente

Hoy ya existen:

- `businesses/{businessId}/serviceCommissionCollaborators`
- `businesses/{businessId}/serviceCommissions`
- UI de reporte en `/bills/service-commissions`
- Logica backend en `functions/src/app/modules/commissions/services/serviceCommissions.service.js`

No conviene borrarlo. El MVP debe absorberlo gradualmente:

1. `serviceCommissionCollaborators` pasa a poder vincularse con `hrEmployeeId`
   y `partyId`.
2. Las comisiones nuevas deben terminar como `hrCommissionEntries`.
3. `serviceCommissions` puede quedar como vista operacional legacy o snapshot de
   origen mientras se migra.

### `hrCommissionRules`

`businesses/{businessId}/hrCommissionRules/{ruleId}`

Campos:

- `id`
- `businessId`
- `name`
- `status`: `active | inactive`
- `appliesTo`: `invoice | invoice_item | service_item`
- `calculationBase`: `subtotal | paid_amount | netSubtotalWithoutTax | manual`
- `rateType`: `percentage | fixed`
- `rateValue`
- `triggerEvent`: `invoice_committed | invoice_paid | invoice_partially_paid | manual`
- `payOnlyWhenFullyPaid`
- `allowPartialCommission`
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`

MVP recomendado:

- `service_item`
- `netSubtotalWithoutTax`
- `percentage | fixed`
- `triggerEvent = invoice_committed` inicialmente como calculada
- `recognitionMode = on_period_approval`

Despues se agrega elegibilidad por cobro parcial/completo.

### `hrCommissionEntries`

`businesses/{businessId}/hrCommissionEntries/{entryId}`

Campos:

- `id`
- `businessId`
- `employeeId`
- `employeeCode`
- `employeeNameSnapshot`
- `partyId`
- `invoiceId`
- `invoiceNumber`
- `invoiceItemId`
- `customerId`
- `customerNameSnapshot`
- `sourcePaymentId`
- `sourceType`: `invoice_line | invoice_payment | manual_adjustment`
- `commissionRuleId`
- `commissionRuleNameSnapshot`
- `calculationBase`
- `baseAmount`
- `rateType`
- `rateValue`
- `commissionAmount`
- `currency`
- `status`: `calculated | eligible | included_in_cut | approved | paid | reversed | cancelled | requires_adjustment`
- `periodId`
- `payrollRunId`
- `employeePaymentId`
- `accountingEventId`
- `journalEntryId`
- `dedupeKey`
- `createdAt`, `createdBy`, `updatedAt`, `updatedBy`

Idempotencia:

`businessId + invoiceId + invoiceItemId + sourcePaymentId + employeeId + commissionRuleId`

Si no hay pago aun, `sourcePaymentId = committed`.

## Cortes y nomina

### `hrCommissionPeriods`

`businesses/{businessId}/hrCommissionPeriods/{periodId}`

Campos:

- `id`
- `businessId`
- `name`
- `startDate`
- `endDate`
- `status`: `open | closed | approved | paid | cancelled`
- `totalCommissionAmount`
- `totalEmployees`
- `payrollRunId`
- `accountingEventId`
- `journalEntryId`
- `createdAt`, `createdBy`, `closedAt`, `closedBy`, `approvedAt`, `approvedBy`

Reglas:

- Abierto: se puede recalcular.
- Cerrado: bloquea entradas incluidas.
- Aprobado: genera devengo contable.
- Pagado: no se modifica.

### `hrPayrollRuns`

`businesses/{businessId}/hrPayrollRuns/{payrollRunId}`

Campos:

- `id`
- `businessId`
- `type`: `commission_only | base_salary | base_salary_plus_commission`
- `periodId`
- `status`: `draft | approved | partially_paid | paid | cancelled`
- `paymentDate`
- `paymentMethod`: `bank_transfer | cash | check | mixed`
- `grossBaseSalaryAmount`
- `grossCommissionAmount`
- `deductionsAmount`
- `netAmount`
- `accountingStatus`: `pending | posted | reversed`
- `accountingEventId`
- `journalEntryId`
- `createdAt`, `createdBy`, `approvedAt`, `approvedBy`, `paidAt`, `paidBy`

### `hrPayrollEmployeeLines`

`businesses/{businessId}/hrPayrollEmployeeLines/{lineId}`

Campos:

- `id`
- `businessId`
- `payrollRunId`
- `periodId`
- `employeeId`
- `employeeCode`
- `employeeNameSnapshot`
- `baseSalaryAmount`
- `commissionAmount`
- `deductionsAmount`
- `netAmount`
- `paymentMethod`
- `paymentReference`
- `status`: `pending | approved | paid | cancelled`
- `commissionEntryIds`
- `employeePaymentId`
- `createdAt`, `updatedAt`

### `hrEmployeePayments`

`businesses/{businessId}/hrEmployeePayments/{paymentId}`

Campos:

- `id`
- `businessId`
- `payrollRunId`
- `payrollLineId`
- `employeeId`
- `employeeCode`
- `amount`
- `paymentMethod`: `bank_transfer | cash | check`
- `paymentDate`
- `bankAccountId`
- `cashAccountId`
- `checkNumber`
- `transferReference`
- `status`: `draft | confirmed | voided`
- `accountingEventId`
- `journalEntryId`
- `cashMovementId`
- `createdAt`, `createdBy`, `confirmedAt`, `confirmedBy`, `voidedAt`, `voidedBy`

## Contabilidad

Usar el pipeline existente, no escribir asientos sueltos salvo que sea una
herramienta administrativa especial.

Agregar tipos de evento:

- `hr_commission.accrued`
- `hr_payroll.payment.recorded`
- `hr_payroll.payment.voided`
- Futuro: `hr_salary.accrued`, `hr_payroll.deduction.recorded`

Agregar amount sources:

- `hr_commission_amount`
- `hr_payroll_base_salary_amount`
- `hr_payroll_net_amount`
- `hr_payroll_deductions_amount`

Perfiles base sugeridos:

Devengo de comision:

- Debito: gasto de comisiones de venta.
- Credito: comisiones por pagar a empleados.

Pago:

- Debito: comisiones por pagar o nomina por pagar.
- Credito: banco, caja o cheques por emitir segun metodo.

Regla MVP:

- Calcular la comision desde factura.
- Reconocer el gasto al aprobar el corte.
- Pagar solo si el devengo fue posteado o si configuracion explicita permite
  pago sin devengo. Recomendado: no permitirlo.

## Localizacion dominicana

No meter ISR/TSS automatico en el primer MVP.

Si se implementa nomina legal completa mas adelante:

- Usar configuracion versionada por vigencia, no hardcode.
- DGII publica escala de ISR de asalariados 2026.
- DGII indica presentacion mensual IR-3 a mas tardar dia 10.
- TSS publico topes de cotizacion vigentes desde 2026-02-01.
- TSS requiere registro de empleadores en SUIR para empresas con trabajadores
  formales.

Para MVP:

- Deducciones manuales en cero o capturadas manualmente.
- Campo `deductionsAmount`.
- Campo `deductionLines` futuro.
- Etiqueta visible: "No calcula ISR/TSS automaticamente".

## Flujos MVP

### Flujo 1: crear empleado

1. Admin crea `businessParty`.
2. Admin crea `hrEmployee` con `partyId`.
3. Opcional: vincula `linkedUserId`.
4. El sistema valida `code` unico por negocio.
5. El sistema calcula `readyToPayStatus`.

### Flujo 2: asignar comision en venta

1. En item de servicio se selecciona colaborador/empleado.
2. Se muestra comision estimada.
3. Factura guarda snapshot de empleado/regla.
4. Al finalizar factura, backend crea/actualiza entrada idempotente.

### Flujo 3: corte

1. Admin crea corte con rango.
2. Backend busca `hrCommissionEntries` elegibles.
3. Agrupa por empleado.
4. Marca como `included_in_cut`.
5. Permite revisar detalle antes de aprobar.

### Flujo 4: aprobacion

1. Admin aprueba corte.
2. Backend crea `hrPayrollRun`.
3. Backend crea `hrPayrollEmployeeLines`.
4. Backend emite `accountingEvent` de devengo.
5. Proyeccion genera `journalEntry`.

### Flujo 5: pago

1. Admin confirma pago por linea o por corrida.
2. Backend crea `hrEmployeePayment`.
3. Backend emite `accountingEvent` de pago.
4. Backend crea `cashMovements` si se paga desde caja/banco compatible con el
   modelo actual.
5. Marca linea, corrida y comisiones como pagadas cuando todo cierre.

## Seguridad

Roles iniciales por grupos existentes:

- Lectura RRHH: owner, admin, manager.
- Escritura empleados/reglas: owner, admin.
- Cerrar cortes: owner, admin, manager.
- Aprobar cortes: owner, admin.
- Confirmar pagos: owner, admin.
- Lectura limitada de comisiones propias: futuro, requiere portal/empleado.

No dar acceso a `cashier` por defecto a pantallas de nomina.

Firestore:

- Nuevas colecciones financieras criticas deben ser write=false desde cliente.
- Lectura bajo `hasBusinessAccess` o permisos especificos.
- Mutaciones por callables.
- Excepcion temporal: catalogos no criticos pueden escribirse por cliente solo
  si el equipo decide ir rapido, pero no recomendado para nomina.

## Plan de implementacion incremental

### P0: checkpoint

Antes de tocar codigo del MVP:

1. Revisar cambios actuales del repo.
2. Ejecutar pruebas focalizadas de e-CF, factura y comisiones existentes.
3. Commit y push de lo ya existente.

### P1: base de identidad y empleados

Archivos esperados:

- `src/types/hrPayroll.ts`
- `src/firebase/hrPayroll/useHrEmployees.ts`
- `src/modules/hrPayroll/pages/HrEmployeesPage`
- `functions/src/app/modules/hrPayroll/functions/manageHrEmployee.js`
- `functions/src/app/modules/hrPayroll/services/hrEmployees.service.js`
- `firestore.rules`
- rutas y menu

Entrega:

- Crear/listar/editar empleados.
- Vincular empleado a usuario existente.
- Crear `businessParty` al crear empleado si no se selecciona uno.

### P2: reglas y entradas de comision

Archivos esperados:

- `functions/src/app/modules/hrPayroll/services/hrCommissionEntries.service.js`
- `functions/src/app/modules/hrPayroll/functions/recalculateHrCommissionEntries.js`
- `src/modules/hrPayroll/pages/HrCommissionsPage`
- adaptacion de `serviceCommissions.service.js`

Entrega:

- Regla simple por defecto.
- Generar `hrCommissionEntries` desde comisiones de servicio existentes.
- Idempotencia.
- Vista de entradas por empleado/factura/estado.

### P3: cortes y aprobacion

Entrega:

- Crear corte por rango.
- Incluir entradas elegibles.
- Cerrar y aprobar.
- Crear `hrPayrollRun` y lineas.
- Emitir `hr_commission.accrued`.

### P4: pagos

Entrega:

- Confirmar pago por transferencia, efectivo o cheque.
- Emitir `hr_payroll.payment.recorded`.
- Actualizar estados.
- Reporte de trazabilidad.

### P5: localizacion y nomina real

Entrega futura:

- Componentes salariales.
- Deducciones manuales y luego automáticas.
- Versionado ISR/TSS.
- Reportes IR-3/TSS si se decide entrar en cumplimiento formal.

## Pruebas minimas

Backend:

- Crear empleado con codigo unico.
- Rechazar codigo duplicado.
- Rechazar comision para empleado inactivo.
- Crear entrada idempotente desde factura/item.
- Reprocesar misma factura sin duplicar.
- Crear corte y agrupar por empleado.
- Aprobar corte y generar evento contable.
- Confirmar pago y generar evento de pago.
- Rechazar doble pago.

Frontend:

- Render de lista de empleados.
- Formulario de empleado no usa `setState` derivado directo en `useEffect`.
- Vista de comisiones filtra por estado/empleado.
- Corte muestra totales consistentes.

Integracion contable:

- `hr_commission.accrued` proyecta asiento balanceado.
- `hr_payroll.payment.recorded` proyecta asiento balanceado.
- Si faltan cuentas, queda `pending_account_mapping`.

## Riesgos y decisiones abiertas

- El repo ya tiene `serviceCommissions`; duplicar otra comision sin migracion
  generaria confusion. Por eso P2 debe conectar, no competir.
- Pago por caja/banco debe respetar `cashMovements`; no basta con marcar pagado.
- ISR/TSS no debe simularse a medias. Se deja manual/versionado hasta decidir
  alcance legal.
- El prompt original pide endpoints REST y Vue. En este repo se deben usar
  callable Functions y React.
- Definir si `contractor` pagado por factura debe ir por proveedor/CxP en vez de
  nomina. Recomendacion: si no es empleado, tratarlo como proveedor/partner en
  fase posterior.

## Recomendacion final

Yo lo haria asi:

1. Crear `businessParties` y `hrEmployees` como base limpia.
2. Vincular usuarios, clientes y proveedores por `partyId`, sin migracion masiva.
3. Convertir colaboradores de comisiones actuales en empleados comisionables.
4. Generar `hrCommissionEntries` desde el flujo actual de factura/servicio.
5. Crear cortes y payroll runs antes de pagos.
6. Postear contabilidad solo desde `accountingEvents`.
7. Dejar nomina dominicana legal completa para una segunda etapa con parametros
   versionados y validacion contable/legal.

