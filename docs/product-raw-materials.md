# Materia prima de productos

Materia prima debe modelarse como inventario fisico interno, no como un cuarto
tipo vendible junto a `product`, `service` y `combo`. La razon es que servicio y
combo ya expresan contratos comerciales, mientras que materia prima expresa uso
operativo: existe en almacen, se compra, puede tener lote y stock, pero no debe
aparecer en catalogos, POS ni facturas al cliente final.

## Contrato propuesto

```ts
{
  itemType: 'product',
  inventoryRole: 'raw_material',
  isSellable: false,
  isVisible: false,
  trackInventory: true,
  restrictSaleWithoutStock: true
}
```

Con este contrato, materia prima reutiliza `productsStock`, lotes, unidades base
y movimientos de inventario. No necesita precio de venta, garantia, codigos de
venta, presentaciones comerciales ni visibilidad en catalogos. Si se compra en
cajas o paquetes, esas conversiones deberian vivir como unidades de compra o
conversiones internas, no como presentaciones de venta al cliente.

## Integracion con lo existente

- `service`: no inventariable; nunca consume lotes, stock ni unidades de venta.
- `product`: inventariable y vendible; puede usar lotes, venta por peso y
  presentaciones de venta.
- `combo`: vendible por receta; no guarda stock propio si su politica es
  `components`; descuenta componentes fisicos.
- `raw_material`: inventariable y no vendible; se descuenta por recetas internas
  o procesos futuros de produccion/preparacion.

## Siguiente fase recomendada

La primera implementacion deberia limitarse a filtros y contratos, no a un
modulo de manufactura completo:

1. Agregar `inventoryRole` e `isSellable` al contrato de producto.
2. Ocultar `raw_material` en POS, catalogos y selectores de venta.
3. Mostrar `raw_material` en inventario, compras, lotes y ajustes.
4. Permitir que una receta interna consuma materias primas igual que hoy el
   combo consume componentes.
5. Registrar movimientos con una referencia a la receta/proceso que hizo el
   descuento.

Esto evita mezclar categoria comercial con comportamiento operativo. Una
categoria como farmacia, ropa o supermercado puede seguir siendo clasificacion
de negocio; materia prima debe ser un rol de inventario.
