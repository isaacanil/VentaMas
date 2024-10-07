import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import * as antd from 'antd';
const { Modal, Button, Table, Tag, Typography, Divider, Input } = antd;
import {
    UserOutlined,
    ShoppingOutlined,
    CreditCardOutlined,
} from '@ant-design/icons';
import { icons } from '../../../../constants/icons/icons';
import { useFormatPrice } from '../../../../hooks/useFormatPrice';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Styled Components
const StyledModal = styled(Modal)`
  .ant-modal-content {
    max-width: 800px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Card = styled.div`
  border: 1px solid #f0f0f0;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 24px;
`;

const Group = styled.div`
    display: grid;
    gap: 1em;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
`;

const FlexBetween = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export default function PreorderModal() {
    const [visible, setVisible] = useState(false);
    const [preorderData, setPreorderData] = useState(null);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetch('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/snippet-kLsSWKTzqCrT9GtLcfVJoFlCwQoqRH.txt')
            .then((response) => response.json())
            .then((data) => setPreorderData(data[0].data))
            .catch((error) => console.error('Error fetching data:', error));
    }, []);

    if (!preorderData) return null;

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'volcano';
            case 'completed':
                return 'green';
            default:
                return 'gray';
        }
    };

    const getStatusName = (status) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'Pendiente';
            case 'completed':
                return 'Completado';
            default:
                return 'Desconocido';
        }
    };

    return (
        <>
            <Button icon={icons.editingActions.show} type="default" onClick={() => setVisible(true)}>
             
            </Button>
            <StyledModal
                title="Detalles del Pedido"
                visible={visible}
                onCancel={() => setVisible(false)}
                footer={null}
                width={800}
            >
                <div>
                    {/* Order Status */}
                    <Group>
                        <Card>
                            <Header>
                                <FlexBetween >
                                    <Title level={5} style={{ margin: "0 1em 0 0" }}>
                                        Estado del Pedido
                                    </Title>
                                    <Tag color={getStatusColor(preorderData.status)}>
                                        {getStatusName(preorderData.status)}
                                    </Tag>
                                </FlexBetween>
                            </Header>
                            <div style={{ marginTop: 16 }}>
                                <Text strong style={{ fontSize: '18px', display: 'block' }}>
                                    Pedido #{preorderData.preorderDetails.numberID}
                                </Text>
                            </div>
                        </Card>

                        {/* Client Information */}
                        <Card>
                            <Header>
                                <FlexBetween>
                                    <UserOutlined style={{ marginRight: 8 }} />
                                    <Title level={5} style={{ margin: 0 }}>
                                        Información del Cliente
                                    </Title>
                                </FlexBetween>
                            </Header>
                            <div style={{ marginTop: 16 }}>
                                <Text strong>{preorderData.client.name}</Text>
                                <br />
                                <Text>
                                    <strong>Teléfono:</strong> {preorderData.client.tel || 'N/A'}
                                </Text>
                                <br />
                                <Text type="secondary">{preorderData.client.address}</Text>
                            </div>
                        </Card>
                    </Group>

                    {/* Products */}
                    <Card>
                        <Header>
                            <FlexBetween>
                                <ShoppingOutlined style={{ marginRight: 8 }} />
                                <Title level={5} style={{ margin: 0 }}>
                                    Productos
                                </Title>
                            </FlexBetween>
                        </Header>
                        <Table
                            columns={[
                                {
                                    title: 'Nombre',
                                    dataIndex: 'name',
                                    key: 'name',
                                    render: (text) => <Text strong>{text}</Text>,
                                },
                                {
                                    title: 'Tamaño',
                                    dataIndex: 'size',
                                    key: 'size',
                                },
                                {
                                    title: 'Cantidad',
                                    dataIndex: 'amountToBuy',
                                    key: 'amountToBuy',
                                },
                                {
                                    title: 'Precio',
                                    dataIndex: ['pricing', 'price'],
                                    key: 'price',
                                    align: 'right',
                                    render: (price) => `$${price.toFixed(2)}`,
                                },
                            ]}
                            dataSource={preorderData.products}
                            rowKey={(record, index) => index}
                            pagination={false}
                            style={{ marginTop: 16 }}
                        />
                    </Card>

                    {/* Payment Summary */}
                    <Card>
                        <Header>
                            <FlexBetween>
                                <CreditCardOutlined style={{ marginRight: 8 }} />
                                <Title level={5} style={{ margin: 0 }}>
                                    Resumen de Pago
                                </Title>
                            </FlexBetween>
                        </Header>
                        <div style={{ marginTop: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text>Subtotal</Text>
                                <Text>{useFormatPrice(preorderData.totalPurchase.value - preorderData.delivery.value)}</Text>
                            </div>
                            {
                                preorderData.delivery.status && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text>Entrega</Text>
                                        <Text>{useFormatPrice(preorderData.delivery.value)}</Text>
                                    </div>
                                )
                            }
                            <Divider />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                <Text>Total</Text>
                                <Text>{useFormatPrice(preorderData.totalPurchase.value)}</Text>
                            </div>
                        </div>
                    </Card>
                </div>
            </StyledModal>
        </>
    );
}
