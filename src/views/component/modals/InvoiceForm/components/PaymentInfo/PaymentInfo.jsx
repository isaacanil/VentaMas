import React from 'react'
import * as antd from 'antd'
import styled from 'styled-components'

const { Form, Input, Col, Row } = antd

export const PaymentInfo = () => {
    return (
        <Container>
            <PaymentCard>
                <CardHeader>
                    <HeaderTitle>Información de Pago</HeaderTitle>
                </CardHeader>
                
                <CardContent>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Monto Pagado"
                                name={["payment", "value"]}
                            >
                                <Input type="number" placeholder="0.00" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Descuento %"
                                name={["discount", "value"]}
                                help="Ejemplo: 10 = 10%"
                            >
                                <Input type="number" placeholder="0" />
                            </Form.Item>
                        </Col>
                    </Row>
                </CardContent>
            </PaymentCard>
        </Container>
    )
}

const Container = styled.div`
    width: 100%;
`

const PaymentCard = styled.div`
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    margin-bottom: 16px;
`

const CardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #fafafa;
    border-bottom: 1px solid #e8e8e8;
`

const HeaderTitle = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: #262626;
`

const CardContent = styled.div`
    padding: 16px;
`
