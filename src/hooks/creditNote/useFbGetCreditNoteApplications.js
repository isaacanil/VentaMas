================================================================================
REGLA: renders (PARTE 1 de 4)
SEVERIDAD: error
TOTAL DE PROBLEMAS: 50
================================================================================


FILE: NavigationProvider.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\Context\NavigationContext\NavigationProvider.jsx
   1 problema(s)

   [ERROR] Linea 12:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        10 |   useEffect(() => {
        11 |     // Solo actualizar si la ruta ha cambiado realmente
      > 12 |     setPathHistory((prev) => {
           |     ^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        13 |       if (prev.length === 0 || prev[prev.length - 1] !== location.pathname) {
        14 |         return [...prev, location.pathname].slice(-10);
        15 |       }  react-hooks/set-state-in-effect


FILE: useDatePicker.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\components\common\DatePicker\hooks\useDatePicker.js
   1 problema(s)

   [ERROR] Linea 27:9
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        25 |     if (value) {
        26 |       if (mode === 'range' && Array.isArray(value) && value[0]) {
      > 27 |         setCurrentDate(value[0]);
           |         ^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        28 |       } else if (mode === 'single' && value) {
        29 |         setCurrentDate(value);
        30 |       }  react-hooks/set-state-in-effect


FILE: SearchPanel.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\components\common\SearchPanel\SearchPanel.jsx
   1 problema(s)

   [ERROR] Linea 26:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        24 |   useEffect(() => {
        25 |     if (isOpen) {
      > 26 |       setTempSearchData(searchData || '');
           |       ^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        27 |       // Enfocar el input despuÃ©s de que se abra el panel
        28 |       setTimeout(() => {
        29 |         const input = document.querySelector('#search-panel-input');  react-hooks/set-state-in-effect


FILE: ProductDiscountModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\components\modals\ProductDiscountModal\ProductDiscountModal.jsx
   1 problema(s)

   [ERROR] Linea 38:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        36 |
        37 |     if (product.discount) {
      > 38 |       setDiscountType(product.discount.type);
           |       ^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        39 |       setDiscountValue(product.discount.value);
        40 |       setPresetDiscount(null);
        41 |       return;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           react-hooks/set-state-in-effect


FILE: useGetChangeogs.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\AppUpdate\useGetChangeogs.js
   1 problema(s)

   [ERROR] Linea 36:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        34 |     } catch (err) {
        35 |       // Si hay error en la inicializaciÃ³n, manejarlo aquÃ­
      > 36 |       setError(err);
           |       ^^^^^^^^ Avoid calling setState() directly within an effect
        37 |     }
        38 |     
        39 |     return () => {  react-hooks/set-state-in-effect


FILE: fbGetPendingBalance.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\accountsReceivable\fbGetPendingBalance.js
   1 problema(s)

   [ERROR] Linea 49:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        47 |   useEffect(() => {
        48 |     if (!businessID || !clientId) {
      > 49 |       setPendingBalance(0);
           |       ^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        50 |       if (onBalanceChange) onBalanceChange(0);
        51 |       return;
        52 |     }  react-hooks/set-state-in-effect


FILE: useClientPendingBalance.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\accountsReceivable\useClientPendingBalance.js
   1 problema(s)

   [ERROR] Linea 21:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        19 |     // ValidaciÃ³n rÃ¡pida
        20 |     if (!user?.businessID || !clientId) {
      > 21 |       setBalance(0);
           |       ^^^^^^^^^^ Avoid calling setState() directly within an effect
        22 |       return;
        23 |     }
        24 |  react-hooks/set-state-in-effect


FILE: useFbGetAccountReceivableByInvoice.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\accountsReceivable\useFbGetAccountReceivableByInvoice.js
   1 problema(s)

   [ERROR] Linea 15:13
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        13 |     useEffect(() => {
        14 |         if (!user?.businessID || !invoiceId) {
      > 15 |             setAccountsReceivable([]);
           |             ^^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        16 |             return;
        17 |         }
        18 |  react-hooks/set-state-in-effect


FILE: useFbGetAccountReceivablePayments.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\accountsReceivable\useFbGetAccountReceivablePayments.js
   1 problema(s)

   [ERROR] Linea 15:13
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        13 |     useEffect(() => {
        14 |         if (!user?.businessID || !arId) {
      > 15 |             setPayments([]);
           |             ^^^^^^^^^^^ Avoid calling setState() directly within an effect
        16 |             return;
        17 |         }
        18 |  react-hooks/set-state-in-effect


FILE: fbGetCashCount.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\cashCount\fbGetCashCount.js
   1 problema(s)

   [ERROR] Linea 44:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        42 |   useEffect(() => {
        43 |     if (!id || !user?.businessID) {
      > 44 |       setCashCount(null);
           |       ^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        45 |       return;
        46 |     }
        47 |  react-hooks/set-state-in-effect


FILE: useFbGetClients.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\client\useFbGetClients.js
   1 problema(s)

   [ERROR] Linea 19:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        17 |   useEffect(() => {
        18 |     if (!user || !user.businessID) {
      > 19 |       setLoading(false);
           |       ^^^^^^^^^^ Avoid calling setState() directly within an effect
        20 |       return;
        21 |     }
        22 |  react-hooks/set-state-in-effect


FILE: useFbGetClientsOnOpen.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\client\useFbGetClientsOnOpen.js
   1 problema(s)

   [ERROR] Linea 27:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        25 |
        26 |     if (!isOpen || !user?.businessID) {
      > 27 |       setClients([]);
           |       ^^^^^^^^^^ Avoid calling setState() directly within an effect
        28 |       setLoading(false);
        29 |       return;
        30 |     }  react-hooks/set-state-in-effect


FILE: useFbGetCreditNotes.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\creditNotes\useFbGetCreditNotes.js
   1 problema(s)

   [ERROR] Linea 22:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        20 |   useEffect(() => {
        21 |     if (!user?.businessID) {
      > 22 |       setCreditNotes([]);
           |       ^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        23 |       return;
        24 |     }
        25 |  react-hooks/set-state-in-effect


FILE: useFbGetCreditNotesByInvoice.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\creditNotes\useFbGetCreditNotesByInvoice.js
   1 problema(s)

   [ERROR] Linea 15:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        13 |   useEffect(() => {
        14 |     if (!user?.businessID || !invoiceId) {
      > 15 |       setCreditNotes([]);
           |       ^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        16 |       return;
        17 |     }
        18 |  react-hooks/set-state-in-effect


FILE: useFbGetDoctors.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\doctors\useFbGetDoctors.js
   1 problema(s)

   [ERROR] Linea 15:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        13 |   useEffect(() => {
        14 |     if (!user || !user?.businessID) {
      > 15 |       setLoading(false);
           |       ^^^^^^^^^^ Avoid calling setState() directly within an effect
        16 |       return;
        17 |     }
        18 |  react-hooks/set-state-in-effect


FILE: useFbGetExpenses.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\expenses\Items\useFbGetExpenses.js
   1 problema(s)

   [ERROR] Linea 53:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        51 |   useEffect(() => {
        52 |     if (!user?.businessID) {
      > 53 |       setLoading(false);
           |       ^^^^^^^^^^ Avoid calling setState() directly within an effect
        54 |       setError(null);
        55 |       setExpensesByScope([]);
        56 |       return undefined;  react-hooks/set-state-in-effect


FILE: insuranceService.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\insurance\insuranceService.js
   1 problema(s)

   [ERROR] Linea 126:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        124 |   useEffect(() => {
        125 |     if (!user?.businessID) {
      > 126 |       setLoading(false);
            |       ^^^^^^^^^^ Avoid calling setState() directly within an effect
        127 |       return undefined;
        128 |     }
        129 |  react-hooks/set-state-in-effect


FILE: useFbGetInvoicesByClient.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\invoices\useFbGetInvoicesByClient.js
   1 problema(s)

   [ERROR] Linea 21:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        19 |   useEffect(() => {
        20 |     if (!user?.businessID || !clientId) {
      > 21 |       setInvoices([]);
           |       ^^^^^^^^^^^ Avoid calling setState() directly within an effect
        22 |       return;
        23 |     }
        24 |  react-hooks/set-state-in-effect


FILE: useFbGetInvoicesBySerie.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\invoices\useFbGetInvoicesBySerie.js
   1 problema(s)

   [ERROR] Linea 45:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        43 |   useEffect(() => {
        44 |     if (!user?.businessID || !bounds?.normalized) {
      > 45 |       setState({ invoices: [], loading: false, error: null });
           |       ^^^^^^^^ Avoid calling setState() directly within an effect
        46 |       return;
        47 |     }
        48 |  react-hooks/set-state-in-effect


FILE: useFbGetInvoicesWithFilters.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\invoices\useFbGetInvoicesWithFilters.js
   1 problema(s)

   [ERROR] Linea 72:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        70 |   useEffect(() => {
        71 |     if (!user?.businessID) {
      > 72 |       setInvoices([]);
           |       ^^^^^^^^^^^ Avoid calling setState() directly within an effect
        73 |       setLoading(false);
        74 |       return;
        75 |     }  react-hooks/set-state-in-effect


FILE: usefbGetOrders.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\order\usefbGetOrders.jsx
   1 problema(s)

   [ERROR] Linea 68:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        66 |   useEffect(() => {
        67 |     if (!user?.businessID || !providerId) {
      > 68 |       setLoading(false);
           |       ^^^^^^^^^^ Avoid calling setState() directly within an effect
        69 |       setData([]);
        70 |       return;
        71 |     }  react-hooks/set-state-in-effect


FILE: fbGetProduct.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\products\fbGetProduct.js
   1 problema(s)

   [ERROR] Linea 72:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        70 |   useEffect(() => {
        71 |     if (productId && user?.businessID) {
      > 72 |       setLoading(true); // Iniciar el estado de carga
           |       ^^^^^^^^^^ Avoid calling setState() directly within an effect
        73 |       const unsubscribe = fbListenProduct(
        74 |         user,
        75 |         productId,  react-hooks/set-state-in-effect


FILE: fbGetProducts.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\products\fbGetProducts.js
   3 problema(s)

   [ERROR] Linea 358:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        356 |   useEffect(() => {
        357 |     if (!stockFilterActive) {
      > 358 |       setWarehouseStockIndex({});
            |       ^^^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        359 |       setStockIndexReady(true);
        360 |       setStockIndexVersion((prev) => prev + 1);
        361 |       return;  react-hooks/set-state-in-effect

   [ERROR] Linea 492:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        490 |     if (!user || !user?.businessID) return;
        491 |
      > 492 |     setLoading(true);
            |     ^^^^^^^^^^ Avoid calling setState() directly within an effect
        493 |     const productsRef = collection(
        494 |       db,
        495 |       'businesses',                                                              react-hooks/set-state-in-effect

   [ERROR] Linea 578:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        576 |     processed = processed.sort((a) => (a?.custom === true ? -1 : 1));
        577 |
      > 578 |     setProducts(processed);
            |     ^^^^^^^^^^^ Avoid calling setState() directly within an effect
        579 |
        580 |     // Calcular totales visibles
        581 |     const total = processed.reduce(                          react-hooks/set-state-in-effect


FILE: fbUpdateSaleUnit.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\products\saleUnits\fbUpdateSaleUnit.js
   1 problema(s)

   [ERROR] Linea 168:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        166 |   useEffect(() => {
        167 |     if (!user || !productId) {
      > 168 |       setError('ParÃ¡metros insuficientes para escuchar las unidades de venta.');
            |       ^^^^^^^^ Avoid calling setState() directly within an effect
        169 |       setLoading(false);
        170 |       return;
        171 |     }  react-hooks/set-state-in-effect


FILE: useBusinessUsers.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\users\useBusinessUsers.jsx
   1 problema(s)

   [ERROR] Linea 15:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        13 |
        14 |   useEffect(() => {
      > 15 |     setError(null);
           |     ^^^^^^^^ Avoid calling setState() directly within an effect
        16 |     setLoading(true);
        17 |
        18 |     if (!currentUser?.businessID) {  react-hooks/set-state-in-effect


FILE: RowShelfService.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\warehouse\RowShelfService.js
   1 problema(s)

   [ERROR] Linea 157:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        155 |   useEffect(() => {
        156 |     if (warehouseId && shelfId && user?.businessID) {
      > 157 |       setLoading(true); // Iniciar el estado de carga
            |       ^^^^^^^^^^ Avoid calling setState() directly within an effect
        158 |       const unsubscribe = listenAllRowShelves(
        159 |         user,
        160 |         warehouseId,  react-hooks/set-state-in-effect


FILE: backOrderService.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\warehouse\backOrderService.js
   1 problema(s)

   [ERROR] Linea 240:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        238 |     let unsubscribe;
        239 |     if (!user?.businessID || !productId) {
      > 240 |       setBackOrders([]);
            |       ^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        241 |       setLoading(false);
        242 |       return;
        243 |     }  react-hooks/set-state-in-effect


FILE: batchService.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\warehouse\batchService.js
   1 problema(s)

   [ERROR] Linea 331:9
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        329 |         !user.businessID
        330 |       ) {
      > 331 |         setData([]);
            |         ^^^^^^^ Avoid calling setState() directly within an effect
        332 |         setLoading(false);
        333 |         return;
        334 |       }  react-hooks/set-state-in-effect


FILE: productMovementService.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\warehouse\productMovementService.js
   1 problema(s)

   [ERROR] Linea 253:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        251 |   useEffect(() => {
        252 |     if (!user || !user.businessID || !locationId) {
      > 253 |       setData([]);
            |       ^^^^^^^ Avoid calling setState() directly within an effect
        254 |       setLoading(false);
        255 |       return;
        256 |     }  react-hooks/set-state-in-effect


FILE: productStockService.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\warehouse\productStockService.js
   4 problema(s)

   [ERROR] Linea 433:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        431 |     // Si no hay location, user o businessID, limpiamos y salimos.
        432 |     if (!location || !user || !user.businessID) {
      > 433 |       setData([]);
            |       ^^^^^^^ Avoid calling setState() directly within an effect
        434 |       setLoading(false);
        435 |       return;
        436 |     }  react-hooks/set-state-in-effect

   [ERROR] Linea 465:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        463 |   useEffect(() => {
        464 |     if (!productId || !stableUser || !stableUser.businessID) {
      > 465 |       setData([]);
            |       ^^^^^^^ Avoid calling setState() directly within an effect
        466 |       setLoading(false);
        467 |       return;
        468 |     }                                    react-hooks/set-state-in-effect

   [ERROR] Linea 705:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        703 |   useEffect(() => {
        704 |     if (!user?.businessID) {
      > 705 |       setData([]);
            |       ^^^^^^^ Avoid calling setState() directly within an effect
        706 |       setLoading(false);
        707 |       return;
        708 |     }                                                                      react-hooks/set-state-in-effect

   [ERROR] Linea 828:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        826 |   useEffect(() => {
        827 |     if (!user?.businessID) {
      > 828 |       setData(new Set());
            |       ^^^^^^^ Avoid calling setState() directly within an effect
        829 |       setLoading(false);
        830 |       return;
        831 |     }                                                               react-hooks/set-state-in-effect


FILE: segmentService.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\warehouse\segmentService.js
   1 problema(s)

   [ERROR] Linea 170:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        168 |   useEffect(() => {
        169 |     if (!user || !warehouseId || !shelfId || !rowShelfId) {
      > 170 |       setData([]);
            |       ^^^^^^^ Avoid calling setState() directly within an effect
        171 |       setLoading(false);
        172 |       return;
        173 |     }  react-hooks/set-state-in-effect


FILE: shelfService.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\warehouse\shelfService.js
   1 problema(s)

   [ERROR] Linea 149:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        147 |   useEffect(() => {
        148 |     if (warehouseId && user?.businessID) {
      > 149 |       setLoading(true); // Iniciar el estado de carga
            |       ^^^^^^^^^^ Avoid calling setState() directly within an effect
        150 |       const unsubscribe = listenAllShelves(
        151 |         user,
        152 |         warehouseId,  react-hooks/set-state-in-effect


FILE: warehouseNestedServise.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\warehouse\warehouseNestedServise.js
   5 problema(s)

   [ERROR] Linea 44:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        42 |     }
        43 |
      > 44 |     setWarehousesLoading(true);
           |     ^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        45 |
        46 |     const unsubscribe = listenAllWarehouses(
        47 |       user,                                                            react-hooks/set-state-in-effect

   [ERROR] Linea 70:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        68 |   useEffect(() => {
        69 |     shelvesUnsubscribes.forEach((u) => u());
      > 70 |     setShelvesUnsubscribes([]);
           |     ^^^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        71 |
        72 |     const newUnsubscribes = [];
        73 |                        react-hooks/set-state-in-effect

   [ERROR] Linea 105:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        103 |   useEffect(() => {
        104 |     rowsUnsubscribes.forEach((u) => u());
      > 105 |     setRowsUnsubscribes([]);
            |     ^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        106 |
        107 |     const newUnsubscribes = [];
        108 |                          react-hooks/set-state-in-effect

   [ERROR] Linea 143:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        141 |   useEffect(() => {
        142 |     segmentsUnsubscribes.forEach((u) => u());
      > 143 |     setSegmentsUnsubscribes([]);
            |     ^^^^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        144 |
        145 |     const newUnsubscribes = [];
        146 |              react-hooks/set-state-in-effect

   [ERROR] Linea 182:5
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        180 |   useEffect(() => {
        181 |     productStockUnsubscribes.forEach((u) => u());
      > 182 |     setProductStockUnsubscribes([]);
            |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        183 |
        184 |     const newUnsubscribes = [];
        185 |  react-hooks/set-state-in-effect


FILE: warehouseService.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\firebase\warehouse\warehouseService.js
   2 problema(s)

   [ERROR] Linea 373:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        371 |   useEffect(() => {
        372 |     if (!id || !user) {
      > 373 |       setData([]);
            |       ^^^^^^^ Avoid calling setState() directly within an effect
        374 |       setLoading(false);
        375 |       return;
        376 |     }       react-hooks/set-state-in-effect

   [ERROR] Linea 397:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        395 |   useEffect(() => {
        396 |     if (!user?.businessID) {
      > 397 |       setData([]);
            |       ^^^^^^^ Avoid calling setState() directly within an effect
        398 |       setLoading(false);
        399 |       return;
        400 |     }  react-hooks/set-state-in-effect


FILE: useCheckAccountReceivable.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\accountsReceivable\useCheckAccountReceivable.jsx
   1 problema(s)

   [ERROR] Linea 42:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        40 |     if (creditLimit?.creditLimit?.status && currentBalance !== null) {
        41 |       const adjustedCreditLimit = currentBalance + -change;
      > 42 |       setIsWithinCreditLimit(
           |       ^^^^^^^^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        43 |         adjustedCreditLimit <= creditLimit?.creditLimit?.value,
        44 |       );
        45 |       setCreditLimitValue(adjustedCreditLimit);  react-hooks/set-state-in-effect


FILE: useCreditLimitRealtime.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\accountsReceivable\useCreditLimitRealtime.js
   1 problema(s)

   [ERROR] Linea 26:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        24 |     // Si no hay user o clientId, resetear estado
        25 |     if (!user?.businessID || !clientId) {
      > 26 |       resetState();
           |       ^^^^^^^^^^ Avoid calling setState() directly within an effect
        27 |       setIsLoading(false);
        28 |       return;
        29 |     }  react-hooks/set-state-in-effect


FILE: useDueDatesReceivable.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\accountsReceivable\useDueDatesReceivable.js
   1 problema(s)

   [ERROR] Linea 195:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        193 |   useEffect(() => {
        194 |     if (!user?.businessID) {
      > 195 |       setLoading(false);
            |       ^^^^^^^^^^ Avoid calling setState() directly within an effect
        196 |       return;
        197 |     }
        198 |                                                                                                                                                                                                                                                       react-hooks/set-state-in-effect


FILE: usePaymentsForCashCount.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\cashCount\usePaymentsForCashCount.js
   1 problema(s)

   [ERROR] Linea 28:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        26 |   useEffect(() => {
        27 |     if (!user?.businessID || !targetUserId || !startDate) {
      > 28 |       setPayments([]);
           |       ^^^^^^^^^^^ Avoid calling setState() directly within an effect
        29 |       setLoading(false);
        30 |       return;
        31 |     }  react-hooks/set-state-in-effect


FILE: useFbGetAvailableCreditNotes.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\creditNote\useFbGetAvailableCreditNotes.js
   1 problema(s)

   [ERROR] Linea 22:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        20 |   useEffect(() => {
        21 |     if (!user?.businessID || !clientId) {
      > 22 |       setCreditNotes([]);
           |       ^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        23 |       setLoading(false);
        24 |       return;
        25 |     }  react-hooks/set-state-in-effect


FILE: useFbGetCreditNoteApplications.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\hooks\creditNote\useFbGetCreditNoteApplications.js
   1 problema(s)

   [ERROR] Linea 37:7
      Error: Calling setState synchronously within an effect can trigger cascading

      Contexto:
      Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
      * Update external systems with the latest state from React.
      * Subscribe for updates from some external system, calling setState in a callback function when external state changes.
      Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).
        35 |   useEffect(() => {
        36 |     if (!user?.businessID) {
      > 37 |       setApplications([]);
           |       ^^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
        38 |       setLoading(false);
        39 |       return;
        40 |     }  react-hooks/set-state-in-effect


================================================================================
ARCHIVOS MAS AFECTADOS
================================================================================
  * warehouseNestedServise.js - 5 ocurrencias
  * productStockService.js - 4 ocurrencias
  * fbGetProducts.js - 3 ocurrencias
  * warehouseService.js - 2 ocurrencias
  * batchService.js - 1 ocurrencias
