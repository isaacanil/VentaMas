import { InfoCircleOutlined } from '@/constants/icons/antd';
import { Badge, Card, Form, Tooltip, Typography } from 'antd';
import styled from 'styled-components';

import type { FormItemProps } from 'antd';
import type { ReactNode } from 'react';

const { Text, Title } = Typography;

export const SectionCard = styled(Card)`
  border-radius: 18px !important;
  border: 1px solid #f0f2f5 !important;
  box-shadow: 0 10px 30px -15px rgb(15 23 42 / 25%);
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
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (width <= 768px) {
    grid-template-columns: 1fr;
  }
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

  /* justify-content: space-between; */
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

interface SwitchFieldProps extends FormItemProps {
  label: ReactNode;
  tooltip?: ReactNode;
  children: ReactNode;
}

export const SwitchField: React.FC<SwitchFieldProps> = ({
  label,
  tooltip,
  children,
  ...formItemProps
}) => (
  <InlineSwitchRow>
    <SwitchLabel>
      {label}
      {tooltip && (
        <Tooltip title={tooltip} placement="top">
          <InfoCircleOutlined style={{ color: '#94a3b8', fontSize: 14 }} />
        </Tooltip>
      )}
    </SwitchLabel>
    <Form.Item
      colon={false}
      label={null}
      style={{ marginBottom: 0 }}
      {...formItemProps}
    >
      {children}
    </Form.Item>
  </InlineSwitchRow>
);
