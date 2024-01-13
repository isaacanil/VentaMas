import React, { useEffect, useState } from 'react'
import * as ant from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { ChangeProductData, changeProductPrice, selectUpdateProductData } from '../../../../../../features/updateProduct/updateProductSlice';
const { InputNumber, Table, Form } = ant;
const columns = [
    {
        title: 'Tipo',
        dataIndex: 'description',
        key: 'description',
    },
    {
        title: 'Monto',
        dataIndex: 'amount',
        key: 'amount',
        render: (text, record) => (
            <Form.Item
                name={record.name}
                rules={[
                    { required: true, message: 'Rellenar' },
                    { type: 'number', min: record?.cost || 0, message: `Minimo ${record?.cost}` },
                    // { type: 'number', min: 0, message: 'No puede ser menor al costo.' }
                    // { type: 'number', min: 0, message: 'No puede ser negativa.' }
                ]}

            >
                <InputNumber
                    defaultValue={text}
                    min={0}
                    step={0.1}

                />
            </Form.Item>

        ),
    },
    {
        title: 'Itbis',
        dataIndex: 'itbis',
        key: 'itbis',
    },
    {
        title: 'Total',
        dataIndex: 'finalPrice',
        key: 'finalPrice',
    },
    {
        title: 'Margen',
        dataIndex: 'margin',
        key: 'margin',
    },
    {
        title: '% Ganancia',
        dataIndex: 'percentBenefits',
        key: 'percentBenefits',
    }
    // Añade aquí más columnas como Itbis, Precio de venta Final, etc.
];


export const PriceCalculator = () => {
    const { product } = useSelector(selectUpdateProductData);
    const [tableData, setTableData] = useState([]);
    const dispatch = useDispatch();
    const calculateTableData = (productData) => {
        const prices = [
            {
                key: '1',
                cost: product.cost.unit,
                description: 'Precio Lista',
                name: 'listPrice',
                amount: productData.listPrice,
            },
            {
                key: '2',
                cost: product.cost.unit,
                description: 'Precio Medio',
                name: 'averagePrice',
                amount: productData.averagePrice,
            },
            {
                key: '3',
                cost: product.cost.unit,
                description: 'Precio Mínimo',
                name: 'minimumPrice',
                amount: productData.minimumPrice,
            }
        ];

        return prices.map(row => {
            // Asegúrate de que tienes números válidos y no indefinidos
            const amount = parseFloat(row.amount) || 0;
            const taxValue = parseFloat(productData?.tax?.value) || 0;
            const costUnit = parseFloat(productData?.cost?.unit) || 0;

            // Realiza los cálculos
            const itbis = amount * taxValue;
            const finalPrice = amount + itbis;
            const margin = finalPrice - costUnit - itbis;

            // Verifica si 'finalPrice' y 'margin' son números finitos y si 'finalPrice' no es cero
            const isCalculationValid = isFinite(margin) && isFinite(finalPrice) && finalPrice > 0;
            const percentBenefits = isCalculationValid ? (margin / finalPrice) * 100 : 0;

            // Redondea y formatea los resultados
            console.log(isCalculationValid, percentBenefits.toFixed(0))
            return {
                ...row,
                itbis: itbis.toFixed(2),
                finalPrice: finalPrice.toFixed(2),
                margin: margin.toFixed(1),
                percentBenefits: `${isCalculationValid ? percentBenefits.toFixed(0) : '0'}%`,
            };
        });
    };
    useEffect(() => {

        setTableData(calculateTableData(product));
        
    }, [product.cost.unit, product.tax.value, product.listPrice, product.averagePrice, product.minimumPrice]);
    useEffect(() => {
        const finalPrice = Number(tableData[0]?.finalPrice)||0;
        dispatch(changeProductPrice({ price:{ unit: finalPrice, total: finalPrice } } ))
    }, [tableData])

    console.log(tableData)
    return (
        <ant.Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            size='small'
        />
    )
}
