================================================================================
REGLA: renders (PARTE 2 de 4)
SEVERIDAD: error
TOTAL DE PROBLEMAS: 50
================================================================================


FILE: useFbGetCreditNoteApplicationsByInvoice.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\creditNote\useFbGetCreditNoteApplicationsByInvoice.js
   1 problema(s)

   [ERROR] Linea 26:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        24 |   useEffect(() => {
        25 |     if (!user?.businessID || !invoiceId) {
      > 26 |       setApplications([]);
           |       ^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        27 |       setLoading(false);
        28 |       return;
        29 |     }  react-hooks/set-state-in-effect


FILE: useProductRealtimeListener.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\product\useProductRealtimeListener.js
   1 problema(s)

   [ERROR] Linea 27:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        25 |     // Solo crear el listener si tenemos los datos necesarios y estÃ¡ habilitado
        26 |     if (!businessId || !productId || !enabled) {
      > 27 |       setProductData(null);
           |       ^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        28 |       setLoading(false);
        29 |       setError(null);
        30 |       setIsConnected(false);  react-hooks/set-state-in-effect


FILE: useGetProductsWithBatch.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\products\useGetProductsWithBatch.js
   1 problema(s)

   [ERROR] Linea 57:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        55 |   useEffect(() => {
        56 |     if (!user || !user.businessID) {
      > 57 |       setProducts([]);
           |       ^^^^^^^^^^^ Avoid calling setState() directly within an effect
        58 |       setLoading(false);
        59 |       return;
        60 |     }  react-hooks/set-state-in-effect


FILE: useListenBatch.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\products\useListenBatch.js
   1 problema(s)

   [ERROR] Linea 12:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        10 |   useEffect(() => {
        11 |     if (!productID) {
      > 12 |       setBatches([]);
           |       ^^^^^^^^^^ Avoid calling setState() directly within an effect
        13 |       setLoading(false);
        14 |       return;
        15 |     }  react-hooks/set-state-in-effect


FILE: useNavigationHistory.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\routes\useNavigationHistory.jsx
   2 problema(s)

   [ERROR] Linea 31:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        29 |       location.pathname !== previousLocation.pathname
        30 |     ) {
      > 31 |       setHistory((prevHistory) => {
           |       ^^^^^^^^^^ Avoid calling setState() directly within an effect
        32 |         const newHistory = [...prevHistory, location];
        33 |         if (maxLength && newHistory.length > maxLength) {
        34 |           return newHistory.slice(newHistory.length - maxLength);  react-hooks/set-state-in-effect

   [ERROR] Linea 46:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        44 |   useEffect(() => {
        45 |     if (history.length < 2) {
      > 46 |       setPreviousRelevantRoute(null); // No hay suficiente historial
           |       ^^^^^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        47 |       return;
        48 |     }
        49 |                                                                                                                              react-hooks/set-state-in-effect


FILE: useFirestoreRealtime.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\useFirestoreRealtime.js
   1 problema(s)

   [ERROR] Linea 10:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
         8 |   useEffect(() => {
         9 |     if (!collectionRef) {
      > 10 |       setData([]);
           |       ^^^^^^^ Avoid calling setState() directly within an effect
        11 |       setLoading(false);
        12 |       return;
        13 |     }  react-hooks/set-state-in-effect


FILE: useMediaQuery.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\useMediaQuery.js
   1 problema(s)

   [ERROR] Linea 10:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
         8 |
         9 |     // Set initial value
      > 10 |     setMatches(media.matches);
           |     ^^^^^^^^^^ Avoid calling setState() directly within an effect
        11 |
        12 |     // Create listener function
        13 |     const listener = (event) => {  react-hooks/set-state-in-effect


FILE: useReceivableValidation.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\useReceivableValidation.js
   2 problema(s)

   [ERROR] Linea 52:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        50 |     if (creditLimit?.creditLimit?.status && currentBalance !== null) {
        51 |       const adjustedCreditLimit = currentBalance + -change;
      > 52 |       setIsWithinCreditLimit(
           |       ^^^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        53 |         adjustedCreditLimit <= creditLimit?.creditLimit?.value,
        54 |       );
        55 |       setCreditLimitValue(adjustedCreditLimit);  react-hooks/set-state-in-effect

   [ERROR] Linea 87:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        85 |     }
        86 |
      > 87 |     setIsValid(newIsValid);
           |     ^^^^^^^^^^ Avoid calling setState() directly within an effect
        88 |     setErrorMessage(newErrorMessage);
        89 |   }, [
        90 |     isGenericClient,                                                                                                                                                                                                      react-hooks/set-state-in-effect


FILE: useScreenSize.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\useScreenSize.js
   1 problema(s)

   [ERROR] Linea 17:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        15 |
        16 |     // Actualizar el ancho del elemento referenciado
      > 17 |     setWidth(getElementWidth());
           |     ^^^^^^^^ Avoid calling setState() directly within an effect
        18 |
        19 |     const handleResize = () => {
        20 |       setWidth(getElementWidth());  react-hooks/set-state-in-effect


FILE: useSearchFilter.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\useSearchFilter.js
   3 problema(s)

   [ERROR] Linea 7:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
         5 |   useEffect(() => {
         6 |     if (String(searchTerm).trim() === '') {
      >  7 |       setFilterClients(clients);
           |       ^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
         8 |       return;
         9 |     }
        10 |     const serachRegex = new RegExp(searchTerm, 'i');  react-hooks/set-state-in-effect

   [ERROR] Linea 23:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        21 |   useEffect(() => {
        22 |     if (String(searchTerm).trim() === '') {
      > 23 |       setFilteredList(list);
           |       ^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        24 |       return;
        25 |     }
        26 |     const searchRegex = new RegExp(searchTerm, 'i');       react-hooks/set-state-in-effect

   [ERROR] Linea 42:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        40 |   useEffect(() => {
        41 |     if (String(searchTerm).trim() === '') {
      > 42 |       setFilteredData(data);
           |       ^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        43 |       return;
        44 |     }
        45 |     const searchRegex = new RegExp(searchTerm, 'i');       react-hooks/set-state-in-effect


FILE: useTruncate.tsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\useTruncate.tsx
   1 problema(s)

   [ERROR] Linea 22:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).


FILE: useGetWarehouseData.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\warehouse\useGetWarehouseData.jsx
   1 problema(s)

   [ERROR] Linea 104:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        102 |
        103 |   useEffect(() => {
      > 104 |     fetchData(memoizedUser, items);
            |     ^^^^^^^^^ Avoid calling setState() directly within an effect
        105 |   }, [memoizedUser, memorizedItems]);
        106 |
        107 |   return { data, loading, error };  react-hooks/set-state-in-effect


FILE: PreviewContent.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\EvidenceUpload\PreviewContent.jsx
   1 problema(s)

   [ERROR] Linea 160:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        158 |     let localUrl;
        159 |     if (previewFile) {
      > 160 |       setIsLoading(true);
            |       ^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        161 |       setError(null);
        162 |
        163 |       if (previewFile.file instanceof File) {  react-hooks/set-state-in-effect


FILE: PreviewContent.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\FileUploader\PreviewContent.jsx
   1 problema(s)

   [ERROR] Linea 160:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        158 |     let localUrl;
        159 |     if (previewFile) {
      > 160 |       setIsLoading(true);
            |       ^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        161 |       setError(null);
        162 |
        163 |       if (previewFile.file instanceof File) {  react-hooks/set-state-in-effect


FILE: useFilterBar.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\FilterBar\hooks\useFilterBar.js
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


FILE: GeneralConfig.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\GeneralConfig\GeneralConfig.jsx
   1 problema(s)

   [ERROR] Linea 299:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        297 |     // Sincronizar activeTab con la ruta actual
        298 |     if (currentPath.includes('business')) {
      > 299 |       setActiveTab('business');
            |       ^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        300 |     } else if (currentPath.includes('inventory')) {
        301 |       setActiveTab('inventory');
        302 |     } else if (currentPath.includes('billing')) {  react-hooks/set-state-in-effect


FILE: GeneralConfigSearch.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\GeneralConfig\components\Search\GeneralConfigSearch.jsx
   2 problema(s)

   [ERROR] Linea 129:9
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        127 |     if (!filteredOptions.length) {
        128 |       if (activeIndex !== -1) {
      > 129 |         setActiveIndex(-1);
            |         ^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        130 |       }
        131 |       return;
        132 |     }  react-hooks/set-state-in-effect

   [ERROR] Linea 152:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        150 |
        151 |   useEffect(() => {
      > 152 |     setInputValue('');
            |     ^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        153 |     setIsOpen(false);
        154 |     setActiveIndex(-1);
        155 |   }, [dependencyKey]);                  react-hooks/set-state-in-effect


FILE: Loader.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\Loader\Loader.jsx
   1 problema(s)

   [ERROR] Linea 59:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        57 |     let timer;
        58 |     if (loading) {
      > 59 |       setShowLoader(true);
           |       ^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        60 |       setFadeOut(false);
        61 |       loadingStartTime.current = Date.now();
        62 |     } else {  react-hooks/set-state-in-effect


FILE: ProductFilter.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\ProductFilter\ProductFilter.jsx
   1 problema(s)

   [ERROR] Linea 33:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        31 |   useEffect(() => {
        32 |     if (!productName) {
      > 33 |       setSearchTerm('');
           |       ^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        34 |     }
        35 |     if (productName) {
        36 |       setSearchTerm(productName);  react-hooks/set-state-in-effect


FILE: QuotationTemplate2.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\Quotation\templates\Invoicing\QuotationTemplate2\QuotationTemplate2.jsx
   1 problema(s)

   [ERROR] Linea 91:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        89 |
        90 |     useLayoutEffect(() => {
      > 91 |       setHeaderHeight(calcHeaderHeight(business, data));
           |       ^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        92 |       setFooterHeight(calcFooterHeight(data));
        93 |     }, [business, data]);
        94 |  react-hooks/set-state-in-effect


FILE: ClienteControl.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\contact\ClientControl\ClienteControl.jsx
   1 problema(s)

   [ERROR] Linea 106:9
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        104 |     switch (mode) {
        105 |       case CLIENT_MODE_BAR.SEARCH.id:
      > 106 |         setInputIcon(CLIENT_MODE_BAR.SEARCH.icon);
            |         ^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        107 |         setSearchTerm('');
        108 |         break;
        109 |  react-hooks/set-state-in-effect


FILE: AddExpensesCategory.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\modals\AddExpenseCategory\AddExpensesCategory.jsx
   1 problema(s)

   [ERROR] Linea 38:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        36 |   useEffect(() => {
        37 |     if (categoryToUpdate) {
      > 38 |       setCategory(categoryToUpdate);
           |       ^^^^^^^^^^^ Avoid calling setState() directly within an effect
        39 |     }
        40 |   }, [categoryToUpdate]);
        41 |  react-hooks/set-state-in-effect


FILE: InvoiceSelector.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\modals\CreditNoteModal\components\InvoiceSelector.jsx
   1 problema(s)

   [ERROR] Linea 205:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        203 |
        204 |   useEffect(() => {
      > 205 |     setCurrentPage(1);
            |     ^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        206 |   }, [search, visible]);
        207 |
        208 |   const filteredInvoices = search                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        react-hooks/set-state-in-effect


FILE: Client.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\modals\InvoiceForm\components\Client\Client.jsx
   1 problema(s)

   [ERROR] Linea 94:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        92 |   useEffect(() => {
        93 |     if (readOnly && isModalOpen) {
      > 94 |       setIsModalOpen(false);
           |       ^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        95 |     }
        96 |   }, [readOnly, isModalOpen]);
        97 |  react-hooks/set-state-in-effect


FILE: PaymentInfo.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\modals\InvoiceForm\components\PaymentInfo\PaymentInfo.jsx
   1 problema(s)

   [ERROR] Linea 298:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        296 |   useEffect(() => {
        297 |     if (invoice?.discount?.type && invoice.discount.type !== discountType) {
      > 298 |       setDiscountType(invoice.discount.type);
            |       ^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        299 |     }
        300 |   }, [invoice?.discount?.type, discountType]);
        301 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       react-hooks/set-state-in-effect


FILE: usePaymentInfo.ts
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\modals\InvoiceForm\components\PaymentInfo\hooks\usePaymentInfo.ts
   1 problema(s)

   [ERROR] Linea 299:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).


FILE: ProductListModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\modals\InvoiceForm\components\Products\ProductListModal.jsx
   1 problema(s)

   [ERROR] Linea 62:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        60 |     );
        61 |     if (!hasSelectedCategory) {
      > 62 |       setCategoryFilter('all');
           |       ^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        63 |     }
        64 |   }, [categoryFilter, categoryStats]);
        65 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            react-hooks/set-state-in-effect


FILE: Products.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\modals\InvoiceForm\components\Products\Products.jsx
   2 problema(s)

   [ERROR] Linea 85:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        83 |     );
        84 |     if (!hasSelectedCategory) {
      > 85 |       setCategoryFilter('all');
           |       ^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        86 |     }
        87 |   }, [categoryFilter, categoryStats]);
        88 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            react-hooks/set-state-in-effect

   [ERROR] Linea 245:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        243 |
        244 |   useEffect(() => {
      > 245 |     setPaginationState((prev) => ({
            |     ^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        246 |       ...prev,
        247 |       current: 1,
        248 |     }));                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        react-hooks/set-state-in-effect


FILE: TimeRemainingBadge.tsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\modals\InvoiceForm\components\TimeRemainingBadge\TimeRemainingBadge.tsx
   1 problema(s)

   [ERROR] Linea 87:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).


FILE: Modal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\modals\Modal.jsx
   1 problema(s)

   [ERROR] Linea 32:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        30 |       }, 300);
        31 |     } else {
      > 32 |       setModalContent(false);
           |       ^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        33 |     }
        34 |   }, [isOpen]);
        35 |   const backdropVariants = {  react-hooks/set-state-in-effect


FILE: AdjustInventoryModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\modals\ProductForm\components\sections\AdjustInventoryModal.jsx
   1 problema(s)

   [ERROR] Linea 16:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        14 |   // Actualiza los valores del modal cuando se reciben nuevas props
        15 |   useEffect(() => {
      > 16 |     setAdjustedStock(stock);
           |     ^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        17 |     setAdjustedTotalUnit(stock * packSize);
        18 |   }, [stock, packSize]);
        19 |  react-hooks/set-state-in-effect


FILE: BarCode.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\modals\ProductForm\components\sections\BarCode.jsx
   2 problema(s)

   [ERROR] Linea 115:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        113 |
        114 |   useEffect(() => {
      > 115 |     setBarcodeValue(String(product?.barcode || ''));
            |     ^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        116 |   }, [product?.barcode]);
        117 |
        118 |   const barcodeInfo = barcodeValue ? getBarcodeInfo(barcodeValue) : null;  react-hooks/set-state-in-effect

   [ERROR] Linea 313:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        311 |   useEffect(() => {
        312 |     if (inputHasFocus && correction) {
      > 313 |       setShowFixTooltip(true);
            |       ^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        314 |     } else {
        315 |       setShowFixTooltip(false);
        316 |     }                              react-hooks/set-state-in-effect


FILE: BarcodeCorrector.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\modals\ProductForm\components\sections\BarcodeCorrector\BarcodeCorrector.jsx
   2 problema(s)

   [ERROR] Linea 149:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        147 |
        148 |   useEffect(() => {
      > 149 |     setWorkingCode(currentBarcode || '');
            |     ^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        150 |     setSelectedSuggestion(null);
        151 |   }, [currentBarcode, visible]);
        152 |  react-hooks/set-state-in-effect

   [ERROR] Linea 172:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        170 |           ),
        171 |       }));
      > 172 |       setSuggestions(uiSuggestions);
            |       ^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        173 |     } else {
        174 |       setSuggestions([]);
        175 |     }                      react-hooks/set-state-in-effect


FILE: BarcodePrintModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\modals\ProductForm\components\sections\BarcodePrintModal\BarcodePrintModal.jsx
   1 problema(s)

   [ERROR] Linea 149:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        147 |       totalModules > 0 ? Math.floor(availablePx / totalModules) : 2;
        148 |     const nominal = mmToPx(config.X_MM);
      > 149 |     setXPx(Math.max(1, Math.min(nominal, theoretical)));
            |     ^^^^^^ Avoid calling setState() directly within an effect
        150 |   }, [visible, config, barcodeValue]);
        151 |
        152 |   const validate = () => {  react-hooks/set-state-in-effect


FILE: PriceCalculator.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\modals\ProductForm\components\sections\PriceCalculator.jsx
   1 problema(s)

   [ERROR] Linea 149:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        147 |   useEffect(() => {
        148 |     const newTableData = calculateTableData(product);
      > 149 |     setTableData(newTableData);
            |     ^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        150 |   }, [
        151 |     product.pricing.cost,
        152 |     product.pricing.tax,  react-hooks/set-state-in-effect


FILE: useSelectedNode.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\tree\hooks\useSelectedNode.js
   1 problema(s)

   [ERROR] Linea 29:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        27 |         });
        28 |       }
      > 29 |       setSelectedNode(selectedId);
           |       ^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        30 |     }
        31 |   }, [selectedId, data]);
        32 |  react-hooks/set-state-in-effect


FILE: AccountReceivableList.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\AccountReceivable\pages\AccountReceivableList\AccountReceivableList.jsx
   1 problema(s)

   [ERROR] Linea 150:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        148 |       sortDirection,
        149 |     );
      > 150 |     setProcessedAccount(sortedData);
            |     ^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        151 |   }, [
        152 |     accountsReceivable,
        153 |     sortCriteria,  react-hooks/set-state-in-effect


FILE: AuthorizationsManager.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Authorizations\AuthorizationsManager.jsx
   1 problema(s)

   [ERROR] Linea 95:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        93 |   useEffect(() => {
        94 |     if (resolvedActiveTab && resolvedActiveTab !== activeTab) {
      > 95 |       setActiveTab(resolvedActiveTab);
           |       ^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        96 |     }
        97 |   }, [resolvedActiveTab, activeTab]);
        98 |  react-hooks/set-state-in-effect


FILE: CashRecociliationTable.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\CashReconciliation\components\Body\CashRecociliationTable.jsx
   1 problema(s)

   [ERROR] Linea 76:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        74 |
        75 |   useEffect(() => {
      > 76 |     setLoading(true);
           |     ^^^^^^^^^^ Avoid calling setState() directly within an effect
        77 |     const currentFilterDateRange = filterState.filters?.createdAtDateRange;
        78 |     const newStartDate = currentFilterDateRange?.startDate ?? null; // Expecting Milliseconds
        79 |     const newEndDate = currentFilterDateRange?.endDate ?? null; // Expecting Milliseconds  react-hooks/set-state-in-effect


FILE: OrderItem.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Category\components\ListItem\OrderItem.jsx
   1 problema(s)

   [ERROR] Linea 33:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        31 |   };
        32 |   useEffect(() => {
      > 33 |     setCategory({
           |     ^^^^^^^^^^^ Avoid calling setState() directly within an effect
        34 |       name: cat.name,
        35 |       id: cat.id,
        36 |     });  react-hooks/set-state-in-effect


FILE: ClientForm.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Contact\Client\components\ClientForm\ClientForm.jsx
   1 problema(s)

   [ERROR] Linea 39:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        37 |   useEffect(() => {
        38 |     if (mode === update && data) {
      > 39 |       setClient(data);
           |       ^^^^^^^^^ Avoid calling setState() directly within an effect
        40 |     }
        41 |     if (mode === create && !data) {
        42 |       setClient({                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              react-hooks/set-state-in-effect


FILE: CreditLimits.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\Contact\Client\components\ClientForm\components\ClientFinancialInfo\components\CreditLimits.jsx
   1 problema(s)

   [ERROR] Linea 46:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        44 |   useEffect(() => {
        45 |     if (creditLimitState) {
      > 46 |       setCreditLimitStatus(creditLimitState?.creditLimit?.status);
           |       ^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        47 |     }
        48 |   }, [creditLimitState]);
        49 |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          react-hooks/set-state-in-effect


================================================================================
ARCHIVOS MAS AFECTADOS
================================================================================
  * useSearchFilter.js - 3 ocurrencias
  * useReceivableValidation.js - 2 ocurrencias
  * Products.jsx - 2 ocurrencias
  * BarCode.jsx - 2 ocurrencias
  * GeneralConfigSearch.jsx - 2 ocurrencias
