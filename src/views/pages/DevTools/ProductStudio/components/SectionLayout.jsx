import { InfoCircleOutlined } from '@ant-design/icons';
import { Badge, Card, Form, Tooltip, Typography } from 'antd';
import styled from 'styled-components';

const { Text, Title } = Typography;

export const SectionCard = styled(Card)`
  border-radius: 18px !important;
  border: 1px solid #f0f2f5 !important;
  box-shadow: 0 10px 30px -15px rgba(15, 23, 42, 0.25);
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
  flex-wrap: wrap;
`;

export const SectionTitle = styled(Title)`
  margin: 0 !important;
`;

export const SectionDescription = styled(Text)`
  color: #6b7280 !important;
`;

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
`;

export const SectionBadge = styled(Badge)`
  .ant-badge-status-dot {
    width: 8px;
    height: 8px;
  }
`;

export const DividerLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  text-transform: uppercase;
  color: #94a3b8;
  letter-spacing: 0.1em;
`;

const InlineSwitchRow = styled.div`
  display: flex;
  align-items: center;
  // justify-content: space-between;
  gap: 12px;
  width: 100%;
`;

const SwitchLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #0f172a;
`;

export const SwitchField = ({ label, tooltip, children, ...formItemProps }) => (
  <Form.Item colon={false} label={null} style={{ marginBottom: 0 }} {...formItemProps}>
    <InlineSwitchRow>
      <SwitchLabel>
        {label}
        {tooltip && (
          <Tooltip title={tooltip} placement="top">
            <InfoCircleOutlined style={{ color: '#94a3b8', fontSize: 14 }} />
          </Tooltip>
        )}
      </SwitchLabel>
      {children}
    </InlineSwitchRow>
  </Form.Item>
);
