================================================================================
REGLA: react-hooks/exhaustive-deps (PARTE 3 de 3)
SEVERIDAD: warning
TOTAL DE PROBLEMAS: 42
================================================================================


FILE: DailyPurchasesBarChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\Compra\components\PurchasesReport\reports\DailyPurchasesBarChart.jsx
   3 problema(s)

   [WARN]  Linea 67:11
      The 'normalizedPurchases' conditional could make the dependencies of useMemo Hook (at line 92) change on every render. To fix this, wrap the initialization of 'normalizedPurchases' in its own useMemo() Hook

   [WARN]  Linea 118:26
      The ref value 'chartRef.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'chartRef.current' to a variable inside the effect, and use that variable in the cleanup function

   [WARN]  Linea 125:26
      The ref value 'chartRef.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'chartRef.current' to a variable inside the effect, and use that variable in the cleanup function


FILE: MonthlyAndAccumulatedPurchaseCharts.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\Compra\components\PurchasesReport\reports\MonthlyAndAccumulatedPurchaseCharts\MonthlyAndAccumulatedPurchaseCharts.jsx
   1 problema(s)

   [WARN]  Linea 13:11
      The 'normalizedPurchases' conditional could make the dependencies of useMemo Hook (at line 17) change on every render. To fix this, wrap the initialization of 'normalizedPurchases' in its own useMemo() Hook


FILE: ProvidersPurchasesBarChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\Compra\components\PurchasesReport\reports\ProvidersPurchasesBarChart.jsx
   1 problema(s)

   [WARN]  Linea 55:11
      The 'normalizedPurchases' conditional could make the dependencies of useMemo Hook (at line 59) change on every render. To fix this, wrap the initialization of 'normalizedPurchases' in its own useMemo() Hook


FILE: GeneralForm.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\OrderManagement\components\GeneralForm\GeneralForm.jsx
   1 problema(s)

   [WARN]  Linea 142:6
      React Hook useEffect has missing dependencies: 'dispatch', 'selectedProvider', and 'user.businessID'. Either include them or remove the dependency array


FILE: NotesInput.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\OrderManagement\components\GeneralForm\components\NotesInput.jsx
   1 problema(s)

   [WARN]  Linea 14:29
      React Hook useCallback received a function whose dependencies are unknown. Pass an inline function instead


FILE: BackOrdersModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\PurchaseManagement\components\BackOrdersModal.jsx
   1 problema(s)

   [WARN]  Linea 32:6
      React Hook useEffect has missing dependencies: 'initialPurchaseQuantity' and 'initialSelectedBackOrders'. Either include them or remove the dependency array. If 'setLocalSelectedBackOrders' needs the current value of 'initialSelectedBackOrders', you can also switch to useReducer instead of useState and read 'initialSelectedBackOrders' in the reducer


FILE: GeneralForm.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\PurchaseManagement\components\GeneralForm\GeneralForm.jsx
   1 problema(s)

   [WARN]  Linea 123:6
      React Hook useEffect has missing dependencies: 'dispatch', 'selectedProvider', and 'user.businessID'. Either include them or remove the dependency array


FILE: NotesInput.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\PurchaseManagement\components\GeneralForm\components\NotesInput.jsx
   1 problema(s)

   [WARN]  Linea 14:29
      React Hook useCallback received a function whose dependencies are unknown. Pass an inline function instead


FILE: tableCells.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\PreorderSale\components\PreSaleTable\tableCells.jsx
   1 problema(s)

   [WARN]  Linea 72:9
      The 'business' logical expression could make the dependencies of useCallback Hook (at line 163) change on every render. Move it inside the useCallback callback. Alternatively, wrap the initialization of 'business' in its own useMemo() Hook


FILE: InvoicePanel.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Sale\components\Cart\components\InvoicePanel\InvoicePanel.jsx
   5 problema(s)

   [WARN]  Linea 95:9
      The 'business' logical expression could make the dependencies of useMemo Hook (at line 127) change on every render. To fix this, wrap the initialization of 'business' in its own useMemo() Hook

   [WARN]  Linea 95:9
      The 'business' logical expression could make the dependencies of useCallback Hook (at line 242) change on every render. To fix this, wrap the initialization of 'business' in its own useMemo() Hook

   [WARN]  Linea 97:9
      The 'paymentMethods' logical expression could make the dependencies of useMemo Hook (at line 101) change on every render. Move it inside the useMemo callback. Alternatively, wrap the initialization of 'paymentMethods' in its own useMemo() Hook

   [WARN]  Linea 145:9
      The 'handleAfterPrint' function makes the dependencies of useCallback Hook (at line 242) change on every render. To fix this, wrap the definition of 'handleAfterPrint' in its own useCallback() Hook

   [WARN]  Linea 480:6
      React Hook useEffect has missing dependencies: 'cart?.paymentMethod', 'cart?.totalPurchase?.value', 'dispatch', and 'isAddedToReceivables'. Either include them or remove the dependency array


FILE: InsuranceManagementPanel.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Sale\components\Cart\components\InvoicePanel\components\Body\components\InsuranceManagementPanel\InsuranceManagementPanel.jsx
   3 problema(s)

   [WARN]  Linea 99:6
      React Hook useEffect has missing dependencies: 'installmentAmount', 'insuranceCoverage', 'setAmountPerInstallment', and 'totalInstallments'. Either include them or remove the dependency array

   [WARN]  Linea 109:6
      React Hook useEffect has missing dependencies: 'setTotalReceivable' and 'totalReceivable'. Either include them or remove the dependency array

   [WARN]  Linea 123:6
      React Hook useEffect has missing dependencies: 'paymentDate' and 'setPaymentDate'. Either include them or remove the dependency array


FILE: PaymentMethods.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Sale\components\Cart\components\InvoicePanel\components\Body\components\PaymentMethods\PaymentMethods.jsx
   2 problema(s)

   [WARN]  Linea 58:6
      React Hook useEffect has a missing dependency: 'paymentMethods'. Either include it or remove the dependency array

   [WARN]  Linea 73:6
      React Hook useEffect has missing dependencies: 'dispatch' and 'paymentMethods'. Either include them or remove the dependency array


FILE: PriceAndSaleUnitsModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Sale\components\Cart\components\PriceAndSaleUnitsModal.jsx
   3 problema(s)

   [WARN]  Linea 262:6
      React Hook useEffect has a missing dependency: 'selectedUnit'. Either include it or remove the dependency array. If 'setSelectedUnitId' needs the current value of 'selectedUnit', you can also switch to useReducer instead of useState and read 'selectedUnit' in the reducer

   [WARN]  Linea 264:5
      React Hook useEffect has a complex expression in the dependency array. Extract it to a separate variable so it can be statically checked

   [WARN]  Linea 292:6
      React Hook useEffect has a missing dependency: 'getDefaultPrice'. Either include it or remove the dependency array


FILE: InsuranceCoverage.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Sale\components\Cart\components\ProductCardForCart\components\InsuranceCoverage\InsuranceCoverage.jsx
   1 problema(s)

   [WARN]  Linea 85:6
      React Hook useEffect has a missing dependency: 'item'. Either include it or remove the dependency array


FILE: ProductControl.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Sale\components\ProductControl.jsx\ProductControl.jsx
   1 problema(s)

   [WARN]  Linea 51:6
      React Hook useEffect has a missing dependency: 'setProductsLoading'. Either include it or remove the dependency array. If 'setProductsLoading' changes too often, find the parent component that defines it and wrap that definition in useCallback


FILE: usePreorderModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Sale\components\usePreorderModal.jsx
   1 problema(s)

   [WARN]  Linea 264:6
      React Hook useEffect has a missing dependency: 'notification'. Either include it or remove the dependency array


FILE: BiWeeklySalesWithAverageChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Utility\charts\BiWeeklySalesWithAverageChart\BiWeeklySalesWithAverageChart.jsx
   1 problema(s)

   [WARN]  Linea 37:18
      The ref value 'chartRef.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'chartRef.current' to a variable inside the effect, and use that variable in the cleanup function


FILE: DailySalesWithAverageChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Utility\charts\DailySalesWithAverageChart\DailySalesWithAverageChart.jsx
   1 problema(s)

   [WARN]  Linea 37:18
      The ref value 'chartRef.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'chartRef.current' to a variable inside the effect, and use that variable in the cleanup function


FILE: MonthlySalesChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Utility\charts\GeneralAndMonthlySales\charts\MonthlySalesChart.jsx
   1 problema(s)

   [WARN]  Linea 36:18
      The ref value 'chartRef.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'chartRef.current' to a variable inside the effect, and use that variable in the cleanup function


FILE: MonthlyFinancialReportChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Utility\charts\MonthlyFinancialReportChart\MonthlyFinancialReportChart.jsx
   1 problema(s)

   [WARN]  Linea 38:18
      The ref value 'chartRef.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'chartRef.current' to a variable inside the effect, and use that variable in the cleanup function


FILE: WeeklySalesWithAverageChart.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Utility\charts\WeeklySalesWithAverageChart\WeeklySalesWithAverageChart.jsx
   1 problema(s)

   [WARN]  Linea 37:18
      The ref value 'chartRef.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'chartRef.current' to a variable inside the effect, and use that variable in the cleanup function


FILE: AuthorizationConfig.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\setting\subPage\AuthorizationConfig\AuthorizationConfig.jsx
   1 problema(s)

   [WARN]  Linea 92:6
      React Hook useEffect has a missing dependency: 'loadUsers'. Either include it or remove the dependency array


FILE: MultiPaymentModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\templates\MenuApp\GlobalMenu\Page\AccountReceivableToolbar\components\MultiPaymentModal\MultiPaymentModal.jsx
   1 problema(s)

   [WARN]  Linea 100:6
      React Hook useEffect has a missing dependency: 'updatePaymentMethod'. Either include it or remove the dependency array


FILE: PaymentMethodsForm.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\templates\MenuApp\GlobalMenu\Page\AccountReceivableToolbar\components\MultiPaymentModal\components\PaymentMethodsForm.jsx
   1 problema(s)

   [WARN]  Linea 49:6
      React Hook useEffect has a missing dependency: 'paymentMethods'. Either include it or remove the dependency array


FILE: useColumnOrder.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\templates\system\AdvancedTable\hooks\useColumnOrder.jsx
   1 problema(s)

   [WARN]  Linea 95:6
      React Hook useEffect has a missing dependency: 'columnOrder'. Either include it or remove the dependency array


FILE: useTableFilter.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\templates\system\AdvancedTable\hooks\useTableFilter.jsx
   1 problema(s)

   [WARN]  Linea 49:6
      React Hook useEffect has a missing dependency: 'dynamicFilterConfig'. Either include it or remove the dependency array


FILE: AddFileBtn.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\templates\system\Button\AddFileBtn.jsx
   2 problema(s)

   [WARN]  Linea 45:17
      Assignments to the 'endIcon' variable from inside React Hook useEffect will be lost after each render. To preserve the value over time, store it in a useRef Hook and keep the mutable value in the '.current' property. Otherwise, you can move this variable directly inside useEffect

   [WARN]  Linea 48:19
      Assignments to the 'startIcon' variable from inside React Hook useEffect will be lost after each render. To preserve the value over time, store it in a useRef Hook and keep the mutable value in the '.current' property. Otherwise, you can move this variable directly inside useEffect


FILE: ImageViewer.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\templates\system\ImageViewer\ImageViewer.jsx
   1 problema(s)

   [WARN]  Linea 25:9
      The 'onClose' function makes the dependencies of useEffect Hook (at line 35) change on every render. To fix this, wrap the definition of 'onClose' in its own useCallback() Hook


FILE: Notification.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\templates\system\Notification\Notification.jsx
   1 problema(s)

   [WARN]  Linea 40:9
      The 'handleClose' function makes the dependencies of useEffect Hook (at line 50) change on every render. To fix this, wrap the definition of 'handleClose' in its own useCallback() Hook


FILE: Select.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\templates\system\Select\Select.jsx
   1 problema(s)

   [WARN]  Linea 71:6
      React Hook useEffect has missing dependencies: 'onChange' and 'value'. Either include them or remove the dependency array. If 'onChange' changes too often, find the parent component that defines it and wrap that definition in useCallback


================================================================================
ARCHIVOS MAS AFECTADOS
================================================================================
  * InvoicePanel.jsx - 5 ocurrencias
  * DailyPurchasesBarChart.jsx - 3 ocurrencias
  * PriceAndSaleUnitsModal.jsx - 3 ocurrencias
  * InsuranceManagementPanel.jsx - 3 ocurrencias
  * PaymentMethods.jsx - 2 ocurrencias
