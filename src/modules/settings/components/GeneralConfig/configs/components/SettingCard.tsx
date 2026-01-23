import type { ReactNode } from 'react';
import { Card, Button, Typography, Tooltip } from 'antd';
import styled from 'styled-components';
import { SettingOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const StyledCard = styled(Card)`
  border: 1px solid #eef0f2;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 24px;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  background: #ffffff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.13);

  .ant-card-body {
    padding: 28px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
`;

const IconWrapper = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f7ff 100%);
  color: #1890ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
  border: 1px solid #bae7ff;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 20px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px dashed #eef0f2;
`;

const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  .label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #8c8c8c;
    font-weight: 700;
  }
  .value {
    font-size: 14px;
    font-weight: 600;
    color: #262626;
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

const ActionButton = styled(Button)`
  height: 40px;
  padding: 0 20px;
  border-radius: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background: #f0f7ff;
  }
`;

interface SettingCardSummaryItem {
  label: string;
  value: ReactNode;
}

interface SettingCardProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  extra?: ReactNode;
  summary?: SettingCardSummaryItem[];
  onConfigClick?: () => void;
  disabledSettings?: boolean;
}

const SettingCard = ({
  icon,
  title,
  description,
  extra,
  summary,
  onConfigClick,
  disabledSettings = false,
}: SettingCardProps) => {
  return (
    <StyledCard>
      <CardHeader>
        <HeaderLeft>
          <IconWrapper>{icon}</IconWrapper>
          <ContentWrapper>
            <Title level={5} style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{title}</Title>
            <Paragraph style={{ margin: 0, color: '#595959', fontSize: 13, lineHeight: '1.6' }}>
              {description}
            </Paragraph>
          </ContentWrapper>
        </HeaderLeft>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {extra}
          {onConfigClick && (
            <Tooltip title="Personalizar configuraciones">
              <ActionButton
                type="text"
                icon={<SettingOutlined />}
                onClick={onConfigClick}
                disabled={disabledSettings}
                style={{ color: '#1890ff' }}
              >
                Configurar
              </ActionButton>
            </Tooltip>
          )}
        </div>
      </CardHeader>

      {summary && (
        <SummaryGrid>
          {summary.map((item, index) => (
            <SummaryItem key={index}>
              <div className="label">{item.label}</div>
              <div className="value">
                {item.value}
              </div>
            </SummaryItem>
          ))}
        </SummaryGrid>
      )}
    </StyledCard>
  );
};

export default SettingCard;
