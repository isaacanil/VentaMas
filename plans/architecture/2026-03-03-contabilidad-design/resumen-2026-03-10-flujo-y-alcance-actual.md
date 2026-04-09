# Resumen simple del flujo y alcance actual

Estado del resumen: `CURRENT_STATE`

Fecha: `2026-03-10`

Este documento resume, en lenguaje simple, como se esta trabajando actualmente el tema de contabilidad, monedas y tasa de cambio en este proyecto.

Esta pensado para:

- personas del equipo que no programan
- programadores nuevos que aun no conocen el proyecto
- cualquier persona que necesite entender la direccion actual sin leer todos los documentos tecnicos

Documentos revisados para armar este resumen:

- `README.md`
- `contabilidad-backlog.md`
- `contabilidad-checklist.md`
- `etapa-2026-03-10-precio-documental-y-facturacion-nativa-por-moneda.md`
- `implementacion-2026-03-10-facturacion-usd-nativa.md`
- `migracion-2026-03-10-datos-esenciales-por-moneda.md`
- `2026-03-17-compras-cuentas-por-pagar-design.md`
- `audit/2026-03-09-repo-audit.md`

## 1. Que problema estamos resolviendo

Hoy el sistema maneja ventas, pagos, compras, gastos y caja. El problema es que muchos montos historicamente se han guardado como numeros simples, sin dejar siempre claro:

- en que moneda estaban
- que tasa se uso
- si el documento original estaba en `DOP` o `USD`
- si ese valor debe quedarse fijo para auditoria futura

Lo que estamos haciendo ahora no es construir toda la contabilidad final de golpe.

Lo que estamos haciendo es crear una base ordenada para que:

- cada documento nuevo sepa en que moneda fue creado
- la tasa usada quede guardada
- los historicos no cambien si manana cambia la tasa
- mas adelante se puedan crear eventos contables, reportes y conciliaciones sin inventar informacion

## 2. La idea principal en una frase

Primero congelamos bien la informacion monetaria de cada documento. Despues, sobre esa base, construiremos eventos contables, proyecciones y reportes.

## 3. Decision central del proyecto

La moneda base del negocio, por ahora, es `DOP`.

Eso significa:

- los documentos pueden llegar a existir en otra moneda, como `USD`
- pero internamente la referencia base del negocio sigue siendo `DOP`
- toda conversion relevante debe quedar guardada en el momento del documento
- si luego cambia la tasa, el documento historico no debe cambiar

Ejemplo simple:

- hoy emito una factura en `USD`
- hoy se usa una tasa de `59.25`
- manana la tasa sube a `60.10`
- la factura de ayer debe seguir recordando `59.25`, no recalcularse

## 4. Como lo estamos haciendo actualmente

La estrategia actual tiene 4 ideas base:

1. No romper lo que ya funciona hoy.
2. Agregar informacion monetaria nueva sin obligar a rehacer todo el sistema.
3. Empezar por los flujos mas confiables.
4. Dejar la contabilidad como una capa paralela al sistema operativo actual, no como un reemplazo inmediato.

Traducido a algo mas simple:

- ventas, compras, gastos y pagos siguen funcionando
- encima de eso, se les esta agregando un snapshot monetario
- ese snapshot guarda la foto monetaria real del momento
- mas adelante esa foto sera la base para contabilidad y auditoria

## 5. Que significa "snapshot monetario"

"Snapshot monetario" significa guardar una foto fija de la parte monetaria de un documento.

Esa foto busca responder:

- en que moneda estaba el documento
- cual era la moneda base del negocio
- que tasa se uso
- cuanto era el total en la moneda del documento
- cuanto era el equivalente en `DOP`
- si hubo una tasa manual diferente a la sugerida

La idea es que el documento no dependa de calculos futuros para saber cuanto valia en el momento en que fue creado.

## 6. Que ya esta hecho hoy

Segun los documentos revisados, ya existe un piloto activo para este trabajo.

Business piloto:

- `X63aIFwHzk3r0gmT8w6P`

Lo que ya esta listo o al menos implementado para ese piloto:

- existe configuracion inicial por negocio para monedas y tasa de cambio
- la moneda funcional/base esta fija en `DOP`
- las facturas nuevas guardan snapshot monetario
- los pagos de cuentas por cobrar guardan snapshot monetario
- las compras guardan snapshot monetario
- los gastos guardan snapshot monetario
- existe una vista interna de auditoria para revisar esas capturas monetarias
- existe una pantalla de configuracion de monedas/tasa visible para el piloto

En resumen:

Ya comenzamos a guardar mejor la informacion monetaria en los documentos nuevos.

## 7. Que aun no esta completado

Aunque ya hay avances reales, todavia faltan piezas importantes:

- una coleccion formal e inmutable de tasas de cambio
- cuentas bancarias formales dentro del sistema
- eventos contables backend para ventas y pagos
- reglas de cierre o bloqueo de periodos
- manejo mas formal de errores, reintentos y reprocesos
- cierre completo del flujo de facturacion real en `USD`
- resolver bien cuando una compra esta pagada, parcialmente pagada o pendiente al proveedor

Esto ultimo es importante porque una compra no siempre significa que el proveedor ya cobro.

## 8. Por que no se esta haciendo todo de una vez

Porque no todos los flujos del sistema tienen hoy el mismo nivel de solidez tecnica.

Hay partes que ya tienen un flujo backend mas confiable y otras que todavia dependen mucho del frontend.

Por eso la decision actual es:

- empezar primero por donde el sistema es mas confiable
- no prometer "contabilidad fuerte" en areas donde el dato todavia es fragil

## 9. Que area va primero y por que

### Ventas

Ventas es el mejor punto de partida.

Razon:

- ya existe un flujo mas ordenado
- el backend participa mas
- hay mejor control del proceso
- es el lugar mas natural para luego emitir un evento contable serio

La idea es que ventas sea el primer flujo fuerte para contabilidad.

### Pagos de cuentas por cobrar

Tambien van temprano en el roadmap.

Razon:

- ya se les esta agregando snapshot monetario
- se relacionan directamente con el estado de cuenta del cliente

### Compras y gastos

Van mas atras para eventos contables fuertes.

Razon:

- hoy siguen dependiendo demasiado de acciones desde frontend
- todavia hay huecos funcionales importantes
- en compras aun no esta bien cerrado el tema de pago al proveedor
- en gastos el dominio bancario aun esta incompleto

La lectura correcta hoy es esta:

- compras y gastos ya pueden guardar mejor su foto monetaria
- pero todavia no son una base suficientemente fuerte para journal contable serio

## 10. Diferencia entre caja y banco

Una aclaracion muy importante del proyecto es esta:

- caja no es lo mismo que banco

Hoy la caja sirve principalmente para:

- apertura
- cierre
- cuadre operativo
- auditoria del movimiento del dia

Pero eso no significa que ya tengamos un modulo bancario formal.

Por eso el proyecto separa estas ideas:

- caja
- banco
- tarjeta
- transferencia
- cuentas puente

La conclusion actual es:

- no debemos usar caja como si fuera banco
- primero hay que crear cuentas bancarias estructuradas

## 11. Como se esta tratando USD

Este punto es clave porque suele generar confusion.

Hoy `USD` no esta liberado como facturacion operativa general.

La regla actual es:

- no se puede tomar una venta calculada realmente en `DOP` y al final solo marcarla como `USD`

Eso seria "maquillar" el documento, no emitirlo correctamente.

Si una factura va a ser `USD`, entonces todo debe ser realmente `USD`:

- precio del producto
- subtotal
- impuestos
- total
- pagos
- PDF

En otras palabras:

- no basta con cambiar una etiqueta visual
- el carrito completo debe trabajar en `USD` real

Ademas:

- `USD` solo debe habilitarse para productos que de verdad tengan precio base en `USD`
- si un producto no tiene precio real en `USD`, no debe entrar a una factura `USD`

## 12. Que falta para facturacion real en USD

Antes de abrir `USD` de manera operativa, hace falta cerrar una etapa previa.

Esa etapa consiste en definir bien:

- de donde sale el precio documental del producto
- como el carrito trabaja realmente en `DOP` o `USD`
- como se mantiene coherencia entre pantalla, factura y PDF

La idea es evitar este error:

- vender algo calculado en `DOP`
- y luego presentarlo como si siempre hubiera sido `USD`

## 13. El orden del roadmap actual

El orden actual del trabajo es este:

1. Fundacion monetaria.
2. Snapshots monetarios por documento.
3. Eventos contables.
4. Proyecciones.
5. Catalogo de cuentas y journal.
6. Conciliacion y reportes.

Explicado simple:

- primero se guarda bien el hecho
- luego se emite el evento
- luego se construyen vistas y balances derivados
- al final se formaliza el journal y los reportes completos

## 14. Que si esta dentro del alcance actual

Lo que si forma parte del trabajo actual:

- guardar mejor la informacion monetaria de documentos nuevos
- soportar piloto controlado por negocio
- mantener compatibilidad con el sistema actual
- preparar el camino para eventos contables futuros
- empezar por ventas y pagos CxC
- preparar `USD -> DOP` con tasa historica congelada

## 15. Que no esta dentro del alcance actual

Lo que no se esta prometiendo ahora mismo:

- reemplazar todo el sistema operativo actual
- tener ya un modulo contable final completo
- usar contabilidad como fuente primaria de todo el negocio desde este momento
- liberar `USD` sin cerrar antes el flujo real del carrito y la factura
- tratar compras y gastos como contabilidad fuerte mientras sigan siendo flujos fragiles
- mezclar caja con banco

## 16. Riesgos o temas sensibles todavia abiertos

Los temas mas delicados que aun siguen abiertos son:

- crear tasas de cambio formales e inmutables
- crear cuentas bancarias reales en el sistema
- definir eventos contables con buen control de duplicados y reversos
- definir bloqueo de periodos
- cerrar el estado de pago de compras
- cerrar todo el flujo real de facturacion `USD`

## 17. Resumen final para cualquier persona del equipo

Hoy lo estamos haciendo asi:

- no estamos construyendo toda la contabilidad de golpe
- primero estamos mejorando la calidad monetaria de los documentos nuevos
- estamos guardando moneda, tasa y equivalencia historica
- el documento debe conservar esa foto para siempre
- ventas y pagos CxC son el primer frente fuerte
- compras y gastos ya mejoran su foto monetaria, pero aun no son la base final para contabilidad fuerte
- `USD` todavia no se libera ampliamente hasta que el carrito y la factura sean coherentes de verdad en `USD`
- todo esto se esta montando como una capa nueva y ordenada, sin romper de una vez lo que ya usa el negocio

## 18. Glosario corto

`DOP`

- peso dominicano

`USD`

- dolar estadounidense

`Snapshot monetario`

- foto fija de moneda, tasa y totales al momento de crear el documento

`Moneda funcional`

- moneda base con la que el negocio lleva la referencia principal

`Evento contable`

- hecho backend auditable que luego sirve para generar proyecciones o journal

`Proyeccion`

- vista derivada para consultar saldos, estados de cuenta o balances

`Journal`

- registro contable formal de debitos y creditos
