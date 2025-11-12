import { 
    faBox,
    faBoxes,
    faCalendarAlt,
    faClipboardCheck,
    faHistory
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Modal, Card, Typography, Space, Badge, Row, Col, Progress } from 'antd';
import dayjs from 'dayjs';
import styled from 'styled-components';

const { Title, Text } = Typography;

const StyledModal = styled(Modal)`
    .ant-modal-content {
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .ant-modal-header {
        padding: 20px 24px;
        border-bottom: 1px solid #f0f0f0;
        background: #fafafa;
    }
    .ant-modal-body {
        padding: 24px;
    }
`;

const StyledCard = styled(Card)`
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    
    .ant-card-body {
        padding: 24px;
    }
`;

const IconWrapper = styled.span`
    margin-right: 8px;
    color: #1890ff;
    font-size: 1.1em;
`;

const StatusBadge = styled(Badge)`
    .ant-badge-status-dot {
        width: 8px;
        height: 8px;
    }
`;

const QuantityCard = styled(Card)`
    border-radius: 8px;
    background: #fafafa;
    .ant-card-body {
        padding: 16px;
    }
`;

const BatchViewModal = ({ visible, onClose, batchData }) => {
    const formatDate = (dateObj) => {
        if (!dateObj) return '-';
        if (typeof dateObj === 'object' && dateObj.seconds) {
            return dayjs.unix(dateObj.seconds).format('DD/MM/YYYY HH:mm');
        }
        return dayjs(dateObj).format('DD/MM/YYYY HH:mm');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return '#52c41a';
            case 'inactive':
                return '#ff4d4f';
            default:
                return '#d9d9d9';
        }
    };

    const calculatePercentage = () => {
        if (!batchData?.initialQuantity) return 0;
        return Math.round((batchData.quantity / batchData.initialQuantity) * 100);
    };

    return (
        <StyledModal
            title={
                <Space size="middle" align="center">
                    <IconWrapper>
                        <FontAwesomeIcon icon={faBox} size="lg" />
                    </IconWrapper>
                    <Space direction="vertical" size={0}>
                        <Title level={4} style={{ margin: 0 }}>Lote #{batchData?.numberId}</Title>
                        <Text type="secondary" style={{ fontSize: '14px' }}>{batchData?.shortName || batchData?.productName}</Text>
                    </Space>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={700}
        >
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <QuantityCard>
                        <Row gutter={[16, 16]} align="middle">
                            <Col span={8}>
                                <Space direction="vertical" size={0}>
                                    <Text type="secondary">
                                        <FontAwesomeIcon icon={faBoxes} /> Cantidad
                                    </Text>
                                    <Space>
                                        <Text strong style={{ fontSize: '24px', color: '#1890ff' }}>
                                            {batchData?.quantity}
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: '14px' }}>
                                            / {batchData?.initialQuantity}
                                        </Text>
                                    </Space>
                                </Space>
                            </Col>
                            <Col span={16}>
                                <Progress 
                                    percent={calculatePercentage()}
                                    strokeColor={{
                                        '0%': '#1890ff',
                                        '100%': '#52c41a',
                                    }}
                                    size={12}
                                    status={calculatePercentage() < 20 ? 'exception' : 'normal'}
                                />
                            </Col>
                        </Row>
                    </QuantityCard>
                </Col>
                
                <Col span={24}>
                    <StyledCard>
                        <Row gutter={[24, 24]}>
                            <Col span={24}>
                                <Space align="center">
                                    <FontAwesomeIcon icon={faClipboardCheck} />
                                    <Text strong>Estado:</Text>
                                    <StatusBadge 
                                        status={batchData?.status === 'active' ? 'success' : 'error'}
                                        text={
                                            <Text style={{ color: getStatusColor(batchData?.status) }}>
                                                {batchData?.status === 'active' ? 'Activo' : 'Inactivo'}
                                            </Text>
                                        }
                                    />
                                </Space>
                            </Col>
                            
                            <Col span={12}>
                                <Space direction="vertical" size={4}>
                                    <Space>
                                        <FontAwesomeIcon icon={faCalendarAlt} />
                                        <Text type="secondary">Fecha Recepción</Text>
                                    </Space>
                                    <Text strong>{formatDate(batchData?.receivedDate)}</Text>
                                </Space>
                            </Col>
                            
                            <Col span={12}>
                                <Space direction="vertical" size={4}>
                                    <Space>
                                        <FontAwesomeIcon icon={faHistory} />
                                        <Text type="secondary">Última Actualización</Text>
                                    </Space>
                                    <Text strong>{formatDate(batchData?.updatedAt)}</Text>
                                </Space>
                            </Col>
                        </Row>
                    </StyledCard>
                </Col>
            </Row>
        </StyledModal>
    );
};

export default BatchViewModal;
