# Checklist activa de cierre operativo y entrada a eventos

Estado actualizado segun el estado real del repo al `2026-04-05`.

Convencion:

- `[x]` cerrado o presente en codigo
- `[ ]` aun pendiente, incompleto o no validado

## Base operativa

- [x] `settings/accounting` existe como configuracion viva por negocio
- [x] existen `chartOfAccounts` y `accountingPostingProfiles` como configuracion persistente en `settings/accounting`
- [x] `monetary` se reutiliza entre factura, pago, compra y gasto
- [x] `exchangeRates/{rateId}` existe como base estructurada del piloto
- [x] `bankAccounts/{bankAccountId}` existe como base estructurada del piloto
- [x] la politica de `buyRate` / `sellRate` ya esta documentada
- [x] existe historial tecnico para configuracion monetaria, catalogo, perfiles y cuentas bancarias
- [x] existe bitacora visible en `settings/accounting`
- [x] `AccountingEvent` base ya tiene contrato comun en productores y normalizadores principales
- [ ] la politica de periodo todavia no esta cerrada

## Caja, pagos y control interno

- [x] `cashMovements` existe como proyeccion operativa
- [x] ventas POS del piloto proyectan `invoice_pos`
- [x] pagos CxC del piloto proyectan `receivable_payment`
- [x] gastos del piloto proyectan `expense`
- [x] pagos a proveedor del piloto proyectan `supplier_payment`
- [x] `processAccountsReceivablePayment` ya tiene idempotencia fuerte en codigo
- [x] `closeCashCount` ya aplica cierre idempotente en codigo
- [x] el alta manual de `journalEntries` ya sale por backend
- [x] el reverso de `journalEntries` ya sale por backend
- [x] el cierre de periodo ya sale por backend
- [ ] fuera del piloto aun no existe cohorte validada de punta a punta

## Compras y cuentas por pagar

- [x] compras nuevas guardan `paymentTerms`
- [x] compras nuevas guardan `paymentState`
- [x] existe `accountsPayablePayments/{paymentId}` como ledger operativo inicial
- [x] existe ruta propia de `CxP` en `/accounts-payable/list`
- [x] el modulo nuevo ya concentra `Registrar pago` y `Ver pagos`
- [x] `CxP` ya expone `aging`
- [x] `CxP` ya expone evidencia y acceso a contabilidad en el primer corte
- [ ] compras legacy todavia requieren limpieza/manual review donde falten datos confiables

## Datos reales del piloto

- [ ] existe al menos una `bankAccount` real usada y validada en operaciones bancarias del piloto
- [ ] existe al menos una `exchangeRate` real usada y validada en snapshots del piloto
- [ ] no quedan huecos materiales de `bankAccountId`
- [ ] no quedan huecos materiales de `rateId`
- [ ] no quedan huecos materiales de `paymentState` o `paymentTerms`

## Pipeline contable

- [x] `invoice.committed` existe como productor real
- [x] `purchase.committed` existe como productor real
- [x] `accounts_payable.payment.recorded` existe como productor real
- [x] `accounts_payable.payment.voided` existe como productor real
- [x] `expense.recorded` existe como productor real
- [x] existe proyector `accountingEvents -> journalEntries`
- [x] `projection.status` ya existe y se usa en el proyector
- [x] `sourceDocumentType/sourceDocumentId` ya aparecen en la capa de tipos y trazabilidad
- [x] `eventVersion`, `dedupeKey` e `idempotencyKey` ya estan alineados en la cobertura principal
- [x] `dead letters + replay` existen en un primer corte
- [ ] sigue pendiente endurecer cobertura residual y catalogo final de eventos

## Trazabilidad y reportes

- [x] existe `Ver origen` desde la capa contable hacia documentos soportados
- [x] `Libro Mayor`, `Balanza`, `Estado de resultados` y `Balance general` ya tienen callable backend
- [x] esos reportes backend ya usan `journalEntries` como fuente
- [x] ya existe `Ver asiento contable` al menos en documentos operativos soportados del primer corte
- [x] ya existe paginacion del mayor por movimientos
- [ ] sigue pendiente ampliar cobertura total de `Ver asiento contable`
- [ ] sigue pendiente resolver aperturas del mayor sin escanear historico completo
- [ ] sigue pendiente una exportacion estable del mayor para resultados grandes
- [ ] todavia falta decidir si el libro diario tambien debe migrar al mismo modelo backend

## Diferido a la siguiente etapa

- [ ] precio documental y facturacion nativa por moneda no funcional
- [ ] proyecciones auxiliares por cliente, proveedor y banco
- [ ] conciliacion bancaria end-to-end
- [ ] `FX` de anticipos, parciales y revaluacion
