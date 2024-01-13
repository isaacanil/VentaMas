import React from 'react'
import * as ant from 'antd'
const { Card, Space, Input, Form } = ant
export const QRCode = ({product}) => {
    return (
        <Card
            title="Código QR"
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
            style={{width: '100%'}}
            
            >
                <ant.QRCode 
                size={100}
                value={product?.qrCode || '-'} 
                />
                <Form.Item
                    name="qrCode"   
                    >

                <Input
                   
                    placeholder="Código QR" 
                    maxLength={60}
                    value={product?.qrCode}
                />
                </Form.Item>
            </Space>
        </Card>
    )
}
