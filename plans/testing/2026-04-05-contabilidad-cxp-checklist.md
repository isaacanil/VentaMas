# Revision guiada de Contabilidad y CXP

Fecha: 2026-04-05

## Objetivo

Definir una revision manejable y ejecutable de `contabilidad`, `cuentas por pagar` y modulos relacionados para detectar errores funcionales, problemas de UX, comportamientos inusuales y oportunidades de ajuste usando navegador virtual, consola, capturas y correcciones puntuales en codigo.

## Complejidad esencial vs accidental

- Complejidad esencial:
  - Contabilidad depende de configuracion previa, datos contables, periodos, catalogo y perfiles contables.
  - CXP depende de compras, suplidores, pagos y trazabilidad.
  - Gastos, ventas y cuadre de caja impactan el circuito contable y no conviene revisarlos como modulos aislados.
- Complejidad accidental a evitar:
  - Intentar probar todas las operaciones diarias en una sola corrida.
  - Mezclar configuracion, consultas, flujo diario y conciliacion dentro del mismo prompt.
  - Corregir visualmente sin aislar primero si el problema es de datos, permisos, navegacion o estado.

## Alcance real detectado en el repo

- Contabilidad:
  - Rutas: `/contabilidad`, `/contabilidad/libro-diario`, `/contabilidad/libro-mayor`, `/contabilidad/asientos-manuales`, `/contabilidad/reportes`, `/contabilidad/cierre-periodo`
  - Workspace: libro diario, libro mayor, asientos manuales, reportes financieros, cierre de periodo
  - Dependencias: `accountingEvents`, `journalEntries`, `accountingPeriodClosures`, catalogo de cuentas, perfiles contables y configuracion contable
- Cuentas por pagar:
  - Ruta: `/accounts-payable/list`
  - Vista con resumen, filtros, agrupacion, drawer de detalle, registro de pago y modal de historial
  - Dependencia principal: compras y pagos a suplidores
- Ajustes contables:
  - Settings > Accounting
  - Areas visibles en codigo: configuracion general, tasas de cambio, cuentas bancarias, catalogo de cuentas, perfiles contables, historial/auditoria
- Modulos relacionados para cobertura funcional:
  - Gastos: listado y formulario con pago en caja o banco, adjuntos y categorias
  - Compras/pedidos: pedidos, conversion a compra, compras, completar compra, analytics, backorders
  - Ventas/facturas: ventas POS, facturas, analytics y preventas
  - Cuadre de caja: listado, apertura, cierre y vista de facturas del cuadre

## Estrategia recomendada

Separar la revision en 2 fases grandes:

1. Fase A, sin operaciones diarias:
   - validar acceso, navegacion, configuracion, listados, filtros, estados vacios, mensajes, drawers, modales, exportes y consistencia visual
   - objetivo: estabilizar estructura y UX antes de meter datos nuevos
2. Fase B, con operaciones diarias:
   - crear o completar operaciones reales de negocio que alimentan contabilidad
   - objetivo: validar integracion punta a punta entre compras, gastos, ventas, caja y reflejo contable

## Orden de ejecucion

1. Ajustes contables
2. Contabilidad workspace
3. CXP
4. Gastos
5. Ventas y facturas
6. Cuadre de caja
7. Compras y conversion pedido -> compra
8. Integracion punta a punta

## Medicion de complejidad por bloque

- Baja:
  - accesos, navegacion, breadcrumbs, layout, estados vacios, filtros simples, drawers, modales, textos, loading, errores visibles
- Media:
  - catalogo de cuentas, perfiles contables, cuentas bancarias, reportes, agrupaciones, historial de pagos, relaciones entre pantallas
- Alta:
  - asientos manuales, reversos, cierres de periodo, pagos aplicados, apertura/cierre de caja, compras completadas, gastos con politica bancaria, reflejo contable de ventas

## Checklist maestro

### Fase A. Sin operaciones diarias

- Entrar a Settings > Accounting y validar:
  - carga inicial sin errores en consola
  - secciones visibles y navegables
  - estados vacios y mensajes de habilitacion
  - formularios, tablas y modales sin bloqueos
  - persistencia basica de filtros o seleccion si aplica
- Entrar a Contabilidad y validar:
  - redireccion correcta desde `/contabilidad`
  - cambio entre tabs del workspace
  - libro diario con carga, detalle y foco por query params
  - libro mayor y reportes sin errores ni pantallas rotas
  - asientos manuales: validaciones de balance, fecha y lineas
  - cierre de periodo: opciones, estados y protecciones
- Entrar a CXP y validar:
  - resumen por antiguedad
  - filtros, busqueda y agrupacion
  - drawer de detalle
  - apertura de compra asociada
  - modal de registrar pago e historial
- Entrar a Gastos y validar:
  - listado, filtros y tabla
  - apertura del formulario
  - categorias, adjuntos y metodos de pago
  - mensajes cuando falta cuenta bancaria configurada
- Entrar a Ventas/Facturas/Cuadre solo en modo lectura:
  - listados
  - analytics
  - detalle o vistas secundarias
  - ausencia de errores de render, calculos raros o enlaces rotos

### Fase B. Con operaciones diarias

- Compras:
  - crear pedido
  - convertir a compra o crear compra directa
  - completar compra
  - verificar impacto en CXP
- Gastos:
  - registrar gasto en efectivo
  - registrar gasto bancario
  - verificar validaciones y reflejo posterior
- Ventas:
  - ejecutar venta POS
  - revisar factura generada
  - validar impacto en cuadre y, si aplica, en contabilidad
- Caja:
  - apertura de caja
  - operaciones durante el turno
  - cierre de caja y conciliacion
  - revisar vista de facturas del cuadre
- Contabilidad:
  - validar si aparecen eventos automáticos
  - abrir asientos desde origen cuando exista navegacion cruzada
  - probar reverso solo si el caso es seguro y entendible
  - probar cierre de periodo al final, nunca al inicio

## Criterios de salida por bloque

- No hay errores de consola sin clasificar.
- No hay pantallas congeladas, loaders infinitos ni re-render inestable.
- No hay CTA sin efecto o con navegacion incorrecta.
- Cada hallazgo queda clasificado:
  - bug funcional
  - bug visual/UX
  - inconsistencia de datos
  - deuda de copy o validacion
  - decision pendiente de negocio
- Si se corrige algo:
  - reproducir
  - ajustar codigo
  - volver a probar el caso
  - documentar si queda riesgo residual

## Prompts operativos divididos

### Prompt 1. Mapeo y smoke test de ajustes contables

Objetivo: revisar solo `Settings > Accounting` hasta dejarlo estable antes de tocar operaciones.

```text
Investiga y prueba exclusivamente el alcance de Settings > Accounting en VentaMas. Enfócate solo en configuración contable y no ejecutes operaciones diarias. Usa navegador virtual, consola, capturas y revisión del código cuando haga falta.

Objetivos concretos:
1. Levanta la app y entra al módulo de ajustes contables.
2. Recorre todas las secciones visibles: configuración general, tasas de cambio, cuentas bancarias, catálogo de cuentas, perfiles contables e historial/auditoría si aparece.
3. Detecta errores de consola, pantallas vacías incorrectas, loaders infinitos, copy confuso, campos rotos, botones sin acción, tablas defectuosas, problemas de layout o flujos incompletos.
4. Corrige inmediatamente cualquier problema claro y vuelve a probarlo.
5. Mantente enfocado en este módulo hasta cerrarlo; no te disperses a contabilidad operativa ni compras.

Entrega al final:
- listado de hallazgos con severidad
- cambios aplicados
- pruebas ejecutadas
- riesgos pendientes
```

Complejidad: media

### Prompt 2. Workspace de contabilidad sin operaciones

Objetivo: revisar `libro diario`, `libro mayor`, `asientos manuales`, `reportes` y `cierre de periodo` sin depender todavía de flujo diario nuevo.

```text
Investiga y prueba exclusivamente el workspace de contabilidad de VentaMas. Trabaja solo dentro de /contabilidad y sus subrutas. No ejecutes todavía ventas, compras, gastos ni caja; en esta fase solo valida la pantalla, navegación, validaciones y consistencia del módulo.

Objetivos concretos:
1. Verifica la redirección inicial desde /contabilidad.
2. Recorre libro diario, libro mayor, asientos manuales, reportes y cierre de periodo.
3. Revisa estados de carga, estados vacíos, mensajes de habilitación, alertas de rollout, drawers, filtros, acciones y exportes.
4. En asientos manuales, prueba validaciones de líneas, balance débito/crédito y periodos cerrados sin comprometer datos si el caso no es seguro.
5. En cierre de periodo, revisa protecciones y mensajes; no cierres periodos reales si no es imprescindible.
6. Usa consola, capturas y lectura de código para encontrar la causa de cada fallo.
7. Corrige lo que sea claramente corregible y revalida el flujo.

Entrega al final:
- hallazgos priorizados
- pantallas y subflujos verificados
- correcciones hechas
- puntos que requieren datos reales o negocio para seguir
```

Complejidad: alta

### Prompt 3. CXP en modo lectura y trazabilidad

Objetivo: revisar `accounts payable` como tablero de seguimiento antes de meter pagos reales nuevos.

```text
Investiga y prueba exclusivamente el módulo de cuentas por pagar de VentaMas en /accounts-payable/list. En esta corrida no crees operaciones nuevas salvo que sea estrictamente necesario; prioriza lectura, filtros, agrupación y trazabilidad.

Objetivos concretos:
1. Validar carga de resumen, buckets de antigüedad, toolbar, filtros y búsqueda.
2. Probar agrupación, drawer de detalle, apertura de compra relacionada, modal de historial de pagos y modal de registrar pago sin completar acciones riesgosas si no hace falta.
3. Revisar si la información coincide visualmente con lo esperado para compras pendientes.
4. Detectar errores de cálculo, agrupación, totales, acciones deshabilitadas incorrectamente, navegación defectuosa o copy ambiguo.
5. Corregir inmediatamente problemas claros y repetir la prueba.
6. Mantener el foco solo en CXP hasta cerrarlo.

Entrega al final:
- hallazgos por severidad
- hipótesis de causa
- correcciones realizadas
- qué casos dependen de generar nuevas compras o pagos para validarse
```

Complejidad: media

### Prompt 4. Gastos y política de pago

Objetivo: revisar gastos primero como pantalla y luego como puente hacia contabilidad.

```text
Investiga y prueba exclusivamente el módulo de gastos de VentaMas. Empieza en modo seguro: listado, formulario, validaciones, categorías, adjuntos y métodos de pago. Si el flujo está estable, luego registra uno o dos casos controlados para validar comportamiento.

Objetivos concretos:
1. Revisar listado, filtros, navegación y apertura del formulario.
2. Probar validaciones del formulario, categorías y adjuntos.
3. Validar comportamiento cuando el método de pago es caja abierta y cuando es banco.
4. Confirmar mensajes de configuración faltante de cuentas bancarias.
5. Si el flujo es seguro, registrar casos mínimos controlados y verificar resultado.
6. Corregir problemas claros y revalidar.

Entrega al final:
- hallazgos
- validaciones cubiertas
- casos creados si aplica
- dependencia con settings/accounting o caja abierta
```

Complejidad: media-alta

### Prompt 5. Ventas, facturas y cuadre en lectura

Objetivo: revisar primero superficies y consistencia sin tocar todavía la operacion completa.

```text
Investiga y prueba solo la superficie de ventas, facturas y cuadre de caja en VentaMas sin ejecutar todavía una jornada completa. Prioriza navegación, listados, analytics, enlaces entre pantallas, estados de carga, cálculos visibles y errores de render.

Objetivos concretos:
1. Revisar /sales, /bills, analytics de ventas y /cash-reconciliation.
2. Entrar a subpantallas de apertura, cierre y overview de facturas si están accesibles.
3. Detectar errores de consola, layout, tablas, KPIs, links rotos, filtros defectuosos o incoherencias de datos visibles.
4. Corregir problemas claros y volver a probar.
5. No ejecutar todavía una venta completa ni un cierre real si no es necesario.

Entrega al final:
- hallazgos
- rutas revisadas
- ajustes hechos
- qué falta validar con operaciones reales
```

Complejidad: media

### Prompt 6. Flujo diario controlado compras -> CXP

Objetivo: validar la ruta operativa minima que alimenta CXP.

```text
Ejecuta una validación punta a punta controlada del flujo compras -> cuentas por pagar en VentaMas. Trabaja con el menor número posible de registros y documenta evidencia en cada paso.

Objetivos concretos:
1. Crear o ubicar un pedido de prueba.
2. Convertirlo a compra o crear una compra directa si conviene más.
3. Completar la compra con un caso controlado.
4. Verificar que aparezca correctamente en CXP.
5. Revisar detalle, antigüedad, historial y registro de pago.
6. Si hay errores o comportamientos inusuales, corrígelos y repite el tramo afectado.

Entrega al final:
- secuencia ejecutada
- evidencia de aparición en CXP
- bugs corregidos
- riesgos pendientes
```

Complejidad: alta

### Prompt 7. Flujo diario controlado ventas -> caja -> contabilidad

Objetivo: validar el circuito operativo mas sensible solo cuando las fases previas ya esten estables.

```text
Ejecuta una validación controlada del flujo ventas -> facturación -> cuadre de caja -> reflejo contable en VentaMas. Hazlo con un caso mínimo y seguro, sin abrir frentes innecesarios.

Objetivos concretos:
1. Abrir caja si el flujo lo requiere.
2. Ejecutar una venta mínima en POS.
3. Revisar la factura y los listados/analytics relacionados.
4. Revisar el impacto en cuadre de caja y overview de facturas.
5. Revisar si existe reflejo contable y si la navegación al asiento funciona.
6. Cerrar el tramo de prueba, corregir bugs claros y revalidar.

Entrega al final:
- resultado del flujo punta a punta
- desvíos detectados
- correcciones realizadas
- dudas de negocio o de datos que bloqueen seguir
```

Complejidad: alta

### Prompt 8. Consolidación final

Objetivo: cerrar cada ronda con criterio y no dejar la revision abierta indefinidamente.

```text
Consolida la revisión del bloque trabajado en VentaMas. No abras módulos nuevos. Resume únicamente:
1. qué se probó
2. qué falló
3. qué se corrigió
4. qué quedó pendiente
5. qué bloque sigue según complejidad y dependencias

Clasifica cada pendiente como:
- bloqueante
- importante
- menor
- decisión de negocio
```

Complejidad: baja

## Recomendacion final

La secuencia mas defendible para empezar es:

1. Prompt 1
2. Prompt 2
3. Prompt 3
4. Prompt 4
5. Prompt 5
6. Prompt 6
7. Prompt 7
8. Prompt 8 al cierre de cada bloque

Si aparece demasiada inestabilidad temprano, no avanzar a operaciones diarias hasta dejar estable Settings + Contabilidad + CXP en modo lectura.
