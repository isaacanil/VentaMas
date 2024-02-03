import React from 'react'
import * as antd from 'antd'
import { useFormatPrice } from '../../../../../../../hooks/useFormatPrice'
const { Descriptions, Table, Typography } = antd
const { Title } = Typography
export const InvoiceResume = ({ invoice }) => {


    return (
        <>
            <Title level={5}>Detalle de la Factura</Title>
            <Descriptions
                size='small'
                layout='vertical'
            >
                <Descriptions.Item label="Cambio">
                    <Typography.Text type={
                        invoice.change.value < 0 ? 'danger' : 
                        invoice.change.value == 0 ? 'success' : null}>
                        {useFormatPrice(invoice.change.value)}
                    </Typography.Text>
                </Descriptions.Item>
                <Descriptions.Item label="Total de la Compra">{useFormatPrice(invoice.totalPurchase.value)}</Descriptions.Item>
                <Descriptions.Item label="Total sin Impuestos">{useFormatPrice(invoice.totalPurchaseWithoutTaxes.value)}</Descriptions.Item>
                <Descriptions.Item label="Impuestos Totales">{useFormatPrice(invoice.totalTaxes.value)}</Descriptions.Item>
                <Descriptions.Item label="Articulos Comprados"> {invoice.totalShoppingItems.value}</Descriptions.Item>
            </Descriptions>


        </>
    );
}
