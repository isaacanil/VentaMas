# Combos de productos

Un combo es un producto vendible con `itemType: 'combo'` y una receta en
`combo.components`. La venta muestra una sola linea comercial para el cliente,
pero el inventario se descuenta desde los productos componentes guardados en el
catalogo del negocio.

## Modelo

```ts
combo: {
  enabled: true,
  inventoryPolicy: 'components',
  components: [
    {
      id?: string,
      productId: string,
      productName?: string,
      sku?: string | number | null,
      quantity: number,
      unitName?: string | null,
    },
  ],
}
```

`quantity` es la cantidad base del componente requerida por una unidad del combo.
La UI solo permite seleccionar productos activos, visibles y que no sean
servicios ni otros combos.

## Contrato minimo del editor

Cuando `itemType` es `combo`, el editor muestra solo los campos necesarios para
vender y costear el combo: nombre, tipo de item, categoria, disponibilidad,
receta, moneda, precio de venta e ITBIS. La receta permite agregar componentes
con producto y cantidad; el stock, costo unitario y costo estimado se muestran
como referencias calculadas desde los productos seleccionados.

El combo no muestra campos de stock propio, lotes, paquetes, peso, unidades de
venta, imagen ni calculadora de precio. Su `stock` queda en `0` porque la
disponibilidad y el descuento de inventario son component-driven: al vender se
expande la receta y se valida/descuenta el stock de cada producto componente.

## Comportamiento

- Al crear un combo por componentes, `createProduct` normaliza la receta, guarda
  `stock: 0` en el combo y no crea lote, `productsStock` ni movimiento inicial.
- Al facturar, `createInvoiceV2` congela una copia de la receta validada en el
  outbox de inventario. `collectInventoryPrereqs` prefiere ese snapshot y usa el
  catalogo solo como respaldo si la linea no trae receta.
- Los movimientos, backorders y lineas de costo conservan `comboComponent` para
  auditar desde que combo salio cada descuento.
- Si el combo no tiene receta guardada en el catalogo, solo se descuenta por
  componentes cuando la linea del carrito trae una receta valida.

## Despliegue

Si solo se despliegan las funciones afectadas por esta funcionalidad:

```powershell
npm run deploy -- staging:functions createProduct,createInvoiceV2,processInvoiceOutbox
firebase deploy --only "functions:createProduct,functions:createInvoiceV2,functions:processInvoiceOutbox"
```
