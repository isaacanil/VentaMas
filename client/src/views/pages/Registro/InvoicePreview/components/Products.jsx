import React from 'react'
import styled from 'styled-components';
import { useFormatPrice } from '../../../../../hooks/useFormatPrice';
import * as antd from "antd";
const { Table } = antd;

const Products = ({ products }) => {
    return (
        <div className="mt-4">
            <StyledTitle>Productos</StyledTitle>
            <ProductTable
                products={products}

            />
        </div>
    )
}

export default Products

const ProductsContainer = styled.div``;
const StyledTitle = styled.h2`
  font-weight: 600;
  margin: 0 0 1em;
  font-size: 1.2rem;
`;

const ProductTable = ({ products }) => {
    const columns = [
        {
            title: 'Descripción',
            dataIndex: 'name',
            key: 'name',
            render: text => text ?? 'Producto Desconocido',
        },
        {
            title: 'Cantidad',
            dataIndex: 'amountToBuy',
            key: 'amountToBuy',
            render: text => text ?? 'N/A',
        },
        {
            title: 'Precio Unitario',
            dataIndex: ['pricing', 'price'],
            key: 'unitPrice',
            render: price => useFormatPrice(price) ?? 'N/A',
        },
        {
            title: 'Total',
            dataIndex: ['pricing', 'price'],
            key: 'total',
            render: (_, record) => useFormatPrice(record.pricing.price * record.amountToBuy) ?? 'N/A',
        },
        // Agrega aquí más columnas si necesitas
    ];

    // Transformar datos de productos para cumplir con la estructura esperada por Ant Design Table
    const dataSource = products.map((product, index) => ({
        key: index, 
        ...product,
    }));

    console.log(dataSource);

    return <Table
        size='small'
        columns={columns}
        dataSource={dataSource} />;
};

