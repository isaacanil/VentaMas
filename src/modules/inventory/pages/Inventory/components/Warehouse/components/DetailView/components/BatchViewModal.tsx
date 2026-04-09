import {
  faBox,
  faBoxes,
  faCalendarAlt,
  faClipboardCheck,
  faHistory,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Modal,
  Card,
  Typography,
  Space,
  Badge,
  Row,
  Col,
  Progress,
} from 'antd';
import styled from 'styled-components';

import { formatDateTime } from '@/utils/inventory/dates';

const { Title, Text } = Typography;

const StyledModal = styled(Modal)`
  .ant-modal-content {
    overflow: hidden;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
  }

  .ant-modal-header {
    padding: 20px 24px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
  }

  .ant-modal-body {
    padding: 24px;
  }
`;

const StyledCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 4%);

  .ant-card-body {
    padding: 24px;
  }
`;

const IconWrapper = styled.span`
  margin-right: 8px;
  font-size: 1.1em;
  color: #1890ff;
`;

const StatusBadge = styled(Badge)`
  .ant-badge-status-dot {
    width: 8px;
    height: 8px;
  }
`;

const QuantityCard = styled(Card)`
  background: #fafafa;
  border-radius: 8px;

  .ant-card-body {
    padding: 16px;
  }
`;

export type BatchData = {
  numberId?: string | number | null;
  shortName?: string | null;
  productName?: string | null;
  status?: string | null;
  quantity?: number | string | null;
  initialQuantity?: number | string | null;
  receivedDate?: unknown;
  updatedAt?: unknown;
};

type BatchViewModalProps = {
  visible: boolean;
  onClose: () => void;
  batchData?: BatchData | null;
};

const BatchViewModal = ({
  visible,
  onClose,
  batchData,
}: BatchViewModalProps) => {
  const formatDate = (dateObj: unknown) =>
    formatDateTime(dateObj, 'dd/MM/yyyy HH:mm') || '-';

  const getStatusColor = (status?: string | null) => {
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
    const initialQuantity = Number(batchData?.initialQuantity ?? 0);
    const quantity = Number(batchData?.quantity ?? 0);
    if (!initialQuantity) return 0;
    return Math.round((quantity / initialQuantity) * 100);
  };

  const percentage = calculatePercentage();
  const quantity = Number(batchData?.quantity ?? 0);
  const initialQuantity = Number(batchData?.initialQuantity ?? 0);

  return (
    <StyledModal
      title={
        <Space size="middle" align="center">
          <IconWrapper>
            <FontAwesomeIcon icon={faBox} size="lg" />
          </IconWrapper>
          <Space orientation="vertical" size={0}>
            <Title level={4} style={{ margin: 0 }}>
              Lote #{batchData?.numberId ?? '-'}
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              {batchData?.shortName || batchData?.productName || 'Sin nombre'}
            </Text>
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
                <Space orientation="vertical" size={0}>
                  <Text type="secondary">
                    <FontAwesomeIcon icon={faBoxes} /> Cantidad
                  </Text>
                  <Space>
                    <Text strong style={{ fontSize: '24px', color: '#1890ff' }}>
                      {quantity}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      / {initialQuantity}
                    </Text>
                  </Space>
                </Space>
              </Col>
              <Col span={16}>
                <Progress
                  percent={percentage}
                  strokeColor={{
                    '0%': '#1890ff',
                    '100%': '#52c41a',
                  }}
                  size={12}
                  status={percentage < 20 ? 'exception' : 'normal'}
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
                    status={
                      batchData?.status === 'active' ? 'success' : 'error'
                    }
                    text={
                      <Text
                        style={{ color: getStatusColor(batchData?.status) }}
                      >
                        {batchData?.status === 'active' ? 'Activo' : 'Inactivo'}
                      </Text>
                    }
                  />
                </Space>
              </Col>

              <Col span={12}>
                <Space orientation="vertical" size={4}>
                  <Space>
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <Text type="secondary">Fecha Recepción</Text>
                  </Space>
                  <Text strong>{formatDate(batchData?.receivedDate)}</Text>
                </Space>
              </Col>

              <Col span={12}>
                <Space orientation="vertical" size={4}>
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
