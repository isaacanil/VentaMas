import { Card, Progress, List, Tag, Empty, Statistic, Row, Col } from 'antd';
import { WarningOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';

// Función simple para formatear números
const formatNumber = (num) => {
  if (num == null) return '0';
  return new Intl.NumberFormat('es-DO').format(num);
};

/**
 * Vista detallada de las alertas de comprobantes fiscales
 */
const FiscalReceiptsDetailView = ({
  widgetData,
  alertSummary,
  criticalReceipts = [],
  warningReceipts = [],
  hasIssues,
  isLoading
}) => {
  
  if (isLoading) {
    return (
      <LoadingContainer>
        <div>Cargando información de comprobantes...</div>
      </LoadingContainer>
    );
  }

  const getReceiptTagColor = (alertLevel) => {
    switch (alertLevel) {
      case 'critical': return 'red';
      case 'warning': return 'orange';
      default: return 'green';
    }
  };

  const getReceiptIcon = (alertLevel) => {
    switch (alertLevel) {
      case 'critical': return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning': return <WarningOutlined style={{ color: '#faad14' }} />;
      default: return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
  };

  const allReceiptsWithIssues = [...criticalReceipts, ...warningReceipts];

  return (
    <DetailContainer>
      {/* Resumen estadístico */}
      <SummarySection>
        <Card title="Resumen General" size="small">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Total Activos"
                value={alertSummary.totalActive || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Necesitan Atención"
                value={alertSummary.needingAttention || 0}
                valueStyle={{ color: hasIssues ? '#faad14' : '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Críticos"
                value={alertSummary.critical || 0}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Advertencias"
                value={alertSummary.warning || 0}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
          </Row>
        </Card>
      </SummarySection>

      {/* Estado principal */}
      <StatusSection>
        <StatusCard $alertType={widgetData.alertType}>
          <StatusIcon>
            {widgetData.alertType === 'error' || widgetData.alertType === 'critical' ? 
              <WarningOutlined /> : 
              widgetData.alertType === 'warning' ? 
              <WarningOutlined /> : 
              widgetData.alertType === 'success' ? 
              <CheckCircleOutlined /> : 
              <InfoCircleOutlined />
            }
          </StatusIcon>
          <StatusContent>
            <StatusMessage>{widgetData.message}</StatusMessage>
            {widgetData.seriesInfo && (
              <SeriesInfo>{widgetData.seriesInfo}</SeriesInfo>
            )}
            {widgetData.remaining && widgetData.total && (
              <ProgressContainer>
                <Progress
                  percent={widgetData.percentage}
                  strokeColor={
                    widgetData.alertType === 'error' || widgetData.alertType === 'critical' ? '#ff4d4f' :
                    widgetData.alertType === 'warning' ? '#faad14' : '#52c41a'
                  }
                  format={() => `${formatNumber(widgetData.remaining)} restantes`}
                />
              </ProgressContainer>
            )}
          </StatusContent>
        </StatusCard>
      </StatusSection>

      {/* Lista de comprobantes con problemas */}
      {hasIssues && allReceiptsWithIssues.length > 0 && (
        <ProblemsSection>
          <Card title="Comprobantes que Necesitan Atención" size="small">
            <List
              dataSource={allReceiptsWithIssues}
              renderItem={(receipt) => (
                <ReceiptListItem>
                  <ReceiptInfo>
                    <ReceiptHeader>
                      <ReceiptIcon>
                        {getReceiptIcon(receipt.alertLevel)}
                      </ReceiptIcon>
                      <ReceiptName>{receipt.name}</ReceiptName>
                      <Tag color={getReceiptTagColor(receipt.alertLevel)}>
                        {receipt.alertLevel === 'critical' ? 'CRÍTICO' : 'ADVERTENCIA'}
                      </Tag>
                    </ReceiptHeader>
                    <ReceiptDetails>
                      <DetailItem>
                        <DetailLabel>Serie:</DetailLabel>
                        <DetailValue>{receipt.series}</DetailValue>
                      </DetailItem>
                      <DetailItem>
                        <DetailLabel>Restantes:</DetailLabel>
                        <DetailValue className={receipt.alertLevel}>
                          {formatNumber(receipt.remainingNumbers)}
                        </DetailValue>
                      </DetailItem>
                      <DetailItem>
                        <DetailLabel>Total:</DetailLabel>
                        <DetailValue>{formatNumber(receipt.totalNumbers)}</DetailValue>
                      </DetailItem>
                    </ReceiptDetails>
                    {receipt.totalNumbers > 0 && (
                      <ReceiptProgress>
                        <Progress
                          percent={receipt.percentageRemaining}
                          size="small"
                          strokeColor={
                            receipt.alertLevel === 'critical' ? '#ff4d4f' : '#faad14'
                          }
                          showInfo={false}
                        />
                      </ReceiptProgress>
                    )}
                  </ReceiptInfo>
                </ReceiptListItem>
              )}
            />
          </Card>
        </ProblemsSection>
      )}

      {/* Estado cuando no hay problemas */}
      {!hasIssues && alertSummary.totalActive > 0 && (
        <SuccessSection>
          <Card>
            <Empty
              image={<CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />}
              imageStyle={{ height: 60 }}
              description={
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#52c41a', marginBottom: 8 }}>
                    ¡Todos los comprobantes están en buen estado!
                  </div>
                  <div style={{ color: '#8c8c8c' }}>
                    {alertSummary.totalActive} comprobante{alertSummary.totalActive > 1 ? 's' : ''} activo{alertSummary.totalActive > 1 ? 's' : ''} monitoreado{alertSummary.totalActive > 1 ? 's' : ''}
                  </div>
                </div>
              }
            />
          </Card>
        </SuccessSection>
      )}

      {/* Estado cuando no hay comprobantes */}
      {alertSummary.totalActive === 0 && (
        <EmptySection>
          <Card>
            <Empty
              image={<InfoCircleOutlined style={{ fontSize: 48, color: '#1890ff' }} />}
              imageStyle={{ height: 60 }}
              description={
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1890ff', marginBottom: 8 }}>
                    No hay comprobantes configurados
                  </div>
                  <div style={{ color: '#8c8c8c' }}>
                    Configure sus comprobantes fiscales para ver alertas aquí
                  </div>
                </div>
              }
            />
          </Card>
        </EmptySection>
      )}
    </DetailContainer>
  );
};

// Estilos
const DetailContainer = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  color: #8c8c8c;
  font-style: italic;
`;

const SummarySection = styled.div``;

const StatusSection = styled.div``;

const StatusCard = styled.div`
  background: ${props => {
    switch (props.$alertType) {
      case 'error':
      case 'critical':
        return '#fff2f0';
      case 'warning':
        return '#fffbe6';
      case 'success':
        return '#f6ffed';
      default:
        return '#f0f9ff';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$alertType) {
      case 'error':
      case 'critical':
        return '#ffccc7';
      case 'warning':
        return '#ffe58f';
      case 'success':
        return '#b7eb8f';
      default:
        return '#bae7ff';
    }
  }};
  border-radius: 8px;
  padding: 20px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
`;

const StatusIcon = styled.div`
  font-size: 24px;
  color: ${props => {
    switch (props.$alertType) {
      case 'error':
      case 'critical':
        return '#ff4d4f';
      case 'warning':
        return '#faad14';
      case 'success':
        return '#52c41a';
      default:
        return '#1890ff';
    }
  }};
`;

const StatusContent = styled.div`
  flex: 1;
`;

const StatusMessage = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 8px;
`;

const SeriesInfo = styled.div`
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 12px;
`;

const ProgressContainer = styled.div`
  margin-top: 12px;
`;

const ProblemsSection = styled.div``;

const ReceiptListItem = styled(List.Item)`
  padding: 16px !important;
  border-bottom: 1px solid #f0f0f0 !important;
`;

const ReceiptInfo = styled.div`
  width: 100%;
`;

const ReceiptHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const ReceiptIcon = styled.div`
  font-size: 18px;
`;

const ReceiptName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  flex: 1;
`;

const ReceiptDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const DetailLabel = styled.div`
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
`;

const DetailValue = styled.div`
  font-size: 14px;
  color: #262626;
  font-weight: 600;

  &.critical {
    color: #ff4d4f;
  }

  &.warning {
    color: #faad14;
  }
`;

const ReceiptProgress = styled.div`
  margin-top: 8px;
`;

const SuccessSection = styled.div``;

const EmptySection = styled.div``;

export default FiscalReceiptsDetailView;
