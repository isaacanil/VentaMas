# Idea: Inner Bottom Sheet en el modal de Pago de Factura

**Estado:** Idea / Backlog  
**Componente afectado:** `InvoicePanel` (`src/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/`)

---

## Contexto

El modal de "Pago de Factura" actualmente mezcla el flujo principal de pago (métodos, montos, resumen) con opciones de configuración menos frecuentes:

- Comentario de factura  
- Moneda del documento  
- Plantilla de factura  
- Imprimir Factura (toggle)  
- Cancelar venta (acción destructiva)

Estas opciones añaden scroll y ruido visual al flujo principal.

---

## La idea: Inner Bottom Sheet

Un panel secundario que se desliza desde abajo **dentro del propio modal**, sin abrir un modal externo ni salir del contexto. El trigger sería un botón pequeño en el footer o dentro del body (ej. "⚙ Ajustes" o un ícono de configuración).

```
┌─────────────────────────────┐
│  Pago de Factura         ✕  │
│─────────────────────────────│
│  [Montos / Métodos pago]    │
│  [Resumen]                  │
│─────────────────────────────│
│  [ Atrás ]  [ ⚙ ] [Facturar]│
└─────────────────────────────┘

→ Al presionar ⚙, el panel sube desde abajo (dentro del modal):

┌─────────────────────────────┐
│  Pago de Factura         ✕  │
│─────────────────────────────│
│  [Montos / Métodos pago]    │  ← queda semi-oculto debajo
├─────────────────────────────┤
│  ── ── ── (drag handle) ──  │
│  Comentario                 │
│  Moneda del documento       │
│  Plantilla de factura       │
│  Imprimir Factura   ●       │
│  ─────────────────────────  │
│  Cancelar venta             │
│─────────────────────────────│
│  [ Atrás ]  [ ⚙ ] [Facturar]│
└─────────────────────────────┘
```

---

## Implementación técnica sugerida

- `ScrollableBody` con `position: relative; overflow: hidden`
- Inner panel con `position: absolute; bottom: 0; left: 0; right: 0`
- Animación con `transform: translateY(100%)` → `translateY(0)` y `transition: transform 280ms ease`
- Fondo con backdrop semitransparente opcional (`rgba(0,0,0,0.15)`) para dar profundidad
- Click fuera del panel (en el backdrop) cierra el sheet
- Sin portales, sin z-index wars, todo en el mismo contexto del modal

---

## Beneficios

- **Foco:** el flujo de pago queda limpio y sin scroll
- **Contexto:** el usuario nunca "sale" del modal
- **Reversibilidad:** fácil cerrar y regresar con swipe o click fuera
- **Jerarquía clara:** configuración ≠ acción principal

---

## Notas de implementación

- El `PrintControl` ya fue simplificado en prep para esto (se quitó el switch de `Imprimir Factura` del body y se movió al footer dropdown temporalmente)
- `InvoiceComment` también sería candidato a mover aquí
- El componente inner sheet puede vivir en `InvoicePanel/components/SettingsSheet/`
