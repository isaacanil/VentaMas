# Backlog activo

Actualizado: `2026-04-23`

Este backlog ya no se ordena por cronologia del piloto.

Se organiza por tracks para no mezclar:

- brechas estructurales
- endurecimiento operativo
- pipeline contable

## Lo que ya salio del backlog inmediato

Estos frentes ya no deben seguir listados como si estuvieran en cero:

- asiento manual via backend
- reverso de asiento via backend
- cierre de periodo via backend
- productor `invoice.committed`
- productor `purchase.committed`
- productores `accounts_payable.payment.*` y `expense.recorded`
- proyector inicial `accountingEvents -> journalEntries`
- `dead letters + replay` en primer corte
- reportes backend base sobre `journalEntries`
- paginacion base del mayor en backend
- ruta propia de `CxP`
- `CxP` usable con `aging`, evidencia y acceso a contabilidad
- boton `Ver origen` desde la capa contable
- bitacora visible en `settings/accounting`

Siguen teniendo pendientes alrededor, pero ya no son backlog "por abrir".

## Reglas absorbidas de documentos archivados

Estas reglas vienen del lote archivado el `2026-04-23` y siguen vigentes como criterio de arquitectura:

- Los pagos reales viven en ledgers del dominio operativo; no existe una coleccion global `payments` como source of truth.
- `cashMovements` es proyeccion operativa para caja, banco, cuadre y auditoria; no sustituye `accountsReceivablePayments` ni `accountsPayablePayments`.
- `purchase.paymentAt` queda como compatibilidad legacy o vencimiento esperado; no prueba pago real.
- `accountsPayablePayments` es la verdad operativa del pago proveedor; cada pago debe tener recibo, evidencia, metodo, referencia y trazabilidad.
- Compras debe separar estado operativo de recepcion (`workflowStatus`) de estado financiero (`paymentState`).
- No se deben inventar pagos legacy por heuristica desde `paymentAt`, `condition` o `status`; si no hay evidencia, el caso queda marcado para revision.
- `cashCounts` representa apertura/cierre de turno; no debe ser motor de descubrimiento de operaciones.
- Tasa de cambio: compras y pagos proveedor usan `buyRate`; ventas y cobros cliente usan `sellRate`; cada documento/pago conserva snapshot historico.
- Metodos canonicos se mantienen como `cash`, `card`, `transfer`, `creditNote`; alias mas finos viven como metadata o migracion, no como nuevo canone.
- La corrida historica del `2026-04-07` queda como evidencia; las pruebas nuevas viven en `../../testing/2026-04-23-finanzas-contabilidad-qa-maestro.md`.

## Track A. Brechas estructurales

### [x] Diseñar conciliacion bancaria como workflow explicito

- Estado `2026-04-05`: documento base listo en `2026-04-05-diseno-conciliacion-bancaria.md`.
- Decision principal: conciliar contra `cashMovements` bancarios y usar `journalEntries` como soporte y ajuste, no como unidad primaria de matching.
- Siguiente paso real: implementar `Slice 1` de sesiones + lineas de extracto + carga de candidatos internos.

### [ ] Implementar conciliacion bancaria por slices

- Objetivo: dejar de tratar banca como mera configuracion y abrir control real libro vs extracto.
- Resultado esperado: sesion por `bankAccountId`, `statementLines`, `matches`, diferencias clasificadas y cierre controlado.
- Referencia: `2026-04-05-diseno-conciliacion-bancaria.md`

### [ ] Completar trazabilidad documento↔asiento↔reporte

- Objetivo: permitir navegar desde ventas, compras, gastos, cobros, pagos y caja hasta el asiento, y desde el asiento volver al origen.
- Resultado esperado: contrato reutilizable de referencias y acciones `Ver asiento contable` / `Ver documento origen` en toda la cobertura operativa, no solo en los tipos ya soportados.

### [ ] Decidir politica de periodo: `reopen` vs `lock dates + excepciones`

- Objetivo: evitar que cierre de periodo siga ambiguo.
- Resultado esperado: politica unica para frontend, permisos y backend.

## Track B. Endurecimiento operativo

### [ ] Poblar y validar `bankAccounts` reales en `X63aIFwHzk3r0gmT8w6P`

- Objetivo: dejar de crear o revisar pagos bancarios sin cuenta estructurada.
- Resultado esperado: ventas, `CxC`, gastos y pagos a proveedor del piloto usan `bankAccountId` real cuando el metodo es bancario.

### [ ] Poblar y validar `exchangeRates` reales del piloto

- Objetivo: cerrar el uso real de `rateId`, `buyRate`, `sellRate` y `effectiveRate` en operaciones nuevas.
- Resultado esperado: snapshots nuevos dejan de depender de fallback ambiguo o configuracion incompleta.

### [ ] Limpiar huecos legacy del piloto

- Objetivo: resolver los faltantes que queden en `rateId`, `bankAccountId`, `paymentState` y `paymentTerms`.
- Resultado esperado: auditoria del piloto sin diferencias materiales y sin seguir acumulando excepciones manuales.

### [ ] Cerrar recibo y evidencia de pago a proveedor

- Objetivo: pasar de ledger inicial a flujo operativo realmente usable.
- Resultado esperado: `accountsPayablePayments` con recibo usable, evidencia y mejor lectura por compra/proveedor.
- Regla absorbida: no usar subcoleccion de compra como unica fuente; el ledger debe seguir siendo consultable por proveedor, caja/banco y contabilidad.

### [ ] Degradar `purchase.paymentAt` a compatibilidad legacy

- Objetivo: evitar que siga leyendose como si fuera el pago real.
- Resultado esperado: el source of truth operativo del pago proveedor es `accountsPayablePayments`.
- Regla absorbida: no marcar compras legacy como pagadas sin evidencia real.

### [ ] Validar una cohorte pequena con `dual-write -> backfill -> audit -> cutover`

- Objetivo: probar que la capa nueva escala fuera del piloto sin corte global agresivo.
- Resultado esperado: una cohorte pequena cierra limpia antes de expansion mas amplia.

### [ ] Degradar lecturas legacy conflictivas

- Objetivo: documentar y reducir `invoice.paymentHistory`, `expense.payment.bank` y lecturas directas legacy de caja.
- Resultado esperado: compatibilidad clara, pero ya no verdad principal.
- Regla absorbida: caja y auditoria deben priorizar `cashMovements`; `cashCounts` queda como agregado de turno.

## Track C. Pipeline contable

### [ ] Endurecer el proyector y el mapeo contable

- Objetivo: bajar dependencia de parche manual cuando falten perfiles o cuentas posteables.
- Resultado esperado: mejor observabilidad de `pending_account_mapping`, criterios claros de error y reproceso controlado.

### [ ] Endurecer reporting backend

- Objetivo: cerrar las debilidades que siguen despues de la paginacion inicial.
- Resultado esperado: aperturas del mayor sin escaneo completo de historico, exportacion estable y decision sobre si el libro diario tambien debe migrar al mismo modelo backend.

## Track D. Avanzado o diferido

### [ ] Estado de cuenta por cliente y proveedor

- Objetivo: proyectar movimientos desde eventos sin reemplazar de golpe los ledgers operativos.

### [ ] Balances bancarios y cuentas puente

- Objetivo: separar caja, banco, tarjeta y transferencia pendiente con proyecciones consistentes.
- Regla absorbida: `cashMovements` no debe duplicar fuentes al expandir cohortes; cada movimiento necesita idempotencia y origen trazable.

### [ ] Precio documental y facturacion nativa por moneda no funcional

- Objetivo: habilitar de verdad `USD` u otra moneda documental sin re-etiquetar montos.
- Referencia vigente: `politica-2026-03-12-exchange-rate-policy.md`.
- Evidencia historica: `archive/etapa-2026-03-10-precio-documental-y-facturacion-nativa-por-moneda.md`, `archive/implementacion-2026-03-10-facturacion-usd-nativa.md`, `archive/migracion-2026-03-10-datos-esenciales-por-moneda.md`.
- Regla absorbida: snapshot de documento y snapshot de pago deben congelar tasa efectiva; no recalcular historico por tasa vigente.

### [ ] Cerrar `FX` para anticipos, parciales y revaluacion

- Objetivo: pasar de tasas y snapshots a una politica contable completa de diferencias cambiarias.
