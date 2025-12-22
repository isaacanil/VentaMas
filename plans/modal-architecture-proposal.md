# Propuesta de Refactorización de Arquitectura: Sistema de Gestión de Modales

## 1. Contexto y Estado Actual
**Archivo Principal:** `src/views/component/modals/ModalManager.jsx`

Actualmente, el sistema de modales funciona bajo un patrón de "Gestor Centralizado Híbrido". El `ModalManager` actúa como un componente contenedor que reside permanentemente en el árbol de la aplicación y es responsable de renderizar la gran mayoría de los diálogos emergentes del sistema.

### Características de la Arquitectura Actual:
1.  **Renderizado "Fantasma" (Anti-patrón Principal):**
    *   Muchos componentes complejos (ej. `ShelfForm`, `RowShelfForm`, `WarehouseForm`, `NoteModal`) se renderizan **incondicionalmente** dentro del `ModalManager`.
    *   *Mecanismo:* El componente hijo se monta, se suscribe a su propio slice de Redux (ej. `shelfModalSlice`), y decide internamente si mostrarse (`open={true}`) o no.
    *   *Impacto:* Aunque el modal esté cerrado, el componente React está vivo, ocupando memoria, ejecutando hooks y escuchando cambios en el store.

2.  **Estado Fragmentado:**
    *   Existe un `modalSlice` central para modales simples.
    *   Existen múltiples slices dedicados (`shelfModalSlice`, `notificationSlice`, etc.) para modales complejos.
    *   El `ModalManager` debe importar y suscribirse a todos estos estados dispersos.

3.  **Cuello de Botella de Renderizado:**
    *   `ModalManager` utiliza más de **10 selectores (`useSelector`) distintos**.
    *   Cualquier cambio en el estado de visibilidad de *cualquier* modal provoca que `ModalManager` se re-renderice, forzando la reconciliación de sus ~30 componentes hijos.

4.  **Carga de Recursos (Bundle Size):**
    *   Mezcla de `React.lazy` e importaciones estáticas. Componentes pesados como `AddCategoryModal` o `ProductOutflowModal` se importan estáticamente, aumentando el tiempo de carga inicial de la aplicación innecesariamente.

---

## 2. Arquitectura Propuesta: "Modal Registry & Global State"

El objetivo es desacoplar la lógica de activación de la lógica de renderizado, moviéndose hacia un sistema bajo demanda.

### A. Estado Global Unificado (UI Slice)
En lugar de booleanos dispersos (`isAddClientOpen`, `isShelfOpen`), se utiliza un puntero al modal activo.

```javascript
// store/uiSlice.js
const initialState = {
  activeModal: null, // String key: 'ADD_CLIENT', 'SHELF_FORM'
  modalProps: {},    // Datos dinámicos para el modal
};
```

### B. Patrón de Registro (The Registry)
Un objeto de mapeo que asocia claves (strings) con componentes cargados perezosamente (`Lazy`).

```javascript
// component/modals/ModalRegistry.js
import { lazy } from 'react';

export const MODAL_REGISTRY = {
  ADD_CLIENT: lazy(() => import('./addClient/AddClientModal')),
  SHELF_FORM: lazy(() => import('../../pages/Inventory/.../ShelfForm')),
  // ... resto de modales
};
```

### C. El Nuevo ModalManager "Tonto"
El componente se simplifica drásticamente. Su única responsabilidad es buscar la clave activa en el registro y renderizar ese componente específico.

```javascript
export const ModalManager = () => {
  const { activeModal, modalProps } = useSelector(selectUiState);
  const dispatch = useDispatch();

  // 1. Si no hay modal, no renderizamos nada (0 memoria usada)
  if (!activeModal) return null;

  const ModalComponent = MODAL_REGISTRY[activeModal];

  return (
    <Suspense fallback={<Loader />}>
       <ModalComponent
          {...modalProps}
          isOpen={true} // Siempre true si está montado
          onClose={() => dispatch(closeModal())}
       />
    </Suspense>
  );
};
```

---

## 3. Puntos de Debate para la IA Revisora

Invito al análisis crítico de esta propuesta enfocándose en los siguientes puntos conflictivos:

### A. Persistencia del Estado (Formularios)
*   **Problema:** En la arquitectura actual, como el componente `ShelfForm` siempre está montado (solo oculto con CSS/Portal), si el usuario escribe algo, cierra el modal y lo vuelve a abrir, **los datos persisten** (a menos que se limpien explícitamente).
*   **Cambio:** Con la propuesta, al cerrar el modal, el componente se **desmonta**. El estado local de React se pierde.
*   **Pregunta:** ¿Es aceptable este comportamiento? ¿Deberíamos confiar puramente en Redux para persistir datos de formularios temporales o es preferible el comportamiento actual para "minimizar" modales sin perder progreso?

### B. Modales Apilados (Stacking)
*   **Problema:** La propuesta asume `activeModal` como un string único.
*   **Escenario:** ¿Qué pasa si estoy en `ShelfForm` y necesito abrir un `ConfirmationDialog` encima?
*   **Pregunta:** ¿Debería el estado ser un array `activeModals: []` para permitir stacking? ¿Aumenta esto demasiado la complejidad vs el beneficio?

### C. Refactorización Masiva
*   **Problema:** Migrar ~30 modales requiere estandarizar sus props (`onClose`, `isOpen`) y mover su lógica de conexión a Redux.
*   **Pregunta:** ¿Existe un paso intermedio menos agresivo? (Ej: Mantener `ModalManager` pero usar renderizado condicional estricto `{isOpen && <Component />}`).

### D. Animaciones de Salida (`AnimatePresence`)
*   **Problema:** `Framer Motion` necesita que el componente esté montado para animar su salida (`exit`). Si desmontamos el componente inmediatamente al cambiar el estado a `null`, la animación de cierre se cortará bruscamente.
*   **Pregunta:** ¿Cómo manejar `AnimatePresence` con un sistema de Registro dinámico?
