import React, { useEffect, useState } from 'react'
import * as ant from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { ChangeProductData, changeProductPrice, selectUpdateProductData } from '../../../../../../features/updateProduct/updateProductSlice';
import { getTax } from '../../../../../../utils/pricing';
import { selectTaxReceiptEnabled } from '../../../../../../features/taxReceipt/taxReceiptSlice';
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
    const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
    const calculateTableData = (productData) => {
        const prices = [
            {
                key: '1',
                cost: product.pricing.cost,
                description: 'Precio Lista',
                name: ['pricing', 'listPrice'],
                amount: productData.pricing.listPrice,
            },
            {
                key: '2',
                cost: product.pricing.cost,
                description: 'Precio Medio',
                name: ['pricing', 'avgPrice'],
                amount: productData.pricing.avgPrice,
            },
            {
                key: '3',
                cost: product.pricing.cost,
                description: 'Precio Mínimo',
                name: ['pricing', 'minPrice'],
                amount: productData.pricing.minPrice,
            }
        ];

        return prices.map(row => {
            // Asegúrate de que tienes números válidos y no indefinidos
            const amount = parseFloat(row.amount) || 0;
            const taxValue = parseFloat(productData?.pricing?.tax) || 0;
            const costUnit = parseFloat(productData?.pricing?.cost) || 0;
         

            // Realiza los cálculos
         
            const tax = (taxValue / 100) ;
            const itbis = taxReceiptEnabled ? (amount * tax) : 0 ;
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
    }, [product.pricing.cost, product.pricing.tax, product.pricing.listPrice, product.pricing.avgPrice, product.pricing.minPrice]);
    useEffect(() => {
        const finalPrice = Number(tableData[0]?.finalPrice) || 0;
        dispatch(changeProductPrice({ price: finalPrice }))
    }, [tableData])
    return (
        <ant.Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            size='small'
        />
    )
}
