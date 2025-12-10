================================================================================
REGLA: preserved
SEVERIDAD: error
TOTAL DE PROBLEMAS: 14
================================================================================


FILE: warehouseNestedServise.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\warehouse\warehouseNestedServise.js
   1 problema(s)

   [ERROR] Linea 256:5
      Compilation Skipped: Existing memoization could not be

      Contexto:
      React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `combineData`, but the source dependencies were [warehouses, shelves, rows, segments, productStock]. Inferred different dependency than source.
        254 |
        255 |   const data = useMemo(
      > 256 |     () => combineData(),
            |     ^^^^^^^^^^^^^^^^^^^ Could not preserve existing manual memoization
        257 |     [warehouses, shelves, rows, segments, productStock],
        258 |   );
        259 |                                                                                                                                                                                                                               react-hooks/preserve-manual-memoization


FILE: useDueDatesReceivable.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\accountsReceivable\useDueDatesReceivable.js
   2 problema(s)

   [ERROR] Linea 76:5
      Compilation Skipped: Existing memoization could not be

      Contexto:
      React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `user`, but the source dependencies were [user?.businessID, dataCache.clients]. Inferred less specific property than source.
         74 |   // FunciÃ³n optimizada para obtener datos de clientes en lote
         75 |   const fetchClientsInBatch = useCallback(
      >  76 |     async (clientIds) => {
            |     ^^^^^^^^^^^^^^^^^^^^^^
      >  77 |       const uncachedClientIds = clientIds.filter(
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      >  78 |         (id) => !dataCache.clients.has(id),
            â€¦
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 129 |       }
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 130 |     },
            | ^^^^^^ Could not preserve existing manual memoization
        131 |     [user?.businessID, dataCache.clients],
        132 |   );
        133 |                react-hooks/preserve-manual-memoization

   [ERROR] Linea 136:5
      Compilation Skipped: Existing memoization could not be

      Contexto:
      React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `user`, but the source dependencies were [user?.businessID, dataCache.invoices]. Inferred less specific property than source.
        134 |   // FunciÃ³n optimizada para obtener datos de facturas en lote
        135 |   const fetchInvoicesInBatch = useCallback(
      > 136 |     async (invoiceIds) => {
            |     ^^^^^^^^^^^^^^^^^^^^^^^
      > 137 |       const uncachedInvoiceIds = invoiceIds.filter(
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 138 |         (id) => !dataCache.invoices.has(id),
            â€¦
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 188 |       }
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 189 |     },
            | ^^^^^^ Could not preserve existing manual memoization
        190 |     [user?.businessID, dataCache.invoices],
        191 |   );
        192 |  react-hooks/preserve-manual-memoization


FILE: useStockAlertThresholds.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\useStockAlertThresholds.js
   2 problema(s)

   [ERROR] Linea 13:55
      Compilation Skipped: Existing memoization could not be

      Contexto:
      React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `billing.stockLowThreshold`, but the source dependencies were [billing?.stockLowThreshold, billing?.stockCriticalThreshold]. Inferred different dependency than source.
        11 |   const billing = settingsCart.billing || {};
        12 |
      > 13 |   const { lowThreshold, criticalThreshold } = useMemo(() => {
           |                                                       ^^^^^^^
      > 14 |     const resolvedLow = Number.isFinite(billing?.stockLowThreshold)
           | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 15 |       ? billing.stockLowThreshold
           â€¦
           | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 25 |     };
           | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 26 |   }, [billing?.stockLowThreshold, billing?.stockCriticalThreshold]);
           | ^^^^ Could not preserve existing manual memoization
        27 |
        28 |   const alertsEnabled = !!billing.stockAlertsEnabled;
        29 |       react-hooks/preserve-manual-memoization

   [ERROR] Linea 13:55
      Compilation Skipped: Existing memoization could not be

      Contexto:
      React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `billing.stockCriticalThreshold`, but the source dependencies were [billing?.stockLowThreshold, billing?.stockCriticalThreshold]. Inferred different dependency than source.
        11 |   const billing = settingsCart.billing || {};
        12 |
      > 13 |   const { lowThreshold, criticalThreshold } = useMemo(() => {
           |                                                       ^^^^^^^
      > 14 |     const resolvedLow = Number.isFinite(billing?.stockLowThreshold)
           | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 15 |       ? billing.stockLowThreshold
           â€¦
           | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 25 |     };
           | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 26 |   }, [billing?.stockLowThreshold, billing?.stockCriticalThreshold]);
           | ^^^^ Could not preserve existing manual memoization
        27 |
        28 |   const alertsEnabled = !!billing.stockAlertsEnabled;
        29 |  react-hooks/preserve-manual-memoization


FILE: FilterBar.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\FilterBar\FilterBar.jsx
   1 problema(s)

   [ERROR] Linea 77:7
      Compilation Skipped: Existing memoization could not be

      Contexto:
      React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `updateFilter`, but the source dependencies were [state.filters, dataConfig]. Inferred different dependency than source.
         75 |     };
         76 |     const renderFilter = useCallback(
      >  77 |       (filterConfig, isInDrawer) => {
            |       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      >  78 |         if (filterConfig.type === 'search') return null;
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      >  79 |
            â€¦
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 153 |         }
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 154 |       },
            | ^^^^^^^^ Could not preserve existing manual memoization
        155 |       [state.filters, dataConfig],
        156 |     );
        157 |  react-hooks/preserve-manual-memoization


FILE: ARSummaryModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\modals\ARInfoModal\ARSummaryModal.jsx
   1 problema(s)

   [ERROR] Linea 179:5
      Compilation Skipped: Existing memoization could not be

      Contexto:
      React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `data`, but the source dependencies were [data.installments, data.ar]. Inferred less specific property than source.
        177 |
        178 |   const nextPaymentInfo = useMemo(
      > 179 |     () => getNextPaymentInfo(data),
            |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Could not preserve existing manual memoization
        180 |     [data.installments, data.ar],
        181 |   );
        182 |  react-hooks/preserve-manual-memoization


FILE: ProductInfo.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\modals\ProductForm\components\sections\ProductInfo.jsx
   1 problema(s)

   [ERROR] Linea 78:32
      Compilation Skipped: Existing memoization could not be

      Contexto:
      React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `product`, but the source dependencies were [productBrands, product?.brand, product?.brandId]. Inferred less specific property than source.
         76 |   }, [product?.type]);
         77 |
      >  78 |   const brandOptions = useMemo(() => {
            |                                ^^^^^^^
      >  79 |     const normalizedBrands = Array.isArray(productBrands)
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      >  80 |       ? productBrands
            â€¦
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 109 |     return options;
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 110 |   }, [productBrands, product?.brand, product?.brandId]);
            | ^^^^ Could not preserve existing manual memoization
        111 |
        112 |   const itemTypeOptions = PRODUCT_ITEM_TYPE_OPTIONS;
        113 |  react-hooks/preserve-manual-memoization


FILE: BusinessInfoPill.tsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Home\components\BusinessInfoPill\BusinessInfoPill.tsx
   1 problema(s)

   [ERROR] Linea 44:5
      Compilation Skipped: Existing memoization could not be

      Contexto:
      React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `business`, but the source dependencies were [business?.name]. Inferred less specific property than source.


FILE: ProductsTable.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Inventario\pages\ItemsManager\components\ProductTable\ProductsTable.jsx
   1 problema(s)

   [ERROR] Linea 45:5
      Compilation Skipped: Existing memoization could not be

      Contexto:
      React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `setDialogConfirm`, but the source dependencies were [user]. Inferred different dependency than source.
        43 |
        44 |   const handleDeleteProduct = useCallback(
      > 45 |     (id) => {
           |     ^^^^^^^^^
      > 46 |       let docId = id?.product?.id ? id?.product?.id : id?.id;
           | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 47 |       setDialogConfirm({
           â€¦
           | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 56 |       });
           | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 57 |     },
           | ^^^^^^ Could not preserve existing manual memoization
        58 |     [user],
        59 |   );
        60 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         react-hooks/preserve-manual-memoization


FILE: SaleReportTable.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\InvoicesPage\SaleReportTable\SaleReportTable.jsx
   1 problema(s)

   [ERROR] Linea 49:34
      Compilation Skipped: Existing memoization could not be

      Contexto:
      React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `data`, but the source dependencies were [data?.date]. Inferred less specific property than source.
        47 |   const invoiceType = cartSettings.billing.invoiceType;
        48 |
      > 49 |   const isEditDisabled = useMemo(() => {
           |                                  ^^^^^^^
      > 50 |     return isInvoiceEditLocked(data);
           | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 51 |   }, [data?.date]);
           | ^^^^ Could not preserve existing manual memoization
        52 |
        53 |   const proceedToEdit = useCallback(
        54 |     (authorization) => {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    react-hooks/preserve-manual-memoization


FILE: FilterBar.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\Compra\components\FilterBar\FilterBar.jsx
   1 problema(s)

   [ERROR] Linea 72:7
      Compilation Skipped: Existing memoization could not be

      Contexto:
      React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `updateFilter`, but the source dependencies were [state.filters, dataConfig]. Inferred different dependency than source.
         70 |
         71 |     const renderFilter = useCallback(
      >  72 |       (filterConfig, isInDrawer) => {
            |       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      >  73 |         if (filterConfig.type === 'search') return null;
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      >  74 |
            â€¦
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 114 |         }
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 115 |       },
            | ^^^^^^^^ Could not preserve existing manual memoization
        116 |       [state.filters, dataConfig],
        117 |     );
        118 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             react-hooks/preserve-manual-memoization


FILE: PinDetailsModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\setting\subPage\AuthorizationConfig\components\PinDetailsModal.jsx
   1 problema(s)

   [ERROR] Linea 181:30
      Compilation Skipped: Existing memoization could not be

      Contexto:
      React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `pinData`, but the source dependencies were [pinData?.pins, moduleNames]. Inferred less specific property than source.
        179 |   );
        180 |
      > 181 |   const pinEntries = useMemo(() => {
            |                              ^^^^^^^
      > 182 |     if (!pinData?.pins || !Array.isArray(pinData.pins)) return [];
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 183 |     return pinData.pins.map((entry) => ({
            â€¦
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 199 |     }));
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 200 |   }, [pinData?.pins, moduleNames]);
            | ^^^^ Could not preserve existing manual memoization
        201 |
        202 |   const togglePinVisibility = (moduleKey) => {
        203 |     setVisiblePins((prev) => ({  react-hooks/preserve-manual-memoization


FILE: TaxReceIptSetting.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\setting\subPage\TaxReceipts\TaxReceIptSetting.jsx
   1 problema(s)

   [ERROR] Linea 138:43
      Compilation Skipped: Existing memoization could not be

      Contexto:
      React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `user`, but the source dependencies were [configuredPrefixes, user?.businessID, userId]. Inferred less specific property than source.
        136 |   };
        137 |
      > 138 |   const handleRebuildLedger = useCallback(() => {
            |                                           ^^^^^^^
      > 139 |     if (!user?.businessID || !userId) {
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 140 |       message.error(
            â€¦
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 205 |     });
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 206 |   }, [configuredPrefixes, user?.businessID, userId]);
            | ^^^^ Could not preserve existing manual memoization
        207 |
        208 |   // Definimos entradas para el control de carga con valores explÃ­citos
        209 |   const loadEntries = [  react-hooks/preserve-manual-memoization


================================================================================
ARCHIVOS MAS AFECTADOS
================================================================================
  * useStockAlertThresholds.js - 2 ocurrencias
  * useDueDatesReceivable.js - 2 ocurrencias
  * SaleReportTable.jsx - 1 ocurrencias
  * ProductsTable.jsx - 1 ocurrencias
  * FilterBar.jsx - 1 ocurrencias
