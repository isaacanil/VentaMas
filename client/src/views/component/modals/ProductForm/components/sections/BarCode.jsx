import React from 'react'
import * as ant from 'antd'
import Barcode from 'react-barcode'
const { Card, Space, Input, Form } = ant
export const BarCode = ({ product }) => {
    return (
        <Card
            title="Código de Barra"
            size='small'
            extra={
                <ant.Tooltip title="El código de barra es un código que se representa en forma de barras y espacios que pueden ser leídos e interpretados por un escáner. El código de barras se utiliza para identificar productos de forma única a nivel mundial.">
                    {/* <ant.Button type="link" shape="circle" icon={<ant.QuestionCircleOutline />} /> */}
                </ant.Tooltip>
            }
        >
            <Space
                direction="vertical"
                align="center"
                style={{ width: '100%' }}
            >
                <Barcode
                    width={1}
                    height={50}
                    value={product?.barCode || '-'}
                />
                <Form.Item
                    name="barCode"
                >
                <Input
                    placeholder="Código de Barra"
                    maxLength={60}
                    value={product.barCode}
                />
                </Form.Item>
            </Space>
        </Card>
    )
}
