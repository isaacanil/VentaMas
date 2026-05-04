# VentaMas DESIGN.md

Estado: `ACTIVE`

Actualizado: `2026-05-04`

## Proposito

Este archivo es el contrato visual para agentes y colaboradores que generen o modifiquen UI en VentaMas.

Usar `DESIGN.md` para mantener consistencia visual, densidad operativa, accesibilidad y uso correcto del design system. No usarlo como documento de arquitectura tecnica, fiscal, contable o de dominio.

## Fuente de verdad

El design system vivo esta en codigo:

- `src/design-system/index.ts`: API publica.
- `src/design-system/tokens/*`: tokens base y semanticos.
- `src/design-system/ant-theme.ts`: tema global de Ant Design.
- `src/design-system/css/inject.ts`: inyeccion de variables CSS `--ds-*`.
- `src/design-system/registry/components.ts`: componentes permitidos para planes/generacion.
- `src/design-system/recipes/screen-recipes.ts`: recetas de pantallas.
- `src/design-system/context/context-pack.ts`: paquete de contexto para agentes.
- `src/ant/AntConfigProvider.tsx`: integracion global de Ant.

`DESIGN.md` resume como usar esas fuentes. Si hay conflicto, manda el codigo del design system.

## Identidad de producto

VentaMas es ERP/POS/backoffice operacional. La UI debe ser densa, clara, repetible y rapida de escanear.

Prioridades visuales:

1. Informacion accionable antes que decoracion.
2. Jerarquia compacta antes que heroes o composiciones de marketing.
3. Estados excepcionales visibles; estados normales silenciosos.
4. Tablas, filtros, formularios y modales optimizados para trabajo diario.
5. Accesibilidad y contraste como condicion base, no ajuste posterior.

Evitar:

- Layouts tipo landing page en pantallas internas.
- Gradientes decorativos, orbes, fondos ilustrativos o tarjetas flotantes sin necesidad.
- Cards anidadas.
- Estados repetidos en header, badge, metadata y cuerpo al mismo tiempo.
- Texto explicativo sobre como usar una pantalla cuando la UI puede hacerlo evidente.

## Stack visual

- React 19.
- Ant Design como base de controles accesibles.
- `styled-components` para composicion y estilos locales.
- Variables CSS `--ds-*` para tokens.
- Font Awesome como libreria de iconos para nuevos contratos de UI.

Regla: usar Ant para comportamiento base, tokens para apariencia, `styled-components` para layout local.

## Tokens

Consumir tokens semanticos, no valores crudos.

Correcto:

```tsx
const Panel = styled.section`
  background: var(--ds-color-bg-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  padding: var(--ds-space-5);
  box-shadow: var(--ds-shadow-sm);
`;
```

Incorrecto:

```tsx
const Panel = styled.section`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
`;
```

### Familias permitidas

- Color semantico: `--ds-color-*`.
- Espaciado: `--ds-space-*`.
- Tipografia: `--ds-font-family-*`, `--ds-font-size-*`, `--ds-font-weight-*`, `--ds-line-height-*`, `--ds-letter-spacing-*`.
- Radio: `--ds-radius-*`.
- Sombra: `--ds-shadow-*`.
- Z-index: `--ds-z-*`.
- Scrollbar: `--ds-scrollbar-*`.

### Color

Usar `semantic.color` para UI real:

- Fondos: `bg.page`, `bg.surface`, `bg.subtle`, `bg.muted`, `bg.elevated`, `bg.tableRowAlt`.
- Texto: `text.primary`, `text.secondary`, `text.muted`, `text.disabled`, `text.inverse`, `text.link`.
- Accion: `action.primary`, `action.primaryHover`, `action.primaryActive`, `action.primarySubtle`, `action.onPrimary`, `action.onPrimarySubtle`.
- Estados: `state.success`, `state.danger`, `state.warning`, `state.info` y variantes `Subtle`, `Text`, `on*`.
- Bordes: `border.default`, `border.subtle`, `border.strong`, `border.focus`.
- Navegacion: `nav.bg`, `nav.text`, `nav.hover`.

No importar `tokens/colors.ts` desde componentes de negocio. Esa paleta es infraestructura.

### Tipografia

Fuente base: `Inter`, con fallback del sistema.

Usar escala semantica:

- `pageTitle`: titulo de pagina o modulo.
- `sectionTitle`: seccion de formulario o panel.
- `heading`: etiqueta destacada o columna prominente.
- `body`: texto principal.
- `bodySmall`: texto secundario y helper text.
- `label`: labels de formularios densos.
- `tableHeader`: encabezados de tabla.
- `caption`: metadata, fechas, pie.

No escalar texto con viewport. Mantener `letter-spacing: 0` salvo token existente.

### Espaciado y forma

Escala base: `4px`.

Usar `--ds-space-1` a `--ds-space-16`. No inventar gaps ad hoc.

Radios:

- Controles compactos: `--ds-radius-sm` o `--ds-radius-md`.
- Cards/paneles: maximo normal `--ds-radius-lg`.
- Modales/drawers/cards grandes: `--ds-radius-3xl` solo si la superficie lo justifica.
- Pills/badges: `--ds-radius-pill`.

Regla VentaMas: cards a `8px` o menos por defecto.

## Ant Design

Usar `antTheme` global antes que overrides locales.

Tema actual:

- `colorPrimary`: `semantic.color.action.primary`.
- Fondos: `bg.surface`, `bg.elevated`, `bg.page`.
- Texto: `text.primary`, `text.secondary`, `text.disabled`.
- Bordes: `border.default`, `border.subtle`.
- Radio base: `radius.md`.
- Densidad ERP: `controlHeight = 28`.

No crear overrides globales dispersos. Si el patron debe afectar todo Ant, cambiar `src/design-system/ant-theme.ts`.

## Componentes

Preferir componentes registrados:

- `antd.button`
- `antd.input`
- `antd.select`
- `antd.switch`
- `antd.table`
- `vm.pageLayout`
- `vm.pageBody`
- `vm.menuApp`
- `vm.filterBar`
- `vm.advancedTable`
- `vm.modal`
- `vm.modalShell`
- `vm.statusBadge`
- `vm.datePicker`

Si hace falta un componente nuevo:

1. Revisar si Ant ya cubre comportamiento.
2. Revisar si existe wrapper VentaMas.
3. Crear subcomponente local si solo sirve a un caso.
4. Promover a design system solo si sera reusable.

## Patrones de pantalla

### List management

Para listas operativas con resultados:

- Raiz con `PageLayout`.
- Header y toolbar con `MenuApp`.
- Filtros en una sola `FilterBar`.
- Tabla con `AdvancedTable` o `Ant Table`.
- Acciones cortas en modal, no navegacion innecesaria.
- Mantener cadena de altura en tablas: `flex`, `min-height: 0`, overflow contenido.

### Settings form

Para configuracion:

- `PageBody` o `PageShell`.
- `MenuApp` para identidad de seccion.
- Campos agrupados por significado, no por tipo de control.
- Un boton primario de guardar por region/pagina.
- Estado `dirty`, `saving`, `error` visible sin ruido.

### Modal entity editor

Para ediciones cortas:

- `ModalShell` cuando footer es obligatorio.
- Accion primaria en footer.
- No anidar modales.
- Formularios compactos.

## Densidad operacional

VentaMas debe sentirse como herramienta de trabajo, no brochure.

Reglas:

- Toolbar compacta.
- Selectores de filtros con ancho normal, no estirados si no hace falta.
- Tablas densas con encabezados legibles.
- Metadata secundaria debajo o al lado del dato principal, sin competir.
- Fechas en vistas contables: preferir `DD/MM/YYYY`; si hay hora, separarla visualmente.
- Alertas agrupadas por documento o problema real cuando reduce ruido.

## Estados

Estados normales:

- Activo.
- Vigente.
- Pagado cuando no altera accion principal.
- Configuracion correcta.

Tratarlos como silenciosos.

Estados excepcionales:

- Inactivo.
- Bloqueado.
- Vencido.
- Error de validacion.
- Pendiente de mapeo.
- Descuadre.
- Riesgo fiscal/contable.

Mostrarlos con label claro, icono si ayuda y color semantico. No usar color como unico canal.

## Accesibilidad

Toda combinacion reusable de foreground/background debe cumplir WCAG AA para contenido normal y senales esenciales.

Reglas:

- Texto muted debe seguir legible en tablas, listas, settings y paneles.
- Disabled puede ser tenue, no ilegible.
- Badges y pills deben preservar contraste en todos sus estados.
- Error, warning, success e info deben tener texto o icono ademas de color.
- Focus visible debe usar `--ds-color-border-focus` o token equivalente.
- No ocultar scrollbar salvo caso intencional y justificado.

## Iconos

Usar Font Awesome para nuevos contratos UI.

Reglas:

- Icono en botones de herramientas cuando existe simbolo familiar.
- Icono + texto para acciones ambiguas o destructivas.
- Tooltip para iconos no obvios.
- No introducir otra libreria general de iconos.
- No usar SVG inline custom si Font Awesome cubre el caso.

## Copy UI

Tono: claro, operativo, especifico.

Reglas:

- Botones con verbo concreto: `Guardar`, `Reversar`, `Exportar`, `Aplicar filtros`.
- Estados con sustantivo o frase corta: `Pendiente de mapeo`, `Vencido`, `Sin evidencia`.
- Evitar parrafos explicativos dentro de pantallas densas.
- Evitar repetir contexto que ya da la ruta, menu o titulo.
- En acciones riesgosas, copy normal y completo. No ser cripitico.

## Arquitectura y documentacion

No poner aqui:

- Modelo fiscal.
- Pipeline contable.
- Reglas de negocio.
- Diagramas de arquitectura backend.
- Decisiones de infraestructura.
- Roadmaps.

Usar:

- `plans/architecture/*` para arquitectura y planes grandes.
- `docs/<dominio>/explanation/*` para explicaciones por dominio.
- ADRs para decisiones tecnicas puntuales.
- `AGENTS.md` para reglas de trabajo de agentes.

## Checklist antes de cerrar UI

- Usa tokens `--ds-*`; no hex, px o z-index ad hoc.
- Respeta `antTheme`; no override global disperso.
- Usa componentes Ant/VentaMas existentes antes de crear wrappers.
- No hay cards anidadas ni decoracion sin funcion.
- Texto cabe en desktop y mobile.
- Estados criticos no dependen solo de color.
- Tablas y filtros mantienen densidad operativa.
- Modal usado para tarea corta; drawer solo si el flujo realmente lo exige.
- Screenshot/browser check hecho cuando el cambio visual es relevante.
