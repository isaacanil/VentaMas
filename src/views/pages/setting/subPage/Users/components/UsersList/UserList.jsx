================================================================================
REGLA: renders (PARTE 3 de 4)
SEVERIDAD: error
TOTAL DE PROBLEMAS: 50
================================================================================


FILE: useErrorHandling.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\ErrorElement\hooks\useErrorHandling.jsx
   1 problema(s)

   [ERROR] Linea 21:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        19 |
        20 |   useEffect(() => {
      > 21 |     setCanGoBack(window.history.length > 2);
           |     ^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        22 |   }, []);
        23 |
        24 |   const handleReportChange = (e) => {  react-hooks/set-state-in-effect


FILE: useExpenseForm.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Expenses\ExpensesForm\hooks\useExpenseForm.js
   1 problema(s)

   [ERROR] Linea 46:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        44 |   useEffect(() => {
        45 |     if (!expense?.attachments?.length) {
      > 46 |       setUrls([]);
           |       ^^^^^^^ Avoid calling setState() directly within an effect
        47 |       return;
        48 |     }
        49 |  react-hooks/set-state-in-effect


FILE: PeriodSelectionModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Insurance\InsuranceConfigForm\components\PeriodSelectionModal.jsx
   1 problema(s)

   [ERROR] Linea 28:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        26 |   useEffect(() => {
        27 |     if (!visible) {
      > 28 |       setIsCustom(false);
           |       ^^^^^^^^^^^ Avoid calling setState() directly within an effect
        29 |       setCustomValue(1);
        30 |       setCustomUnit(1);
        31 |       setSelectedPeriod(null);  react-hooks/set-state-in-effect


FILE: SortPanel.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Inventario\pages\ItemsManager\components\InvetoryFilterAndSort\components\Body\components\SortPanel\SortPanel.jsx
   1 problema(s)

   [ERROR] Linea 47:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        45 |     if (isCriterioChanged) {
        46 |       handleOrdenChange(ordenPorCriterio[criterio]);
      > 47 |       setIsCriterioChanged(false); // Restablece la bandera para futuros cambios
           |       ^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        48 |     }
        49 |   }, [criterio, isCriterioChanged]);
        50 |  react-hooks/set-state-in-effect


FILE: useInventorySession.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InventoryControl\hooks\useInventorySession.js
   1 problema(s)

   [ERROR] Linea 9:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
         7 |   useEffect(() => {
         8 |     if (!db || !businessID || !sessionId) {
      >  9 |       setSession(null);
           |       ^^^^^^^^^^ Avoid calling setState() directly within an effect
        10 |       return;
        11 |     }
        12 |     const sessionRef = doc(  react-hooks/set-state-in-effect


FILE: useInventoryStocksProducts.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InventoryControl\hooks\useInventoryStocksProducts.js
   2 problema(s)

   [ERROR] Linea 32:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        30 |   useEffect(() => {
        31 |     if (!db || !businessID) {
      > 32 |       setStocks([]);
           |       ^^^^^^^^^ Avoid calling setState() directly within an effect
        33 |       return;
        34 |     }
        35 |     setLoadingStocks(true);        react-hooks/set-state-in-effect

   [ERROR] Linea 73:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        71 |   useEffect(() => {
        72 |     if (!db || !businessID) {
      > 73 |       setProducts([]);
           |       ^^^^^^^^^^^ Avoid calling setState() directly within an effect
        74 |       return;
        75 |     }
        76 |     setLoadingProducts(true);  react-hooks/set-state-in-effect


FILE: useLocationNames.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InventoryControl\hooks\useLocationNames.js
   1 problema(s)

   [ERROR] Linea 24:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        22 |     const keys = Array.from(uniqueKeys);
        23 |     if (keys.length === 0) {
      > 24 |       setLocationNames({});
           |       ^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        25 |       return;
        26 |     }
        27 |  react-hooks/set-state-in-effect


FILE: useInventoryFilters.ts
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Inventory\components\Warehouse\components\DetailView\components\InventoryTable\hooks\useInventoryFilters.ts
   2 problema(s)

   [ERROR] Linea 57:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

   [ERROR] Linea 66:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).


FILE: ProductBatchModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Inventory\components\Warehouse\components\ProductBatchModal\ProductBatchModal.jsx
   2 problema(s)

   [ERROR] Linea 384:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        382 |   useEffect(() => {
        383 |     if (products.length === 0) {
      > 384 |       setSelectedBatch(null);
            |       ^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        385 |     }
        386 |   }, [products.length]);
        387 |  react-hooks/set-state-in-effect

   [ERROR] Linea 394:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        392 |     );
        393 |     if (!exists) {
      > 394 |       setSelectedBatch(null);
            |       ^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        395 |     }
        396 |   }, [sanitizedProductStocks, selectedBatch]);
        397 |       react-hooks/set-state-in-effect


FILE: Sidebar.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Inventory\components\Warehouse\components\Sidebar\Sidebar.jsx
   1 problema(s)

   [ERROR] Linea 635:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        633 |   useEffect(() => {
        634 |     if (!user?.businessID) {
      > 635 |       setStockSummaries({});
            |       ^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        636 |       setLoadingStockSummaries(false);
        637 |       return;
        638 |     }  react-hooks/set-state-in-effect


FILE: InvoicesPage.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InvoicesPage\InvoicesPage.jsx
   2 problema(s)

   [ERROR] Linea 40:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        38 |
        39 |   useEffect(() => {
      > 40 |     setProcessedInvoices([...invoices]);
           |     ^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        41 |   }, [invoices]);
        42 |
        43 |   // Sincronizar filtros cuando cambian las fechas seleccionadas                                                        react-hooks/set-state-in-effect

   [ERROR] Linea 45:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        43 |   // Sincronizar filtros cuando cambian las fechas seleccionadas
        44 |   useEffect(() => {
      > 45 |     setFilters((prev) => ({
           |     ^^^^^^^^^^ Avoid calling setState() directly within an effect
        46 |       ...prev,
        47 |       startDate: datesSelected.startDate,
        48 |       endDate: datesSelected.endDate,  react-hooks/set-state-in-effect


FILE: Login.tsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Login\Login.tsx
   3 problema(s)

   [ERROR] Linea 98:10
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

   [ERROR] Linea 104:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

   [ERROR] Linea 116:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).


FILE: useFilterBar.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\Compra\components\FilterBar\hooks\useFilterBar.js
   1 problema(s)

   [ERROR] Linea 19:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        17 |       JSON.stringify(initialDefaultValues.current)
        18 |     ) {
      > 19 |       setState((prev) => ({
           |       ^^^^^^^^ Avoid calling setState() directly within an effect
        20 |         ...prev,
        21 |         filters: defaultFilters,
        22 |       }));  react-hooks/set-state-in-effect


FILE: GeneralForm.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\OrderManagement\components\GeneralForm\GeneralForm.jsx
   1 problema(s)

   [ERROR] Linea 100:9
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
         98 |       );
         99 |       if (providerFromState) {
      > 100 |         setSelectedProvider(providerFromState.provider);
            |         ^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        101 |       }
        102 |     }
        103 |   }, [providers, providerId]);  react-hooks/set-state-in-effect


FILE: BackOrdersModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\PurchaseManagement\components\BackOrdersModal.jsx
   1 problema(s)

   [ERROR] Linea 29:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        27 |   useEffect(() => {
        28 |     if (isVisible) {
      > 29 |       setLocalSelectedBackOrders(initialSelectedBackOrders);
           |       ^^^^^^^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        30 |       setPurchaseQuantity(initialPurchaseQuantity);
        31 |     }
        32 |   }, [isVisible]);  react-hooks/set-state-in-effect


FILE: PreviewContent.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\PurchaseManagement\components\EvidenceUpload\PreviewContent.jsx
   1 problema(s)

   [ERROR] Linea 161:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        159 |     let localUrl;
        160 |     if (previewFile) {
      > 161 |       setIsLoading(true);
            |       ^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        162 |       setError(null);
        163 |
        164 |       if (previewFile.file instanceof File) {  react-hooks/set-state-in-effect


FILE: GeneralForm.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\PurchaseManagement\components\GeneralForm\GeneralForm.jsx
   1 problema(s)

   [ERROR] Linea 82:9
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        80 |       );
        81 |       if (providerFromState) {
      > 82 |         setSelectedProvider(providerFromState.provider);
           |         ^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        83 |       }
        84 |     }
        85 |   }, [providers, providerId]);  react-hooks/set-state-in-effect


FILE: OrderSelector.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\PurchaseManagement\components\GeneralForm\components\OrderSelector.jsx
   1 problema(s)

   [ERROR] Linea 115:9
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        113 |       const match = orders.find((order) => order.id === orderId);
        114 |       if (match) {
      > 115 |         setSelectedOrder(match);
            |         ^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        116 |       }
        117 |     }
        118 |   }, [orderId, orders]);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           react-hooks/set-state-in-effect


FILE: ProductModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\shared\ProductModal.jsx
   1 problema(s)

   [ERROR] Linea 217:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        215 |   useEffect(() => {
        216 |     if (visible && multiselect) {
      > 217 |       setSelectedProducts([]);
            |       ^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        218 |     }
        219 |   }, [visible, multiselect]);
        220 |  react-hooks/set-state-in-effect


FILE: PreorderSale.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\PreorderSale\PreorderSale.jsx
   2 problema(s)

   [ERROR] Linea 117:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        115 |
        116 |   useEffect(() => {
      > 117 |     applyFilters();
            |     ^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        118 |   }, [applyFilters]);
        119 |
        120 |   const handleSearch = useCallback((term) => {   react-hooks/set-state-in-effect

   [ERROR] Linea 134:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        132 |     );
        133 |     if (!exists) {
      > 134 |       setSelectedClient('all');
            |       ^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        135 |     }
        136 |   }, [clientOptions, selectedClient]);
        137 |  react-hooks/set-state-in-effect


FILE: ReceivableManagementPanel.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Sale\components\Cart\components\InvoicePanel\components\Body\components\ReceivableManagementPanel\ReceivableManagementPanel.jsx
   4 problema(s)

   [ERROR] Linea 186:9
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        184 |       if (nextPaymentDate !== paymentDate) {
        185 |         updatePaymentDateInStore(nextPaymentDate);
      > 186 |         setUserModifiedDate(false);
            |         ^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        187 |         if (forceRecalculate) setForceRecalculate(false);
        188 |
        189 |         // Actualizar el form tambiÃ©n                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 react-hooks/set-state-in-effect

   [ERROR] Linea 234:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        232 |     if (!receivableStatus && !isReceivable) {
        233 |       // Resetear estados locales del modal cuando se quita de CxC
      > 234 |       setUserModifiedDate(false);
            |       ^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        235 |       setForceRecalculate(false);
        236 |       setBaseCalculationDate(DateTime.now().startOf('day').toMillis());
        237 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          react-hooks/set-state-in-effect

   [ERROR] Linea 298:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        296 |     if (isOpen && !baseCalculationDate) {
        297 |       const initialBase = DateTime.now().startOf('day').toMillis();
      > 298 |       setBaseCalculationDate(initialBase);
            |       ^^^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        299 |       setForceRecalculate(true); // Forzar recÃ¡lculo inicial
        300 |     }
        301 |   }, [isOpen, baseCalculationDate]);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   react-hooks/set-state-in-effect

   [ERROR] Linea 317:9
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        315 |           }),
        316 |         );
      > 317 |         setForceRecalculate(true);
            |         ^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        318 |       }
        319 |     }
        320 |   }, [isOpen, isReceivable, paymentFrequency, totalInstallments, dispatch]);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              react-hooks/set-state-in-effect


FILE: usePaymentDates.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Sale\components\Cart\components\InvoicePanel\components\Body\components\ReceivableManagementPanel\usePaymentDates.js
   1 problema(s)

   [ERROR] Linea 15:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        13 |   useLayoutEffect(() => {
        14 |     if (installments < 1 || installments > 36) {
      > 15 |       setPaymentDates([]);
           |       ^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        16 |       setNextPaymentDate(null);
        17 |       return;
        18 |     }  react-hooks/set-state-in-effect


FILE: CreditNoteSelector.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Sale\components\Cart\components\InvoicePanel\components\CreditNoteSelector\CreditNoteSelector.jsx
   1 problema(s)

   [ERROR] Linea 40:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        38 |       newSelections[selection.id] = selection.amountToUse;
        39 |     });
      > 40 |     setLocalSelections(newSelections);
           |     ^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        41 |   }, [selectedCreditNotes]);
        42 |
        43 |   // Calcular el total seleccionado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      react-hooks/set-state-in-effect


FILE: CreditSelector.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Sale\components\Cart\components\InvoicePanel\components\CreditSelector\CreditSelector.jsx
   1 problema(s)

   [ERROR] Linea 43:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        41 |       map[sel.id] = sel.amountUsed;
        42 |     });
      > 43 |     setLocalSelections(map);
           |     ^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        44 |   }, [selectedCreditNotes]);
        45 |
        46 |   // Focus search input when modal opens                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  react-hooks/set-state-in-effect


FILE: PriceAndSaleUnitsModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Sale\components\Cart\components\PriceAndSaleUnitsModal.jsx
   2 problema(s)

   [ERROR] Linea 259:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        257 |   useEffect(() => {
        258 |     if (!isVisible) return;
      > 259 |     setSelectedUnitId(
            |     ^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        260 |       selectedUnit ? selectedUnit.id : item.defaultSaleUnitId || 'default',
        261 |     );
        262 |   }, [                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          react-hooks/set-state-in-effect

   [ERROR] Linea 288:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        286 |     });
        287 |
      > 288 |     setCombinedPrices(enabledPrices);
            |     ^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        289 |
        290 |     const defaultPrice = getDefaultPrice(enabledPrices);
        291 |     setSelectedPrice(defaultPrice);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                react-hooks/set-state-in-effect


FILE: InsuranceCoverage.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Sale\components\Cart\components\ProductCardForCart\components\InsuranceCoverage\InsuranceCoverage.jsx
   1 problema(s)

   [ERROR] Linea 80:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        78 |   useEffect(() => {
        79 |     const nextState = deriveInitialState(item);
      > 80 |     setInsuranceState((prev) =>
           |     ^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        81 |       prev.mode === nextState.mode && prev.rawValue === nextState.rawValue
        82 |         ? prev
        83 |         : nextState,  react-hooks/set-state-in-effect


FILE: usePreorderModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Sale\components\usePreorderModal.jsx
   2 problema(s)

   [ERROR] Linea 335:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        333 |   useEffect(() => {
        334 |     if (entries.length === 0) {
      > 335 |       setSelectedPreorderKey((current) => (current === null ? current : null));
            |       ^^^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        336 |       return;
        337 |     }
        338 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            react-hooks/set-state-in-effect

   [ERROR] Linea 465:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        463 |   useEffect(() => {
        464 |     if (!isDeferredBillingEnabled && isOpen) {
      > 465 |       setIsOpen(false);
            |       ^^^^^^^^^ Avoid calling setState() directly within an effect
        466 |     }
        467 |   }, [isDeferredBillingEnabled, isOpen]);
        468 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      react-hooks/set-state-in-effect


FILE: TransactionDetailsTable.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Utility\components\TransactionDetailsTable.jsx
   1 problema(s)

   [ERROR] Linea 28:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        26 |
        27 |   useEffect(() => {
      > 28 |     setPage(0);
           |     ^^^^^^^ Avoid calling setState() directly within an effect
        29 |   }, [rows.length, firstRowId, pageSize]);
        30 |   const currentPage = Math.min(page, totalPages - 1);
        31 |  react-hooks/set-state-in-effect


FILE: UtilityHeader.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Utility\components\UtilityHeader.jsx
   1 problema(s)

   [ERROR] Linea 43:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        41 |
        42 |   useEffect(() => {
      > 43 |     setDraftRange(null);
           |     ^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        44 |   }, [selectedRange?.startDate, selectedRange?.endDate]);
        45 |
        46 |   const pickerValue = useMemo(() => {  react-hooks/set-state-in-effect


FILE: BusinessEditorProfile.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\setting\subPage\BusinessEditor\BusinessEditorProfile.jsx
   1 problema(s)

   [ERROR] Linea 49:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        47 |
        48 |     const normalizedValues = mapBusinessDataToFormValues(business);
      > 49 |     setImageUrl(business.logoUrl || null);
           |     ^^^^^^^^^^^ Avoid calling setState() directly within an effect
        50 |     form.setFieldsValue(normalizedValues);
        51 |     initialValuesRef.current = normalizedValues;
        52 |     setHasUnsavedChanges(false);  react-hooks/set-state-in-effect


FILE: TaxReceIptSetting.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\setting\subPage\TaxReceipts\TaxReceIptSetting.jsx
   1 problema(s)

   [ERROR] Linea 79:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        77 |     const serializedTaxReceipt = serializeFirestoreDocuments(taxReceipt);
        78 |     dispatch(getTaxReceiptData(serializedTaxReceipt));
      > 79 |     setTaxReceiptLocal(serializedTaxReceipt);
           |     ^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        80 |   }, [taxReceipt, dispatch]);
        81 |
        82 |   const handleTaxReceiptEnabled = () => {                                                                 react-hooks/set-state-in-effect


FILE: AddReceiptModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\setting\subPage\TaxReceipts\components\AddReceiptModal\AddReceiptModal.jsx
   1 problema(s)

   [ERROR] Linea 47:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        45 |   useEffect(() => {
        46 |     if (!visible) {
      > 47 |       setSelectedTemplates([]);
           |       ^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        48 |     }
        49 |   }, [visible]);
        50 |  react-hooks/set-state-in-effect


FILE: FiscalReceiptsAlertSettings.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\setting\subPage\TaxReceipts\components\FiscalReceiptsAlertSettings\FiscalReceiptsAlertSettings.jsx
   2 problema(s)

   [ERROR] Linea 39:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        37 |   useEffect(() => {
        38 |     if (initialConfig) {
      > 39 |       setAlertsEnabled(initialConfig.alertsEnabled);
           |       ^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        40 |       setGlobalThresholds(initialConfig.globalThresholds);
        41 |       setCustomThresholds(initialConfig.customThresholds);
        42 |     }  react-hooks/set-state-in-effect

   [ERROR] Linea 55:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        53 |       }
        54 |     });
      > 55 |     setCustomThresholds(initialCustomThresholds);
           |     ^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        56 |   }, [taxReceipts]);
        57 |
        58 |   const handleGlobalThresholdChange = (type, value) => {                                                                               react-hooks/set-state-in-effect


FILE: useTaxReceiptSetting.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\setting\subPage\TaxReceipts\hooks\useTaxReceiptSetting.jsx
   1 problema(s)

   [ERROR] Linea 30:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        28 |     const serializedTaxReceipt = serializeFirestoreDocuments(taxReceipt);
        29 |     dispatch(getTaxReceiptData(serializedTaxReceipt));
      > 30 |     setTaxReceiptLocal(serializedTaxReceipt);
           |     ^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        31 |   }, [taxReceipt, dispatch]);
        32 |
        33 |   const handleSubmit = () => {  react-hooks/set-state-in-effect


FILE: DynamicPermissionsManager.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\setting\subPage\Users\components\DynamicPermissionsManager\DynamicPermissionsManager.jsx
   1 problema(s)

   [ERROR] Linea 48:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        46 |   useEffect(() => {
        47 |     if (isOpen && userId) {
      > 48 |       loadUserPermissions();
           |       ^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        49 |     }
        50 |   }, [isOpen, userId, loadUserPermissions]);
        51 |  react-hooks/set-state-in-effect


FILE: UserList.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\setting\subPage\Users\components\UsersList\UserList.jsx
   2 problema(s)

   [ERROR] Linea 182:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        180 |
        181 |   useEffect(() => {
      > 182 |     setLoading(true);
            |     ^^^^^^^^^^ Avoid calling setState() directly within an effect
        183 |     fbGetUsers(currentUser, setUsers, null, () => setLoading(false));
        184 |   }, [currentUser]);
        185 |  react-hooks/set-state-in-effect

   [ERROR] Linea 199:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        197 |
        198 |     if (userIds.length === 0) {
      > 199 |       setPresenceMap({});
            |       ^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        200 |       return undefined;
        201 |     }
        202 |                                         react-hooks/set-state-in-effect


================================================================================
ARCHIVOS MAS AFECTADOS
================================================================================
  * ReceivableManagementPanel.jsx - 4 ocurrencias
  * Login.tsx - 3 ocurrencias
  * ProductBatchModal.jsx - 2 ocurrencias
  * InvoicesPage.jsx - 2 ocurrencias
  * PreorderSale.jsx - 2 ocurrencias
