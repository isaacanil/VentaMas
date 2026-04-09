import React, { useState } from 'react';
import { Card, Button, Typography, Space } from 'antd';
import { ProductFormV2 } from '@/components/modals/ProductFormV2/ProductFormV2';

const { Title, Paragraph } = Typography;

export const ProductFormV2TestBench = () => {
    const [modalVisible, setModalVisible] = useState(false);

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <Card
                title={<Title level={3} style={{ margin: 0 }}>Laboratorio: Product Form V2</Title>}
                type="inner"
            >
                <Paragraph style={{ fontSize: '16px' }}>
                    Este playground te permite visualizar e interactuar con la nueva experiencia de creación de productos
                    (`ProductFormV2`) sin afectar los datos reales de producción ni requerir dependencias de Redux complejas.
                </Paragraph>

                <Space direction="vertical" size="large" style={{ width: '100%', marginTop: '24px' }}>
                    <Card type="inner" title="Lanzador del Componente">
                        <Space align="center" size="middle">
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => setModalVisible(true)}
                                style={{ backgroundColor: '#1890ff' }}
                            >
                                Abrir ProductForm V2
                            </Button>
                            <Typography.Text type="secondary">
                                Simula el comportamiento del sistema al crear/editar un nuevo ítem del inventario.
                            </Typography.Text>
                        </Space>
                    </Card>
                </Space>
            </Card>

            <ProductFormV2
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
            />
        </div>
    );
};

export default ProductFormV2TestBench;
