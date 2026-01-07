import { Statistic } from 'antd';
import styled from 'styled-components';
import type { PurchaseReplenishment } from '@/utils/purchase/types';
import { calculateReplenishmentTotals } from '@/utils/order/totals';

const Contained = styled.div`
  padding: 1em 0;
`;

const StyledCard = styled(Contained)`
  margin-bottom: 16px;
  background: #fafafa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
`;

const Group = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  justify-items: center;

  @media (width <= 768px) {
    justify-items: start;
  }
`;

const TotalItem = styled(Statistic)`
  .ant-statistic-title {
    font-size: 14px;
    color: #8c8c8c;
  }

  .ant-statistic-content {
    font-size: 16px;
    color: #262626;
  }
`;

const GrandTotalItem = styled(TotalItem)`
  font-weight: bold;
  color: #cf1322;
`;

interface TotalsSummaryProps {
  replenishments?: PurchaseReplenishment[];
}

const TotalsSummary = ({ replenishments = [] }: TotalsSummaryProps) => {
  const totals = calculateReplenishmentTotals(replenishments);

  return (
    <StyledCard>
      <Group>
        <TotalItem
          title="Total Productos"
          value={totals.totalProducts}
          prefix="#"
        />
        <TotalItem
          title="Total Costo Base"
          value={totals.totalBaseCost}
          prefix="$"
          precision={2}
        />
        <GrandTotalItem
          title="Gran Total"
          value={totals.grandTotal}
          prefix="$"
          precision={2}
        />
      </Group>
    </StyledCard>
  );
};

export default TotalsSummary;
