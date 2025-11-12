import { InputNumber, Table, Form } from 'antd';
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';

import { selectTaxReceiptEnabled } from '../../../../../../features/taxReceipt/taxReceiptSlice';
import { selectUpdateProductData } from '../../../../../../features/updateProduct/updateProductSlice';

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
                style={{ margin: 0 }}

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
    const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);    

    const calculateTableData = (productData) => {
        const prices = [
            {
                key: '1',
                cost: productData.pricing.cost,
                description: 'Precio Lista',
                name: ['pricing', 'listPrice'],
                amount: productData.pricing.listPrice,
            },
            {
                key: '2',
                cost: productData.pricing.cost,
                description: 'Precio Medio',
                name: ['pricing', 'avgPrice'],
                amount: productData.pricing.avgPrice,
            },
            {
                key: '3',
                cost: productData.pricing.cost,
                description: 'Precio Mínimo',
                name: ['pricing', 'minPrice'],
                amount: productData.pricing.minPrice,
            },
            {
                key: '4',
                cost: productData.pricing.cost,
                description: 'Precio Tarjeta',
                name: ['pricing', 'cardPrice'],
                amount: productData.pricing.cardPrice,
            },
            {
                key: '5',
                cost: productData.pricing.cost,
                description: 'Precio Oferta',
                name: ['pricing', 'offerPrice'],
                amount: productData.pricing.offerPrice,
            }
        ];        return prices.map(row => {
            // Asegúrate de que tienes números válidos y no indefinidos
            const amount = parseFloat(row.amount) || 0;
            // El tax puede ser un número directamente o un objeto con propiedad tax
            let taxValue = 0;
            if (typeof productData?.pricing?.tax === 'number') {
                taxValue = productData.pricing.tax;
            } else if (typeof productData?.pricing?.tax === 'object' && productData?.pricing?.tax?.tax) {
                taxValue = parseFloat(productData.pricing.tax.tax);
            } else if (typeof productData?.pricing?.tax === 'string') {
                taxValue = parseFloat(productData.pricing.tax);
            }
            
            const costUnit = parseFloat(productData?.pricing?.cost) || 0;

            // Realiza los cálculos
            const tax = (taxValue / 100);
            const itbis = taxReceiptEnabled ? (amount * tax) : 0;
            const finalPrice = amount + itbis;
            // El margen es la ganancia = precio sin itbis - costo
            const rawMargin = amount - costUnit;
            const hasPrice = amount > 0;
            const margin = hasPrice ? rawMargin : 0;

            // Verifica si los cálculos son válidos
            const isCalculationValid = hasPrice && isFinite(margin) && isFinite(finalPrice);
            // Porcentaje de ganancia sobre el precio de venta (sin itbis)
            const percentBenefits = isCalculationValid ? (margin / amount) * 100 : 0;

            // Redondea y formatea los resultados
            return {
                ...row,
                itbis: itbis.toFixed(2),
                finalPrice: finalPrice.toFixed(2),
                margin: margin.toFixed(2),
                percentBenefits: `${isCalculationValid ? percentBenefits.toFixed(1) : '0'}%`,
            };
        });
    };    
    
    useEffect(() => {
        const newTableData = calculateTableData(product);
        setTableData(newTableData);
    }, [product.pricing.cost, product.pricing.tax, product.pricing.listPrice, product.pricing.avgPrice, product.pricing.minPrice, product.pricing.cardPrice, product.pricing.offerPrice, taxReceiptEnabled]);
    // Nota: Ya no sincronizamos pricing.price con el precio final (con ITBIS).
    // El campo pricing.price debe almacenar exclusivamente el listPrice (sin impuestos).
    // La sincronización a listPrice ocurre en el reducer changeProductPrice cuando cambia pricing.listPrice.

    return (
        <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            size='small'
        />
    )
}
