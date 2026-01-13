// @ts-nocheck
import { ClockCircleOutlined, ShopOutlined, ShoppingCartOutlined } from '@/constants/icons/antd';
import { Empty, Spin, Timeline, Typography } from 'antd';
import styled from 'styled-components';

import { formatDateTime } from '../utils/activityUtils';

const { Text } = Typography;

export const UserActivityList = ({ activities, error, loading }) => {
    if (loading) {
        return (
            <LoadingWrapper>
                <Spin tip="Cargando actividad...">
                    <div style={{ width: '100%', minHeight: 80 }} />
                </Spin>
            </LoadingWrapper>
        );
    }

    if (error) {
        return (
            <Empty
                description={<Text type="danger">{error}</Text>}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
        );
    }

    if (!activities || activities.length === 0) {
        return (
            <Empty
                description="No hay actividad reciente."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
        );
    }

    return (
        <ListWrapper>
            <Timeline mode="left">
                {activities.map((item) => (
                    <Timeline.Item
                        color={getColorForType(item.type)}
                        dot={getIconForType(item.type)}
                        key={item.id}
                        label={formatDateTime(item.timestamp)}
                    >
                        <ActivityContent>
                            <Text strong>{getActionLabel(item)}</Text>
                            <br />
                            <Text type="secondary">{item.details}</Text>
                        </ActivityContent>
                    </Timeline.Item>
                ))}
            </Timeline>
        </ListWrapper>
    );
};

const getIconForType = (type) => {
    switch (type) {
        case 'product':
            return <ShopOutlined />;
        case 'sale':
            return <ShoppingCartOutlined />;
        case 'purchase':
            return <ShopOutlined />; // You might want a different icon
        case 'expense':
            return <ShoppingCartOutlined />; // You might want a different icon
        case 'ar':
            return <ClockCircleOutlined />; // You might want a different icon
        default:
            return <ClockCircleOutlined />;
    }
};

const getColorForType = (type) => {
    switch (type) {
        case 'product':
            return 'blue';
        case 'sale':
            return 'green';
        case 'purchase':
            return 'gold';
        case 'expense':
            return 'red';
        case 'ar':
            return 'orange';
        default:
            return 'gray';
    }
};

const getActionLabel = (item) => {
    if (item.type === 'product') return 'Producto';
    if (item.type === 'sale') return 'Venta';
    if (item.type === 'purchase') return 'Compra';
    if (item.type === 'expense') return 'Gasto';
    if (item.type === 'ar') return 'Cuenta por Cobrar';
    return 'Actividad';
};

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 2rem;
`;

const ListWrapper = styled.div`
  padding: 1rem;
`;

const ActivityContent = styled.div`
  margin-bottom: 0.5rem;
`;
