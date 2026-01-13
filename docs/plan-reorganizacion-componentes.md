# Plan largo de reorganización de componentes (toda la noche)

Objetivo: centralizar componentes compartidos, mover componentes de dominio a módulos,
consolidar en `src/modules/*` y `src/components/*` y dejar una estructura moderna y consistente.

## Principios
- **Shared real** → `src/components` (UI común, layout, modals genéricos).
- **Design system** → `src/components/ui` (system UI centralizado).
- **Feature-first** → `src/modules/<feature>` con `components/`, `hooks/`, `utils/`, `types/`, `pages/`.
- **Rutas** → `src/router` se queda como capa de orquestación.
- **Sin barrels innecesarios** → imports directos.

## Fase 0 — Preparación
1. Confirmar estructura objetivo (ya definida arriba).
2. Asegurar alias `@/` para nuevos paths (ok en `tsconfig.json`).
3. Regla: mover por **bloques pequeños** y actualizar imports al final de cada bloque.

## Fase 1 — Bloques con mínima dependencia
1. Templates antiguos con 0–1 import externo:
   - Account → `components/common/Account` (hecho).
   - ErrorMassage → `components/common/ErrorMassage` (hecho).
   - Modal → `components/common/Modal` (hecho).
2. Componentes antiguos con 0–1 import externo:
   - DetailSummary → `modules/accountsReceivable/components/DetailSummary` (hecho).
   - FileUploader → `components/common/FileUploader` (hecho).
   - ImageGallery → `modules/welcome/components/ImageGallery` (hecho).
   - NoteViewButton → `components/common/NoteViewButton` (hecho).
   - ShowFileButton → `components/common/ShowFileButton` (hecho).
   - ProductFilter → `modules/inventory/components/ProductFilter` (hecho).

## Fase 2 — Bloques de baja/mediana dependencia
1. **2 imports**:
   - Carrusel, CategorySelector, contact, PillButton, ProductCategoryBar, ResizebleSidebar.
   - Decidir: shared → `components/common`, o por módulo (ej. `modules/contact`).
2. **4 imports**:
   - Badge, Loader, Rnc.
   - Loader probablemente a `components/common/Loader`.
   - Rnc quizá a `modules/rnc` o `modules/clients` según uso.
3. **5–6 imports**:
   - GeneralConfig, tree.
   - `tree` puede ir a `components/common/Tree` si se usa en varios módulos.

## Fase 3 — Modals (bloque grande)
1. Consolidar modals compartidos en `components/modals`.
2. Modals específicos a `modules/<feature>/components/modals`.
3. Actualizar `ModalManager` y referencias desde `router`/`pages`.
4. Evitar nuevos barrels.

## Fase 4 — Templates y Menú
1. `MenuApp` → `modules/navigation`.
2. `NotificationCenter` → `modules/notification`.
3. Actualizar imports en `router/routes` y toolbars.

## Fase 5 — Design System
1. System UI → `components/ui/*`.
2. Ajustar imports en todo el proyecto (tabla avanzada, botones, inputs, fechas).
3. Verificar uso de `components/common` vs `components/ui` para no duplicar.

## Fase 6 — Páginas (modules/*/pages)
1. Mover páginas por dominio a `modules/<feature>/pages`.
2. Actualizar rutas dinámicas (`router/routes/paths/*`).
3. Dejar la carpeta legacy vacía y eliminarla.

## Fase 7 — Limpieza final
1. Eliminar carpetas legacy si ya no hay referencias.
2. Revisar `rg "views/"` → debe quedar 0.
3. Ajustar documentación interna si existe.

## Checklist técnico por bloque
- [ ] Mover carpeta/archivo
- [ ] Actualizar imports (rg + replace)
- [ ] Validar que no queden referencias legacy (rg "views/").
- [ ] Ejecutar `npm run typecheck` al final de cada fase grande
- [ ] Ejecutar `npm run lint` al final de la noche

## Orden sugerido restante (de menor a mayor dependencia)
1. Carrusel, CategorySelector, contact, PillButton, ProductCategoryBar, ResizebleSidebar
2. Badge, Loader, Rnc
3. GeneralConfig, tree
4. Modals (por dominio)
5. MenuApp + NotificationCenter
6. System UI
7. Páginas y rutas

## Resultado esperado
- Estructura clara por dominios.
- Componentes compartidos centralizados.
- Carpeta legacy eliminada.
- Imports más consistentes y fáciles de mantener.
