================================================================================
REGLA: expression
SEVERIDAD: error
TOTAL DE PROBLEMAS: 2
================================================================================


FILE: NotesInput.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\OrderManagement\components\GeneralForm\components\NotesInput.jsx
   1 problema(s)

   [ERROR] Linea 15:5
      Error: Expected the first argument to be an inline function

      Contexto:
      Expected the first argument to be an inline function expression.
        13 |
        14 |   const debouncedDispatch = useCallback(
      > 15 |     debounce((value) => {
           |     ^^^^^^^^^^^^^^^^^^^^^
      > 16 |       onNoteChange(value);
           | ^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 17 |     }, 500),
           | ^^^^^^^^^^^^ Expected the first argument to be an inline function expression
        18 |     [onNoteChange],
        19 |   );
        20 |  react-hooks/use-memo


FILE: NotesInput.jsx
   C:\Users\jonat\OneDrive\Documentos\VentaMas\src\views\pages\OrderAndPurchase\PurchaseManagement\components\GeneralForm\components\NotesInput.jsx
   1 problema(s)

   [ERROR] Linea 15:5
      Error: Expected the first argument to be an inline function

      Contexto:
      Expected the first argument to be an inline function expression.
        13 |
        14 |   const debouncedDispatch = useCallback(
      > 15 |     debounce((value) => {
           |     ^^^^^^^^^^^^^^^^^^^^^
      > 16 |       onNoteChange(value);
           | ^^^^^^^^^^^^^^^^^^^^^^^^^^
      > 17 |     }, 500),
           | ^^^^^^^^^^^^ Expected the first argument to be an inline function expression
        18 |     [onNoteChange],
        19 |   );
        20 |  react-hooks/use-memo


================================================================================
ARCHIVOS MAS AFECTADOS
================================================================================
  * NotesInput.jsx - 1 ocurrencias
  * NotesInput.jsx - 1 ocurrencias
