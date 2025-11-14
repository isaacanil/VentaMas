# Balance por cobrar del cliente #44 (Avendys A. Lockhart)

## 📋 Contexto

El cliente corporativo #44 muestra un balance pendiente de RD$14,552.00 en POS y en la ficha financiera, sin que exista venta activa que lo explique. Esto podría bloquear su línea de crédito de RD$70,000.00.

## 🎯 Objetivos

- Identificar de dónde proviene el saldo de RD$14,552.00 en `accountsReceivable` y `generalBalance`.
- Validar si hay registros duplicados o pagos que no actualizaron el saldo.
- Documentar los pasos para reproducir y los hallazgos para futuros incidentes similares.

## ⚙️ Diseño / Arquitectura

Las secciones siguientes recopilan evidencia y puntos de control del caso.

- **Fecha de detección:** 2025-11-13
- **Reportado por:** Equipo de campo (capturas compartidas en chat)
- **Impacto actual:** Cliente corporativo no puede identificar el desglose de RD$14,552.00 facturados; riesgo de bloqueo del crédito de RD$70,000.00.

### Evidencia

- En la ficha financiera del cliente (pestaña **Info. Financiera**) se observa:
  - `Número #44`
  - Balance general mostrado: **RD$14,552.00**
  - Límite de crédito configurado: **RD$70,000.00**
  - Crédito disponible calculado: **RD$55,448.00**
  - Límite de facturas: 210
- En la pantalla del POS el mismo cliente aparece con:
  - Campo **Bal general** con **RD$14,552.00**
  - Datos de contacto cargados correctamente (cédula `00113807689`, teléfonos `8294446677`, dirección `Av. Winston Churchill #45, Edificio Torres …`).
  - El panel derecho indica “Los productos seleccionados aparecerán aquí…”, es decir, no hay venta abierta en curso que justifique ese balance.

Las capturas se encuentran adjuntas en el hilo original (ver referencia en la conversación del equipo).

### Pasos para reproducir

1. Abrir la ficha del cliente `#44 - AVENDYS ARMANDO LOCKHART SANCHEZ`.
2. Validar el monto mostrado como Balance general en **Info. Financiera** y en el POS.
3. Consultar las cuentas por cobrar abiertas en Firestore para este cliente y contrastar con la cifra de RD$14,552.00.

### Datos técnicos relevantes

- Colección principal: `businesses/{businessId}/accountsReceivable`.
- Campo que acumula el saldo en el cliente: `businesses/{businessId}/clients/{clientId}.generalBalance`.
- Cloud Function relacionada con la creación del saldo: `functions/src/modules/accountReceivable/services/addAccountReceivable.js` (actualiza `arBalance`, `paymentDate`, etc.).
- El crédito disponible se calcula como `creditLimit - generalBalance`.

## 🔍 Cómo se crea y se actualiza el saldo

### Al facturar (alta de CxC)

1. El frontend invoca `processInvoice` (`src/services/invoice/invoiceService.js`) y, si `receivableStatus` está activo, envía `accountsReceivable` con `totalReceivable`, `totalInstallments`, `paymentFrequency`, `dueDate`, etc.
2. La callable `handleInvoiceRequest` ejecuta `processInvoiceData` (`functions/src/modules/invoice/services/invoice.service.js:25`). Dentro de la transacción:
   - Se genera la factura (`generateFinalInvoice` o `generateInvoiceFromPreorder`).
   - Se ajusta inventario y se reserva el NCF.
   - Finalmente se llama a `manageReceivableAccounts` (`functions/src/modules/accountReceivable/services/accountReceivable.service.js:6`).
3. `manageReceivableAccounts` obtiene el siguiente correlativo (`collectReceivablePrereqs`) y llama a:
   - `addAccountReceivable` (`functions/src/modules/accountReceivable/services/addAccountReceivable.js`) → crea el documento `accountsReceivable/{arId}` con `arBalance = totalReceivable`, `isActive = true` y `paidInstallments = []`.
   - `addInstallmentReceivable` (`functions/src/modules/accountReceivable/services/addInstallmentsAccountReceivable.js`) → persiste las cuotas en `accountsReceivableInstallments` calculadas por `generateInstallments`.

### Al registrar pagos

1. En la ficha del cliente, el botón “Pagar” abre el panel de CxC y dispara `fbProcessClientPaymentAR` (`src/firebase/proccessAccountsReceivablePayments/fbProccessClientPaymentAR.js`), que enruta la acción según `paymentScope` y `paymentOption`.
2. Para cancelar todo el balance se usa `fbPayBalanceForAccounts` (`src/firebase/proccessAccountsReceivablePayments/fbPayBalanceForAccounts.js`):
   - Obtiene las cuentas abiertas ordenadas por fecha (`getSortedClientAccountsAR`).
   - Recorre cuotas activas (`getActiveInstallmentsByArId`) y aplica el pago con `processInstallmentPayment`, reduciendo `installmentBalance` y acumulando `paidInstallments`.
   - Invoca `updateAccountReceivableState` para bajar `arBalance`, marcar `isActive/isClosed` y registrar `lastPaymentDate` en el documento principal de la cuenta.
   - Actualiza la factura original (`fbGetInvoice` → batch update de `totalPaid` y `balanceDue`) y genera los comprobantes (`fbAddPayment`, `fbAddAccountReceivablePaymentReceipt`).
3. Otros flujos (`fbPayActiveInstallmentForAccount`, `fbApplyPartialPaymentToAccount`, etc.) comparten las mismas utilidades en `arPaymentUtils.js`, por lo que siempre terminan actualizando `accountsReceivable/{arId}`.

### Cómo se recalcula “Balance General” en la app

- Cada vez que un documento `accountsReceivable/{arId}` cambia, la Cloud Function `updatePendingBalance` (`functions/src/versions/v1/modules/accountsReceivable/triggers/updatePendingBalance.js`) suma los `arBalance` de todas las cuentas activas de ese cliente y escribe el resultado en `clients/{clientId}.client.pendingBalance`.
- El frontend escucha ese campo mediante `useClientPendingBalance` y `useGetPendingBalance` (`src/firebase/accountsReceivable/useClientPendingBalance.js` y `fbGetPendingBalance.js`), y lo muestra como **Balance General** en `ClientBalanceInfo.jsx` y en el modal de CxC.
- El “Crédito disponible” simplemente hace `creditLimit - pendingBalance`, por lo que cualquier desajuste en el campo agregado afecta directamente lo que ve el usuario.

### Checklist rápido si el balance no baja

1. **Ver el documento de la cuenta**: `accountsReceivable/{arId}` debe tener `arBalance` y `installmentBalance` coherentes y `isActive=false` cuando llega a cero.
2. **Confirmar la escritura agregada**: en `clients/{clientId}` revisa `client.pendingBalance`. Si no cambia, revisar logs de `updatePendingBalance` en Firebase para validar que la función esté desplegada y sin errores.
3. **Verificar los pagos parciales**: usa la colección `accountsReceivableInstallmentPayments` para comprobar que el pago quedó registrado y que el batch que ejecuta el frontend no falló (consultar la consola del navegador / Sentry).
4. **Validar los datos enviados**: si el panel de CxC calcula montos incorrectos (`ReceivableManagementPanel.jsx`), el `arBalance` inicial será diferente y la suma agregada nunca llegará a cero.

### Hipótesis iniciales

1. Existen registros de `accountsReceivable` abiertos que no han sido conciliados correctamente (campo `arBalance` > 0).
2. Alguna nota de crédito/pago no disparó la reducción del `generalBalance`, por lo que la cifra quedó “congelada”.
3. Se está creando un duplicado de AR al facturar desde el POS, de modo que el saldo se incrementa dos veces.

## 📈 Impacto / Trade-offs

- ⚠️ Si el saldo no se aclara, el cliente no podrá seguir comprando a crédito y se arriesga un bloqueo de RD$70k.
- ⚠️ Un cálculo incorrecto de `generalBalance` puede afectar reportes y estados financieros globales.
- 👍 Documentar este caso sirve como guía recurrente para futuras discrepancias de CxC.

## 🔜 Seguimiento / Próximos pasos

- [ ] Consultar los documentos `accountsReceivable` asociados al cliente y validar si suman RD$14,552.00.
- [ ] Revisar los triggers de pago para asegurarse de que actualizan `generalBalance` (especialmente en procesos manuales o importados).
- [ ] Documentar en este mismo archivo qué operaciones se encontraron y qué acciones se tomaron.

### Resultado / Notas de cierre

Pendiente. Completar cuando se determine qué registros causaron el balance y cómo se corrige.
