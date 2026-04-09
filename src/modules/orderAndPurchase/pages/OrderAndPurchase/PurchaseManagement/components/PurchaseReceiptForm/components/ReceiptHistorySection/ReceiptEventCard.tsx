import { useState } from 'react';
import { Tag } from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  HomeOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';

import type { PurchaseReceiptEvent } from '@/utils/purchase/types';

import ReceiptEventItems from './ReceiptEventItems';
import {
  formatHistoryDate,
  formatHistoryActor,
  resolveWorkflowMeta,
  formatQty,
  safeQty,
} from './utils/receiptHistoryDisplay';

interface ReceiptEventCardProps {
  event: PurchaseReceiptEvent;
  index: number;
  total: number;
}

const ReceiptEventCard = ({ event, index, total }: ReceiptEventCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const workflowMeta = resolveWorkflowMeta(event.workflowStatusAfter);
  const receivedQty = safeQty(event.summary?.receivedQuantity);
  const pendingQty = safeQty(event.summary?.remainingPurchasePendingQuantity);
  const lineCount = safeQty(event.summary?.lineCount);
  const items = Array.isArray(event.items) ? event.items : [];
  const isFirst = index === 0;

  return (
    <CardWrapper>
      {/* Timeline node */}
      <TimelineColumn>
        <TimelineDot $isFirst={isFirst} />
        {index < total - 1 && <TimelineLine />}
      </TimelineColumn>

      {/* Card body */}
      <CardContent>
        <CardHeader onClick={() => setExpanded((v) => !v)}>
          <HeaderLeft>
            <EventDate>
              <CalendarOutlined />
              {formatHistoryDate(event.receivedAt)}
            </EventDate>
            <MetaRow>
              <MetaChip>
                <UserOutlined />
                {formatHistoryActor(event.receivedBy)}
              </MetaChip>
              {event.warehouseName && (
                <MetaChip>
                  <HomeOutlined />
                  {event.warehouseName}
                </MetaChip>
              )}
            </MetaRow>
          </HeaderLeft>

          <HeaderRight>
            <Tag color={workflowMeta.antColor}>{workflowMeta.label}</Tag>
            <StatsGroup>
              <StatBlock>
                <StatLabel>Recibido</StatLabel>
                <StatValue>{formatQty(receivedQty)}</StatValue>
              </StatBlock>
              <StatDivider />
              <StatBlock>
                <StatLabel>Pendiente</StatLabel>
                <StatValue $pending={pendingQty > 0}>
                  {formatQty(pendingQty)}
                </StatValue>
              </StatBlock>
              <StatDivider />
              <StatBlock>
                <StatLabel>Líneas</StatLabel>
                <StatValue>{lineCount}</StatValue>
              </StatBlock>
            </StatsGroup>
            <ExpandButton aria-expanded={expanded}>
              {expanded ? <UpOutlined /> : <DownOutlined />}
            </ExpandButton>
          </HeaderRight>
        </CardHeader>

        {expanded && items.length > 0 && (
          <ExpandedArea>
            <ReceiptEventItems items={items} />
          </ExpandedArea>
        )}
      </CardContent>
    </CardWrapper>
  );
};

export default ReceiptEventCard;

// ─── Styles ───────────────────────────────────────────────────────────────────

const CardWrapper = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const TimelineColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  padding-top: 14px;
`;

interface TimelineDotProps {
  $isFirst?: boolean;
}

const TimelineDot = styled.div<TimelineDotProps>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ $isFirst }) => ($isFirst ? '#1677ff' : '#d9d9d9')};
  border: 2px solid ${({ $isFirst }) => ($isFirst ? '#1677ff' : '#bfbfbf')};
  box-shadow: ${({ $isFirst }) =>
    $isFirst ? '0 0 0 3px rgba(22,119,255,0.15)' : 'none'};
  flex-shrink: 0;
  z-index: 1;
`;

const TimelineLine = styled.div`
  width: 2px;
  flex: 1;
  min-height: 16px;
  background: linear-gradient(to bottom, #d9d9d9, #f0f0f0);
  margin-top: 4px;
`;

const CardContent = styled.div`
  flex: 1;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
  background: #ffffff;
  margin-bottom: 12px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  gap: 12px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const EventDate = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #141414;
  display: flex;
  align-items: center;
  gap: 6px;

  .anticon {
    color: #1677ff;
    font-size: 13px;
  }
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const MetaChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #595959;
  background: #f5f5f5;
  border-radius: 100px;
  padding: 2px 10px;

  .anticon {
    font-size: 11px;
    color: #8c8c8c;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const StatsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
`;

const StatDivider = styled.div`
  width: 1px;
  height: 28px;
  background: #f0f0f0;
`;

const StatBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 12px;
`;

const StatLabel = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1;
`;

interface StatValueProps {
  $pending?: boolean;
}

const StatValue = styled.span<StatValueProps>`
  font-size: 14px;
  font-weight: 700;
  color: ${({ $pending }) => ($pending ? '#faad14' : '#262626')};
  line-height: 1.3;
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  color: #8c8c8c;
  font-size: 12px;
  transition: background-color 0.15s, color 0.15s;
  display: flex;
  align-items: center;

  &:hover {
    background: #f5f5f5;
    color: #1677ff;
  }
`;

const ExpandedArea = styled.div`
  padding: 0 16px 12px;
  border-top: 1px solid #f5f5f5;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
