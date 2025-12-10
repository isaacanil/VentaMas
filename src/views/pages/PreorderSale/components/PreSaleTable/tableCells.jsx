================================================================================
REGLA: declared
SEVERIDAD: error
TOTAL DE PROBLEMAS: 6
================================================================================


FILE: DeveloperSessionHelper.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\components\devtools\DeveloperSessionHelper.jsx
   1 problema(s)

   [ERROR] Linea 137:45
      Error: Cannot access variable before it is

      Contexto:
      `handlePointerUp` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.
        135 |     window.removeEventListener('pointermove', handlePointerMove);
        136 |     // Usar removeEventListener con una referencia, no self-reference
      > 137 |     window.removeEventListener('pointerup', handlePointerUp);
            |                                             ^^^^^^^^^^^^^^^ `handlePointerUp` accessed before it is declared
        138 |
        139 |     const { moved } = dragState.current;
        140 |     dragState.current = {
        132 |   );
        133 |
      > 134 |   const handlePointerUp = useCallback(() => {
            |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 135 |     window.removeEventListener('pointermove', handlePointerMove);
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 136 |     // Usar removeEventListener con una referencia, no self-reference
            â€¦
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 150 |      
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 151 |   }, [handlePointerMove]);
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^ `handlePointerUp` is declared here
        152 |
        153 |   const handlePointerDown = useCallback(
        154 |     (event) => {  react-hooks/immutability


FILE: DeveloperModal.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\components\modals\DeveloperModal\DeveloperModal.jsx
   1 problema(s)

   [ERROR] Linea 219:7
      Error: Cannot access variable before it is

      Contexto:
      `triggerCommandExecution` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.
        217 |
        218 |     if (options.trigger === 'click' && !needsAdditionalInput) {
      > 219 |       triggerCommandExecution(command);
            |       ^^^^^^^^^^^^^^^^^^^^^^^ `triggerCommandExecution` accessed before it is declared
        220 |       setCommandInput('');
        221 |     }
        222 |   };
        402 |   };
        403 |
      > 404 |   const triggerCommandExecution = (command) => {
            |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 405 |     const commandText = command?.trim();
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 406 |     if (!commandText || !commandProcessorRef.current) return;
            â€¦
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 417 |     executeCommand();
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 418 |   };
            | ^^^^^ `triggerCommandExecution` is declared here
        419 |
        420 |   // Texto de bienvenida de la consola
        421 |   const welcomeText = `  react-hooks/immutability


FILE: PaymentFields.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\forms\PaymentForm\components\PaymentFields.jsx
   2 problema(s)

   [ERROR] Linea 73:9
      Error: Cannot access variable before it is

      Contexto:
      `handleStatusChange` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.
        71 |       if (cashMethod && !cashMethod.status) {
        72 |         // Activar efectivo automÃ¡ticamente y asignar el monto total
      > 73 |         handleStatusChange(cashMethod, true, totalAmount);
           |         ^^^^^^^^^^^^^^^^^^ `handleStatusChange` accessed before it is declared
        74 |       } else if (cashMethod && cashMethod.status && cashMethod.value === 0) {
        75 |         // Si ya estÃ¡ activo pero sin valor, asignar el monto total
        76 |         handleValueChange(cashMethod, totalAmount);
        106 |   };
        107 |
      > 108 |   const handleStatusChange = (method, status, autoValue = null) => {
            |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 109 |     let newValue = method.value;
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 110 |
            â€¦
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 160 |     }
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 161 |   };
            | ^^^^^ `handleStatusChange` is declared here
        162 |
        163 |   const handleValueChange = (method, newValue) => {
        164 |     // Validar que el valor no sea negativo  react-hooks/immutability

   [ERROR] Linea 76:9
      Error: Cannot access variable before it is

      Contexto:
      `handleValueChange` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.
        74 |       } else if (cashMethod && cashMethod.status && cashMethod.value === 0) {
        75 |         // Si ya estÃ¡ activo pero sin valor, asignar el monto total
      > 76 |         handleValueChange(cashMethod, totalAmount);
           |         ^^^^^^^^^^^^^^^^^ `handleValueChange` accessed before it is declared
        77 |       }
        78 |     }
        79 |   }, [paymentDetails.totalAmount, visiblePaymentMethods.length]); // Usar visiblePaymentMethods
        161 |   };
        162 |
      > 163 |   const handleValueChange = (method, newValue) => {
            |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 164 |     // Validar que el valor no sea negativo
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 165 |     const validValue = Math.max(0, Number(newValue) || 0);
            â€¦
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 182 |     }
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 183 |   };
            | ^^^^^ `handleValueChange` is declared here
        184 |
        185 |   const handleReferenceChange = (method, newReference) => {
        186 |     dispatch(                       react-hooks/immutability


FILE: useExpandedNodes.js
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\component\tree\hooks\useExpandedNodes.js
   1 problema(s)

   [ERROR] Linea 28:23
      Error: Cannot access variable before it is

      Contexto:
      `findNodeById` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.
        26 |       }
        27 |       if (node.children?.length) {
      > 28 |         const found = findNodeById(node.children, id);
           |                       ^^^^^^^^^^^^ `findNodeById` accessed before it is declared
        29 |         if (found) {
        30 |           return found;
        31 |         }
        20 |   );
        21 |
      > 22 |   const findNodeById = useCallback((nodes, id) => {
           |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 23 |     for (const node of nodes || []) {
           | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 24 |       if (node.id === id) {
           â€¦
           | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 34 |     return null;
           | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 35 |   }, []);
           | ^^^^^^^^^^ `findNodeById` is declared here
        36 |
        37 |   const findAllChildrenIds = useCallback(
        38 |     (nodeId) => {  react-hooks/immutability


FILE: tableCells.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\PreorderSale\components\PreSaleTable\tableCells.jsx
   1 problema(s)

   [ERROR] Linea 105:32
      Error: Cannot access variable before it is

      Contexto:
      `convertTimestampsToMillis` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.
        103 |     if (!obj || typeof obj !== 'object') return obj;
        104 |     if (Array.isArray(obj)) {
      > 105 |       return obj.map((item) => convertTimestampsToMillis(item));
            |                                ^^^^^^^^^^^^^^^^^^^^^^^^^ `convertTimestampsToMillis` accessed before it is declared
        106 |     }
        107 |     const converted = {};
        108 |     Object.keys(obj).forEach((key) => {
        100 |   });
        101 |
      > 102 |   const convertTimestampsToMillis = useCallback((obj) => {
            |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 103 |     if (!obj || typeof obj !== 'object') return obj;
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 104 |     if (Array.isArray(obj)) {
            â€¦
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 124 |     return converted;
            | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 125 |   }, []);
            | ^^^^^^^^^^ `convertTimestampsToMillis` is declared here
        126 |
        127 |   const printableInvoiceData = useMemo(() => {
        128 |     const source = printablePreorder || data;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           react-hooks/immutability


================================================================================
ARCHIVOS MAS AFECTADOS
================================================================================
  * PaymentFields.jsx - 2 ocurrencias
  * useExpandedNodes.js - 1 ocurrencias
  * tableCells.jsx - 1 ocurrencias
  * DeveloperModal.jsx - 1 ocurrencias
  * DeveloperSessionHelper.jsx - 1 ocurrencias
