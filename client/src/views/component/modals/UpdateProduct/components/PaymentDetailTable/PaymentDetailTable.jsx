import * as ant from 'antd'
import React from 'react'
const columns = [
    {
        title: 'Descripción Precio',
        dataIndex: 'description',
        key: 'description',
    },
    {
        title: 'Monto',
        dataIndex: 'amount',
        key: 'amount',
    },
    {
        title: 'Itbis',
        dataIndex: 'itbis',
        key: 'itbis',
    },
    {
        title: 'Precio venta Final (Precio + itbis)',
        dataIndex: 'finalPrice',
        key: 'finalPrice',
    },
    {
        title: 'Mrgen de Beneficios',
        dataIndex: 'margin',
        key: 'margin',
    },
    {
        title: '% Beneficios',
        dataIndex: 'percentBenefits',
        key: 'percentBenefits',
    },
];

const data = [
    {
        key: '1',
        description: 'Precio Lista',
        amount: '6.2',
        itbis: '1.116',
        finalPrice: '7.316',
        margin: '0.7',
        percentBenefits: '13%',
    },
    {
        key: '2',
        description: 'Precio Medio',
        amount: '6.1',
        itbis: '1.098',
        finalPrice: '7.198',
        margin: '0.6',
        percentBenefits: '11%',
    },
    {
        key: '3',
        description: 'Precio Mínimo',
        amount: '5.9',
        itbis: '1.062',
        finalPrice: '6.962',
        margin: '0.4',
        percentBenefits: '7%',
    },
];
export const PaymentDetailTable = () => {
    return (
        <div>

            <ant.Table dataSource={data} columns={columns} />
        </div>
    )
}
