================================================================================
REGLA: react-hooks/exhaustive-deps (PARTE 2 de 3)
SEVERIDAD: warning
TOTAL DE PROBLEMAS: 50
================================================================================


FILE: BarcodeGenerator.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\modals\ProductForm\components\sections\BarcodeGenerator\BarcodeGenerator.jsx
   5 problema(s)

   [WARN]  Linea 163:6
      React Hook useEffect has a missing dependency: 'currentBarcode'. Either include it or remove the dependency array. If 'setLastKnownBarcode' needs the current value of 'currentBarcode', you can also switch to useReducer instead of useState and read 'currentBarcode' in the reducer

   [WARN]  Linea 264:6
      React Hook useEffect has a missing dependency: 'realtimeProduct'. Either include it or remove the dependency array

   [WARN]  Linea 283:6
      React Hook useEffect has a missing dependency: 'currentBarcode'. Either include it or remove the dependency array. If 'setLastKnownBarcode' needs the current value of 'currentBarcode', you can also switch to useReducer instead of useState and read 'currentBarcode' in the reducer

   [WARN]  Linea 707:6
      React Hook useEffect has missing dependencies: 'autoMode', 'createInternalLivePreview', 'createLivePreview', 'internalManualValues.itemReference', 'manualValues.itemReference', and 'selectedConfig.companyPrefix'. Either include them or remove the dependency array. You can also replace multiple useState variables with useReducer if 'setLivePreview' needs the current value of 'selectedConfig.companyPrefix'

   [WARN]  Linea 743:6
      React Hook useEffect has missing dependencies: 'createInternalLivePreview' and 'createLivePreview'. Either include them or remove the dependency array


FILE: PriceCalculator.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\modals\ProductForm\components\sections\PriceCalculator.jsx
   1 problema(s)

   [WARN]  Linea 150:6
      React Hook useEffect has missing dependencies: 'calculateTableData' and 'product'. Either include them or remove the dependency array


FILE: ActionButtons.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\tree\components\ActionButtons.jsx
   1 problema(s)

   [WARN]  Linea 32:9
      The 'safeActions' conditional could make the dependencies of useMemo Hook (at line 43) change on every render. Move it inside the useMemo callback. Alternatively, wrap the initialization of 'safeActions' in its own useMemo() Hook


FILE: useSelectedNode.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\tree\hooks\useSelectedNode.js
   1 problema(s)

   [WARN]  Linea 31:6
      React Hook useEffect has missing dependencies: 'manuallyClosedNodes', 'selectedNode', and 'setManualExpandedNodes'. Either include them or remove the dependency array. If 'setManualExpandedNodes' changes too often, find the parent component that defines it and wrap that definition in useCallback


FILE: LoginImageConfig.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\controlPanel\AppConfig\LoginImageConfig.jsx
   1 problema(s)

   [WARN]  Linea 42:6
      React Hook useEffect has a missing dependency: 'fetchCurrentImage'. Either include it or remove the dependency array


FILE: PersonalPinManagement.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Authorizations\components\PersonalPinManagement.jsx
   1 problema(s)

   [WARN]  Linea 292:6
      React Hook useEffect has a missing dependency: 'loadPinStatus'. Either include it or remove the dependency array


FILE: CashRegisterClosure.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\CashReconciliation\page\CashRegisterClosure\CashRegisterClosure.jsx
   1 problema(s)

   [WARN]  Linea 77:6
      React Hook useEffect has missing dependencies: 'actualUser', 'cashCount', and 'cashCountIsOpen'. Either include them or remove the dependency array


FILE: ClientForm.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Contact\Client\components\ClientForm\ClientForm.jsx
   1 problema(s)

   [WARN]  Linea 49:6
      React Hook useEffect has missing dependencies: 'create' and 'update'. Either include them or remove the dependency array


FILE: ClientFormAnt.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Contact\Client\components\ClientForm\ClientFormAnt.jsx
   1 problema(s)

   [WARN]  Linea 77:6
      React Hook useEffect has missing dependencies: 'create', 'form', and 'update'. Either include them or remove the dependency array


FILE: ClientGeneralInfo.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Contact\Client\components\ClientForm\components\ClientGeneralInfo.jsx
   1 problema(s)

   [WARN]  Linea 62:6
      React Hook useEffect has a missing dependency: 'consultarRNC'. Either include it or remove the dependency array


FILE: ProviderForm.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Contact\Provider\components\CreateContact\ProviderForm.jsx
   1 problema(s)

   [WARN]  Linea 120:6
      React Hook useEffect has a missing dependency: 'consultarRNC'. Either include it or remove the dependency array


FILE: CashCountAudit.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\DevTools\CashCountAudit\CashCountAudit.jsx
   1 problema(s)

   [WARN]  Linea 255:6
      React Hook useEffect has a missing dependency: 'user'. Either include it or remove the dependency array. You can also replace multiple useState variables with useReducer if 'setAuditLog' needs the current value of 'user'


FILE: CategoryExpenseBarChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Expenses\ExpensesList\components\ExpenseReport\reports\CategoryExpenseBarChart.jsx
   1 problema(s)

   [WARN]  Linea 51:11
      The 'normalizedExpenses' conditional could make the dependencies of useMemo Hook (at line 54) change on every render. To fix this, wrap the initialization of 'normalizedExpenses' in its own useMemo() Hook


FILE: MonthlyAndAccumulatedExpenseCharts.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Expenses\ExpensesList\components\ExpenseReport\reports\MonthlyAndAccumulatedExpenseCharts\MonthlyAndAccumulatedExpenseCharts.jsx
   1 problema(s)

   [WARN]  Linea 12:11
      The 'normalizedExpenses' conditional could make the dependencies of useMemo Hook (at line 15) change on every render. To fix this, wrap the initialization of 'normalizedExpenses' in its own useMemo() Hook


FILE: Header.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Home\HomeScreen\components\HomeScreenContent\Header.jsx
   1 problema(s)

   [WARN]  Linea 21:6
      React Hook useEffect has a missing dependency: 'date'. Either include it or remove the dependency array


FILE: InsuranceConfigForm.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Insurance\InsuranceConfigForm\InsuranceConfigForm.jsx
   2 problema(s)

   [WARN]  Linea 254:6
      React Hook useEffect has a missing dependency: 'resetForm'. Either include it or remove the dependency array

   [WARN]  Linea 354:6
      React Hook useEffect has a missing dependency: 'resetForm'. Either include it or remove the dependency array


FILE: FilterPanel.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Inventario\pages\ItemsManager\components\InvetoryFilterAndSort\components\Body\components\FilterPanel\FilterPanel.jsx
   1 problema(s)

   [WARN]  Linea 177:6
      React Hook useEffect has a missing dependency: 'user'. Either include it or remove the dependency array


FILE: SortPanel.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Inventario\pages\ItemsManager\components\InvetoryFilterAndSort\components\Body\components\SortPanel\SortPanel.jsx
   1 problema(s)

   [WARN]  Linea 49:6
      React Hook useEffect has a missing dependency: 'handleOrdenChange'. Either include it or remove the dependency array


FILE: ProductsTable.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Inventario\pages\ItemsManager\components\ProductTable\ProductsTable.jsx
   1 problema(s)

   [WARN]  Linea 58:5
      React Hook useCallback has a missing dependency: 'setDialogConfirm'. Either include it or remove the dependency array


FILE: ProductOutflow.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Inventario\pages\ProductOutflow\ProductOutflow.jsx
   1 problema(s)

   [WARN]  Linea 72:6
      React Hook useEffect has missing dependencies: 'dispatch', 'outflowProduct.data.id', and 'outflowProduct.mode'. Either include them or remove the dependency array


FILE: InventoryGroupedTable.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InventoryControl\components\InventoryGroupedTable.jsx
   1 problema(s)

   [WARN]  Linea 1105:6
      React Hook useMemo has missing dependencies: 'locationNamesMap' and 'resolvingLocations'. Either include them or remove the dependency array


FILE: useInventoryPresence.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InventoryControl\hooks\useInventoryPresence.js
   2 problema(s)

   [WARN]  Linea 72:6
      React Hook useEffect has missing dependencies: 'user.displayName', 'user.email', 'user.name', and 'user.photoURL'. Either include them or remove the dependency array

   [WARN]  Linea 110:6
      React Hook useEffect has missing dependencies: 'user.displayName', 'user.email', and 'user.name'. Either include them or remove the dependency array


FILE: useLocationNames.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InventoryControl\hooks\useLocationNames.js
   1 problema(s)

   [WARN]  Linea 64:6
      React Hook useEffect has a missing dependency: 'locationNames'. Either include it or remove the dependency array


FILE: useUserNamesCache.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InventoryControl\hooks\useUserNamesCache.js
   1 problema(s)

   [WARN]  Linea 71:6
      React Hook useEffect has missing dependencies: 'resolveUserDisplayName', 'user.displayName', 'user.email', and 'user.name'. Either include them or remove the dependency array. If 'setCurrentUserResolvedName' needs the current value of 'user.displayName', you can also switch to useReducer instead of useState and read 'user.displayName' in the reducer


FILE: InventorySessionsList.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InventorySessionsList\InventorySessionsList.jsx
   1 problema(s)

   [WARN]  Linea 74:6
      React Hook useEffect has a missing dependency: 'resolveMissingCreatorNames'. Either include it or remove the dependency array


FILE: ProductBatchModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Inventory\components\Warehouse\components\ProductBatchModal\ProductBatchModal.jsx
   1 problema(s)

   [WARN]  Linea 365:8
      React Hook useMemo has a missing dependency: 'isInSelectedLocations'. Either include it or remove the dependency array


FILE: RowShelfContent.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Inventory\components\Warehouse\components\RowShelfContent.jsx
   2 problema(s)

   [WARN]  Linea 105:9
      The 'handleDeleteSegment' function makes the dependencies of useCallback Hook (at line 150) change on every render. Move it inside the useCallback callback. Alternatively, wrap the definition of 'handleDeleteSegment' in its own useCallback() Hook

   [WARN]  Linea 119:9
      The 'handleUpdateSegment' function makes the dependencies of useCallback Hook (at line 150) change on every render. Move it inside the useCallback callback. Alternatively, wrap the definition of 'handleUpdateSegment' in its own useCallback() Hook


FILE: SaleReportTable.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InvoicesPage\SaleReportTable\SaleReportTable.jsx
   1 problema(s)

   [WARN]  Linea 51:6
      React Hook useMemo has a missing dependency: 'data'. Either include it or remove the dependency array


FILE: DailySalesBarChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InvoicesPage\SalesAnalyticsPanel\components\Bars\DailySalesBarChart\DailySalesBarChart.jsx
   1 problema(s)

   [WARN]  Linea 339:18
      The ref value 'chartRef.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'chartRef.current' to a variable inside the effect, and use that variable in the cleanup function


FILE: DiscountsGivenBarChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InvoicesPage\SalesAnalyticsPanel\components\Bars\DiscountsGivenBarChart\DiscountsGivenBarChart.jsx
   2 problema(s)

   [WARN]  Linea 52:9
      The 'normalizedSales' conditional could make the dependencies of useMemo Hook (at line 66) change on every render. To fix this, wrap the initialization of 'normalizedSales' in its own useMemo() Hook

   [WARN]  Linea 52:9
      The 'normalizedSales' conditional could make the dependencies of useMemo Hook (at line 77) change on every render. To fix this, wrap the initialization of 'normalizedSales' in its own useMemo() Hook


FILE: ItemsSoldBarChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InvoicesPage\SalesAnalyticsPanel\components\Bars\ItemsSoldBarChart\ItemsSoldBarChart.jsx
   1 problema(s)

   [WARN]  Linea 47:9
      The 'normalizedSales' conditional could make the dependencies of useMemo Hook (at line 51) change on every render. To fix this, wrap the initialization of 'normalizedSales' in its own useMemo() Hook


FILE: PaymentMethodBarChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InvoicesPage\SalesAnalyticsPanel\components\Bars\PaymentMethodBarChart\PaymentMethodBarChart.jsx
   1 problema(s)

   [WARN]  Linea 106:9
      The 'normalizedSales' conditional could make the dependencies of useMemo Hook (at line 110) change on every render. To fix this, wrap the initialization of 'normalizedSales' in its own useMemo() Hook


FILE: ProductCategorySalesBarChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InvoicesPage\SalesAnalyticsPanel\components\Bars\ProductCategorySalesBarChart\ProductCategorySalesBarChart.jsx
   1 problema(s)

   [WARN]  Linea 67:9
      The 'normalizedSales' conditional could make the dependencies of useMemo Hook (at line 71) change on every render. To fix this, wrap the initialization of 'normalizedSales' in its own useMemo() Hook


FILE: PurchaseTypeBarChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InvoicesPage\SalesAnalyticsPanel\components\Bars\PurchaseTypeBarChart\PurchaseTypeBarChart.jsx
   1 problema(s)

   [WARN]  Linea 89:9
      The 'normalizedSales' conditional could make the dependencies of useMemo Hook (at line 93) change on every render. To fix this, wrap the initialization of 'normalizedSales' in its own useMemo() Hook


FILE: TaxedSalesStackedBarChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InvoicesPage\SalesAnalyticsPanel\components\Bars\TaxedSalesStackedBarChart\TaxedSalesStackedBarChart.jsx
   2 problema(s)

   [WARN]  Linea 54:9
      The 'normalizedSales' conditional could make the dependencies of useMemo Hook (at line 67) change on every render. To fix this, wrap the initialization of 'normalizedSales' in its own useMemo() Hook

   [WARN]  Linea 54:9
      The 'normalizedSales' conditional could make the dependencies of useMemo Hook (at line 78) change on every render. To fix this, wrap the initialization of 'normalizedSales' in its own useMemo() Hook


FILE: GenericCustomerSalesChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InvoicesPage\SalesAnalyticsPanel\components\Bars\TotalSalesPerCustomerChart\Bars\GenericCustomerSalesChart.jsx
   1 problema(s)

   [WARN]  Linea 55:9
      The 'normalizedSales' conditional could make the dependencies of useMemo Hook (at line 59) change on every render. To fix this, wrap the initialization of 'normalizedSales' in its own useMemo() Hook


FILE: TopSpendingCustomersChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InvoicesPage\SalesAnalyticsPanel\components\Bars\TotalSalesPerCustomerChart\Bars\TopSpendingCustomersChart.jsx
   1 problema(s)

   [WARN]  Linea 52:9
      The 'normalizedSales' conditional could make the dependencies of useMemo Hook (at line 56) change on every render. To fix this, wrap the initialization of 'normalizedSales' in its own useMemo() Hook


FILE: FilterBar.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\Compra\components\FilterBar\FilterBar.jsx
   2 problema(s)

   [WARN]  Linea 37:8
      React Hook useEffect has missing dependencies: 'onChange' and 'state'. Either include them or remove the dependency array. If 'onChange' changes too often, find the parent component that defines it and wrap that definition in useCallback

   [WARN]  Linea 116:7
      React Hook useCallback has a missing dependency: 'updateFilter'. Either include it or remove the dependency array


FILE: CategoryPurchasesBarChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\Compra\components\PurchasesReport\reports\CategoryPurchasesBarChart.jsx
   1 problema(s)

   [WARN]  Linea 57:11
      The 'normalizedPurchases' conditional could make the dependencies of useMemo Hook (at line 61) change on every render. To fix this, wrap the initialization of 'normalizedPurchases' in its own useMemo() Hook


FILE: DailyPurchasesBarChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\Compra\components\PurchasesReport\reports\DailyPurchasesBarChart.jsx
   1 problema(s)

   [WARN]  Linea 67:11
      The 'normalizedPurchases' conditional could make the dependencies of useMemo Hook (at line 81) change on every render. To fix this, wrap the initialization of 'normalizedPurchases' in its own useMemo() Hook


================================================================================
ARCHIVOS MAS AFECTADOS
================================================================================
  * BarcodeGenerator.jsx - 5 ocurrencias
  * useInventoryPresence.js - 2 ocurrencias
  * TaxedSalesStackedBarChart.jsx - 2 ocurrencias
  * DiscountsGivenBarChart.jsx - 2 ocurrencias
  * InsuranceConfigForm.jsx - 2 ocurrencias
