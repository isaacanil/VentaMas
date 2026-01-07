# Avance de migración a TypeScript (TS/TSX)

## Resumen
- Migración de frontend a TS/TSX con typecheck y lint en verde.
- Centralización de tipos y utilidades críticas (menú, comprobantes fiscales, roles, permisos dinámicos y filtros de facturas).
- Inventario con tipos de estructura y ubicaciones centralizados (almacenes, estantes, filas, segmentos).
- Reducción de `@ts-nocheck` en áreas clave (MenuApp, TaxReceipts, Tree, Inventario, Usuarios, Facturas, fechas).
- Limpieza de archivos redundantes y lógica duplicada (barrels y utilidades no usadas).
- CxC (lista) y Control de Inventario tipados con hooks y tablas sin `@ts-nocheck`.
- Gastos tipados de punta a punta (types, Firebase, formulario y listados).
- Compras: tipos base + PurchaseManagement tipado + Firebase de compras sin `@ts-nocheck`.

## Tipos y lógica centralizada
### Menú
- **Tipos comunes**: `src/types/menu.ts` (propiedades comunes de MenuItem, condiciones, tags).
- **MenuData tipado**: `src/views/templates/MenuApp/MenuData/MenuData.tsx`.
- **Items tipados**:
  - `src/views/templates/MenuApp/MenuData/items/*.tsx`
  - `src/views/templates/MenuApp/MenuData/items/inventory.ts`
- **Acceso/filtrado centralizado**:
  - `src/utils/menuAccess.ts` con tipado y reglas consistentes.

### Comprobantes fiscales (TaxReceipts)
- **Tipos comunes**: `src/types/taxReceipt.ts`.
- **Utilidades comunes**: `src/utils/taxReceipt.ts`.
- **Firebase + Settings** alineados con tipos:
  - `src/firebase/taxReceipt/*.ts`
  - `src/views/pages/setting/subPage/TaxReceipts/TaxReceIptSetting.tsx`
- **Redundancia eliminada**:
  - Eliminado `src/views/pages/setting/subPage/TaxReceipts/utils/taxReceiptUtils.ts`.
  - Eliminado `src/views/pages/setting/subPage/TaxReceipts/hooks/useTaxReceiptSetting.tsx`.

### Usuarios y permisos dinámicos
- **Tipos comunes**: `src/types/users.ts`, `src/types/permissions.ts`.
- **Roles tipados y textos corregidos**: `src/abilities/roles.ts`.
- **Servicio tipado de permisos dinámicos**: `src/services/dynamicPermissions.ts`.

### Filtros de facturas y fechas
- **Tipos comunes**: `src/types/invoiceFilters.ts`.
- **Sorting y filtros tipados**: `src/views/pages/InvoicesPage/components/FilterBar/FilterBar.tsx` y `src/views/pages/InvoicesPage/components/FilterBar/hooks/index.ts`.
- **Rangos de fecha tipados**: `src/utils/date/getDateRange.ts`.
- **Firebase invoices tipado**: `src/firebase/invoices/useFbGetInvoicesWithFilters.ts`.

### Inventario (estructura y ubicaciones)
- **Tipos centralizados de estructura**: `src/utils/inventory/types.ts` (WarehouseStructureType/Element/Payload/Data + LocationPathParts).
- **Tipos agregados de stock**: `src/utils/inventory/types.ts` (AggregatedProductStock, StockSummary).
- **Ubicaciones tipadas**: `src/utils/inventory/locations.ts`.
- **Servicios Firebase tipados**:
  - `src/firebase/warehouse/warehouseStructureService.ts`
  - `src/firebase/warehouse/shelfService.ts`
  - `src/firebase/warehouse/RowShelfService.ts`
  - `src/firebase/warehouse/segmentService.ts`
  - `src/firebase/warehouse/backOrderService.ts`
  - `src/firebase/warehouse/locationService.ts`
  - `src/firebase/warehouse/warehouseNestedServise.ts`
  - `src/firebase/warehouse/stockSyncService.ts`
  - `src/firebase/warehouse/useListenMovementsByParams.ts`

### Inventario (stock y movimientos)
- **Filtro de stock tipado**: `src/views/pages/Inventory/components/Warehouse/components/ProductStockBrowser/constants.ts`.
- **Product stock overview sin `@ts-nocheck`**:
  - `src/views/pages/Inventory/components/Warehouse/components/ProductStockOverview/ProductStockOverview.tsx`
  - `src/views/pages/Inventory/components/Warehouse/components/ProductStockOverview/components/*.tsx`
- **Movimientos tipados y normalizados**:
  - `src/views/pages/Inventory/components/AllMovements/AllMovements.tsx`
  - `src/views/pages/Inventory/components/AllMovements/MovementsFilterBar.tsx`

### Inventario (control de inventario)
- **Control tipado sin `@ts-nocheck`**:
  - `src/views/pages/InventoryControl/InventoryControl.tsx`
  - `src/views/pages/InventoryControl/hooks/*`
  - `src/views/pages/InventoryControl/components/*`
  - `src/views/pages/InventoryControl/components/GroupedLotsModal/*`
  - `src/views/pages/InventoryControl/components/InventoryGroupedTable/*`
  - `src/views/pages/InventoryControl/utils/inventoryHelpers.ts`
  - `src/views/pages/InventoryControl/tools/migrateInventoryCounts.ts`

### Cuentas por cobrar (CxC)
- **Tipos centralizados**: `src/utils/accountsReceivable/types.ts`.
- **Listener de CxC tipado**: `src/firebase/accountsReceivable/accountReceivableServices.ts`.
- **Lista y tabla tipadas**:
  - `src/views/pages/AccountReceivable/pages/AccountReceivableList/AccountReceivableList.tsx`
  - `src/views/pages/AccountReceivable/pages/AccountReceivableList/components/AccountReceivableTable/*`
  - `src/views/pages/AccountReceivable/pages/AccountReceivableList/components/FilterAccountReceivable/FilterAccountReceivable.tsx`
- **Sorting y helpers tipados**:
  - `src/utils/sorts/sortAccountsReceivable.ts`
  - `src/utils/accountsReceivable/accountsReceivable.ts`
- **Detalle, pagos y cuotas tipados**:
  - `src/firebase/accountsReceivable/fetchAccountsReceivableDetails.ts`
  - `src/firebase/accountsReceivable/fbAddAR.ts`
  - `src/firebase/accountsReceivable/fbAddInstallmentAR.ts`
  - `src/firebase/accountsReceivable/fbGetAccountReceivableDetails.ts`
  - `src/firebase/accountsReceivable/useClientAccountsReceivable.ts`
  - `src/utils/accountsReceivable/getMaxInstallments.ts`
  - `src/utils/accountsReceivable/generateInstallments.ts`
  - `src/views/pages/AccountReceivable/pages/ReceivablePaymentReceipt/ReceivablePaymentReceipt.tsx`
  - `src/views/pages/AccountReceivable/pages/AccountReceivableInfo/AccountReceivableInfo.tsx`
- **Fechas de pago centralizadas**:
  - `src/views/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/ReceivableManagementPanel/receivableUtils.ts`

### Cuadre de caja (Cash Reconciliation)
- **Tipos centralizados**: `src/utils/cashCount/types.ts`.
- **Normalización de fechas**: `src/utils/date/types.ts`, `src/utils/date/toMillis.ts`, `src/utils/date/toValidDate.ts`.
- **Firebase + hooks tipados**:
  - `src/firebase/cashCount/fbGetCashCounts/fbGetCashCounts.ts`
  - `src/firebase/cashCount/fbGetCashCounts/getEmployeeData.ts`
  - `src/firebase/cashCount/fbLoadExpensesForCashCount.ts`
  - `src/firebase/cashCount/fbLoadInvoicesForCashCount.ts`
  - `src/firebase/cashCount/fbUpdateCashCountTotals.ts`
  - `src/firebase/cashCount/opening/fbCashCountOpening.ts`
  - `src/firebase/cashCount/useCurrentCashDrawer.ts`
  - `src/firebase/cashCount/useIsOpenCashReconciliation.ts`
  - `src/hooks/cashCount/useInvoicesForCashCount.tsx`
  - `src/hooks/cashCount/usePaymentsForCashCount.ts`
  - `src/hooks/expense/useExpensesForCashCount.tsx`
- **UI tipada**:
  - `src/views/pages/CashReconciliation/components/Body/CashRecociliationTable.tsx`
  - `src/views/pages/CashReconciliation/components/Body/tableConfig.tsx`
  - `src/views/pages/CashReconciliation/components/FilterBar/FilterCashReconciliation.tsx`
  - `src/views/pages/CashReconciliation/resource/CashCountStatusIndicator/CashCountStateIndicator.tsx`
  - `src/views/pages/CashReconciliation/page/CashupInvoicesOverview/*`
  - `src/views/pages/CashReconciliation/page/CashRegisterClosure/components/Body/RightSide/components/ViewInvoive/ViewInvoice.tsx`
  - `src/views/pages/CashReconciliation/page/CashRegisterClosure/components/Body/RightSide/components/ViewExpenses/ViewExpenses.tsx`
  - `src/views/pages/CashReconciliation/page/CashRegisterClosure/components/Body/RightSide/components/TransactionSummary/TransactionSummary.tsx`
  - `src/views/pages/CashReconciliation/page/CashRegisterClosure/components/Body/RightSide/components/CashBoxClosureDetails/CashBoxClosureDetails.tsx`
  - `src/views/pages/CashReconciliation/page/CashRegisterClosure/components/Header/CashReconciliationState/CashReconciliationState.tsx`

### Gastos (Expenses)
- **Tipos centralizados**: `src/utils/expenses/types.ts`.
- **Constantes + normalización**: `src/utils/expenses/constants.ts`, `src/utils/expenses/normalize.ts`.
- **Firebase tipado**:
  - `src/firebase/expenses/Items/fbAddExpense.ts`
  - `src/firebase/expenses/Items/fbUpdateExpense.ts`
  - `src/firebase/expenses/Items/fbDeleteExpense.ts`
  - `src/firebase/expenses/Items/useFbGetExpenses.ts`
  - `src/firebase/expenses/maintenance/fbFixExpenseTimestamps.ts`
  - `src/firebase/expenses/categories/*.ts`
- **UI + hooks tipados**:
  - `src/views/pages/Expenses/ExpensesList/ExpensesList.tsx`
  - `src/views/pages/Expenses/ExpensesList/components/ExpenseTable/ExpensesTable.tsx`
  - `src/views/pages/Expenses/ExpensesList/components/FilterBar/FilterExpenses.tsx`
  - `src/views/pages/Expenses/ExpensesList/components/ExpenseReport/ExpenseReport.tsx`
  - `src/views/pages/Expenses/ExpensesForm/ExpensesForm.tsx`
  - `src/views/pages/Expenses/ExpensesForm/hooks/useExpenseForm.ts`
  - `src/views/pages/Expenses/ExpensesForm/hooks/useOpenCashRegisters.ts`
  - `src/views/pages/Expenses/ExpensesForm/components/ManageExpenseCategoriesModal.tsx`
  - `src/validates/expenseValidate.tsx`

### Compras (Purchase)
- **Tipos base centralizados**: `src/utils/purchase/types.ts`.
- **Utilidades tipadas**:
  - `src/views/pages/OrderAndPurchase/PurchaseManagement/purchaseLogic.ts`
  - `src/views/pages/OrderAndPurchase/PurchaseManagement/purchaseManagementUtils.ts`
- **Pantalla principal tipada**:
  - `src/views/pages/OrderAndPurchase/PurchaseManagement/PurchaseManagement.tsx`
- **Firebase tipado y lógica de adjuntos centralizada**:
  - `src/firebase/purchase/attachmentService.ts`
  - `src/firebase/purchase/fbAddPurchase.ts`
  - `src/firebase/purchase/fbUpdatePurchase.ts`
  - `src/firebase/purchase/fbCompletePurchase.ts`
  - `src/firebase/purchase/fbCancelPurchase.ts`
  - `src/firebase/purchase/fbPreparePurchaseDocument.ts`
  - `src/firebase/purchase/fbUpdateProdStockForReplenish.ts`
- **Fechas y adjuntos compartidos**:
  - `src/firebase/utils/firestoreDates.ts`
  - `src/utils/purchase/attachments.ts`

## Componentes ajustados
- **MenuApp** tipado: `src/views/templates/MenuApp/MenuApp.tsx`.
- **Tree** tipado y reutilizable: `src/views/component/tree/Tree.tsx`.
- **Inventario** sin setState en effect:
  - `src/views/pages/Inventory/components/Warehouse/components/DetailView/InventoryMenu.tsx`.
- **Facturas**:
  - `src/views/pages/InvoicesPage/InvoicesPage.tsx`.
  - `src/views/pages/InvoicesPage/ReceivablePaymentReceipt.tsx`.
- **TaxReceipts** (form y secciones) tipados:
  - `src/views/pages/setting/subPage/TaxReceipts/components/TaxReceiptForm/TaxReceiptForm.tsx`.
  - `src/views/pages/setting/subPage/TaxReceipts/components/ReceiptTableSection/ReceiptTableSection.tsx`.
  - `src/views/pages/setting/subPage/TaxReceipts/components/AddReceiptModal/AddReceiptModal.tsx`.
- **Usuarios**:
  - `src/views/pages/setting/subPage/Users/components/DynamicPermissionsManager/DynamicPermissionsManager.tsx`.
  - `src/views/pages/setting/subPage/Users/components/RoleDowngradeConfirmationModal/RoleDowngradeConfirmationModal.tsx`.
  - `src/views/pages/setting/subPage/Users/components/CashierMigrationTool/CashierMigrationTool.tsx`.

## Limpieza y calidad
- `@ts-nocheck` retirados en facturas (FilterBar + hooks + pages + firebase invoices) y en fechas.
- `@ts-nocheck` retirados en inventario (estructura de almacenes, estantes, filas, segmentos, backorders y movimientos).
- `@ts-nocheck` retirados en stock/movimientos UI (ProductStockOverview, ProductStockBrowser, AllMovements).
- `@ts-nocheck` retirados en Control de Inventario (hooks, tabla agrupada, modal de lotes, export).
- `@ts-nocheck` retirados en CxC (lista, tabla, filtros, sorting y listener).
- `@ts-nocheck` retirados en Gastos (Firebase, lista, filtros, formulario).
- `@ts-nocheck` retirados en Compras (Firebase, adjuntos y stock).
- Importaciones directas en `MultiPaymentModal`, `DatePicker` y módulos de filtros (sin barrels).
- Ajuste de lazy import para CreditNote sin `index.ts` intermedio.
- Eliminados reexports:
  - `src/features/expense/index.ts`.
  - `src/features/purchase/index.ts`.
  - `src/Context/CategoryContext/index.ts`.
  - `src/Context/Dialog/index.ts`.
  - `src/views/pages/CreditNote/index.ts`.
  - `src/views/pages/CreditNote/CreditNoteList/components/index.ts`.
  - `src/views/pages/InvoicesPage/components/FilterBar/index.ts`.
  - `src/views/pages/InvoicesPage/components/FilterBar/components/index.ts`.
  - `src/components/common/DatePicker/index.ts`.
  - `src/components/common/DatePicker/components/index.ts`.
  - `src/components/common/FilterBar/index.ts`.
  - `src/components/common/NotificationSection/index.ts`.
  - `src/components/common/index.ts`.
  - `src/views/component/modals/ProductForm/components/sections/BarcodeGenerator/components/index.ts`.
  - `src/views/component/modals/ProductForm/components/sections/BarcodeCorrector/index.ts`.
  - `src/views/pages/Sale/components/Cart/components/InvoicePanel/components/Body/components/InvoiceComment/index.ts`.
  - `src/assets/index.ts`.
- Eliminados archivos vacíos/no usados:
  - `src/firebase/expenses/Items/fbGetExpensesForCashRegister.ts`.
  - `src/views/pages/Expenses/ExpensesForm/utils/constants.ts`.
  - `src/views/pages/Expenses/ExpensesForm/utils/attachmentUtils.ts`.
  - `src/views/pages/Expenses/ExpensesForm/hooks/useAttachments.ts`.
  - `src/views/pages/OrderAndPurchase/PurchaseManagement/hooks/usePurchaseManagement.ts`.
  - `src/firebase/purchase/purchaseService.ts`.
  - `src/hooks/useAuthorizationPin.d.ts`.

## Estado actual
- `npm run typecheck` OK
- `npm run lint` OK

## Pendientes sugeridos
1. Seguir retirando `@ts-nocheck` en compras/pedidos (Purchase/Order) y facturas/CxC.
2. Centralizar tipos de formularios comunes (usuarios, pagos, CxC, compras, pedidos).
3. Continuar limpieza de barrels restantes con imports directos.
