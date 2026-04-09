# Stock field cleanup

- Fecha propuesta: 2025-11-13
- Estado: Seguimiento operativo pendiente

- `useGetProducts` ya no debe inyectar `originalStock`, `displayStock`, `scopedStock` u otros campos derivados cuando construye la lista para ventas. El frontend sólo debe depender de `product.stock`.
- Verificar después del próximo release que la UI de ventas y cualquier reporte sigan mostrando el stock correcto tanto con filtros globales como por almacén.
- Si aparece nuevamente alguno de esos campos en los objetos entregados por `useGetProducts`, revisar la cadena de filtros y documentar el hallazgo antes de reintroducir campos derivados.
