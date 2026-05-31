import { Button } from 'antd';
import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

export const PlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
`;

export const PlanCard = styled.section<{
  $tone: 'current' | 'selectable' | 'locked';
}>`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border-radius: 14px;
  border: 1px solid
    ${(props) =>
      props.$tone === 'current'
        ? 'rgb(13 148 136 / 35%)'
        : props.$tone === 'selectable'
          ? 'rgb(59 130 246 / 24%)'
          : '#e2e8f0'};
  background: ${(props) =>
    props.$tone === 'current'
      ? 'linear-gradient(180deg, rgb(240 253 250) 0%, #ffffff 24%)'
      : '#ffffff'};
  overflow: hidden;
`;

export const PlanCardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 18px 12px;
`;

export const PlanCardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const PlanCardName = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1.1rem;
  font-weight: 700;
`;

export const CurrentBadge = styled.span`
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgb(13 148 136 / 25%);
  background: rgb(13 148 136 / 8%);
  color: #0f766e;
  font-size: 0.72rem;
  font-weight: 700;
`;

export const SelectableBadge = styled.span`
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgb(59 130 246 / 22%);
  background: rgb(59 130 246 / 8%);
  color: #1d4ed8;
  font-size: 0.72rem;
  font-weight: 700;
`;

export const PlanCardDesc = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.88rem;
  line-height: 1.55;
`;

export const PlanCardBody = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  padding: 0 18px 18px;
`;

export const PriceBlock = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
`;

export const PriceAmount = styled.span`
  color: #0f172a;
  font-size: 1.7rem;
  font-weight: 800;
  line-height: 1;
`;

export const PricePeriod = styled.span`
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
`;

export const LimitSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const SectionLabel = styled.span`
  color: #94a3b8;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const LimitRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const LimitLeft = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const LimitIcon = styled.span`
  width: 16px;
  color: #64748b;
  text-align: center;
`;

export const LimitLabel = styled.span`
  color: #374151;
  font-size: 0.84rem;
`;

export const LimitValue = styled.span<{ $unlimited: boolean }>`
  color: ${(props) => (props.$unlimited ? '#0f766e' : '#0f172a')};
  font-size: 0.84rem;
  font-weight: 700;
`;

export const Divider = styled.hr`
  margin: 0;
  border: none;
  border-top: 1px solid #e2e8f0;
`;

export const FeatureRow = styled.div<{ $included: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${(props) => (props.$included ? '#374151' : '#cbd5e1')};
  font-size: 0.84rem;
`;

export const FeatureIcon = styled.span<{ $included: boolean }>`
  width: 16px;
  color: ${(props) => (props.$included ? '#0f766e' : '#cbd5e1')};
  text-align: center;
`;

export const SelectButton = styled(Button)`
  margin-top: auto;
`;

export const ComparisonCard = styled.section`
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
`;

export const ComparisonTitle = styled.h3`
  margin: 0;
  padding: 18px 20px 14px;
  color: #0f172a;
  font-size: 0.98rem;
  font-weight: 700;
  border-bottom: 1px solid #e2e8f0;
`;

export const TableWrapper = styled.div`
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }
`;

export const Th = styled.th<{ $left?: boolean; $current?: boolean }>`
  padding: 10px 18px;
  text-align: ${(props) => (props.$left ? 'left' : 'center')};
  color: ${(props) => (props.$current ? '#0f766e' : '#64748b')};
  font-weight: 600;
  white-space: nowrap;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;

  > span {
    display: block;
    margin-bottom: ${(props) => (props.$current ? '4px' : '0')};
  }
`;

export const InlineCurrentBadge = styled.span`
  display: inline-block;
  padding: 1px 7px;
  border-radius: 4px;
  border: 1px solid rgb(13 148 136 / 25%);
  color: #0f766e;
  font-size: 0.68rem;
  font-weight: 700;
`;

export const Tr = styled.tr<{ $even: boolean }>`
  background: ${(props) => (props.$even ? '#f8fafc' : 'transparent')};
  border-bottom: 1px solid #f1f5f9;
`;

export const Td = styled.td<{ $center?: boolean }>`
  padding: 10px 18px;
  color: #374151;
  text-align: ${(props) => (props.$center ? 'center' : 'left')};
  vertical-align: middle;
`;

export const TableValue = styled.span<{ $unlimited: boolean }>`
  color: ${(props) => (props.$unlimited ? '#0f766e' : '#0f172a')};
  font-weight: 700;
`;

export const CheckIcon = styled.span`
  color: #0f766e;
`;

export const MinusIcon = styled.span`
  color: #cbd5e1;
`;

export const SubheaderRow = styled.tr`
  background: #f1f5f9;

  td {
    padding: 8px 18px;
    border-bottom: 1px solid #e2e8f0;
  }
`;

export const SubheaderLabel = styled.span`
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

export const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 4px;
`;

export const ModalTitle = styled.h3`
  margin: 0;
  color: #0f172a;
  font-size: 1.04rem;
  font-weight: 700;
`;

export const ModalDesc = styled.p`
  margin: 0;
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.6;
`;

export const PaymentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
`;

export const PaymentIconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #0f172a;
  color: #ffffff;
`;

export const PaymentInfoText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const PaymentMethod = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 600;
`;

export const PaymentCard = styled.p`
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;
