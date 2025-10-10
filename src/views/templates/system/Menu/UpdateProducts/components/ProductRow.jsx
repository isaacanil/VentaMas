import React from 'react';

import { TableRow, TableCell } from '../code/styledComponents';

const ProductRow = ({ product, original, index, style }) => {
    // Determinar si hay diferencia de precio para mostrar
    const originalListPrice = original ? original.pricing.listPrice : null;
    const updatedListPrice = product.pricing.listPrice;
    const showDifference = original && originalListPrice !== updatedListPrice;

    // Calcular precios con impuestos en tiempo real
    const taxFactor = 1 + product.pricing.tax / 100;
    const listPriceWithTax = product.pricing.listPrice * taxFactor;
    const minPriceWithTax = product.pricing.minPrice * taxFactor;
    const avgPriceWithTax = product.pricing.avgPrice * taxFactor;

    return (
        <TableRow style={style} isEven={index % 2 === 0}>
            <TableCell flex="0 0 30px" align="center">{index + 1}</TableCell>
            <TableCell flex="1 0 200px">{product.name}</TableCell>
            <TableCell flex="0 0 60px" align="center">{product.stock}</TableCell>
            <TableCell flex="0 0 100px">{product.barcode}</TableCell>
            <TableCell flex="0 0 80px" align="right">
                ${product.pricing.cost.toFixed(2)}
            </TableCell>
            <TableCell flex="0 0 100px" align="right">
                ${product.pricing.listPrice.toFixed(2)}
            </TableCell>
            <TableCell flex="0 0 80px" align="right">
                ${product.pricing.minPrice.toFixed(2)}
            </TableCell>
            <TableCell flex="0 0 80px" align="right">
                ${product.pricing.avgPrice.toFixed(2)}
            </TableCell>
            {showDifference && (
                <TableCell flex="0 0 100px" align="right" highlight>
                    ${updatedListPrice.toFixed(2)}
                </TableCell>
            )}
            {/* Prices with tax */}
            <TableCell flex="0 0 100px" align="right">
                ${listPriceWithTax.toFixed(2)}
            </TableCell>
            <TableCell flex="0 0 100px" align="right">
                ${minPriceWithTax.toFixed(2)}
            </TableCell>
            <TableCell flex="0 0 100px" align="right">
                ${avgPriceWithTax.toFixed(2)}
            </TableCell>
            <TableCell flex="0 0 60px" align="center">
                {product.pricing.tax}%
            </TableCell>
        </TableRow>
    );
};

export default ProductRow;