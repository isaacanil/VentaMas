import { Statistic } from 'antd';
import React from 'react';
import styled from 'styled-components';
// import { calculateOrderTotals } from '@/utils/orderCalculationsUtil'; // removed

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

const TotalsSummary = ({ replenishments }) => {
  // New calculation logic using purchaseQuantity if available
  const calculateTotals = () => {
    return replenishments.reduce(
      (acc, item) => {
        const baseCostTotal = Number(item.baseCost);
        const taxPercentage = Number(item.taxPercentage) || 0;
        const itemITBIS = (baseCostTotal * taxPercentage) / 100;
        const shippingCost = Number(item.freight) || 0;
        const otherCosts = Number(item.otherCosts) || 0;
        const multiplier = Number(item.purchaseQuantity || item.quantity);
        const subTotal =
          (baseCostTotal + itemITBIS + shippingCost + otherCosts) * multiplier;
        return {
          totalProducts: acc.totalProducts + Number(item.quantity),
          totalBaseCost: acc.totalBaseCost + baseCostTotal,
          grandTotal: acc.grandTotal + subTotal,
        };
      },
      {
        totalProducts: 0,
        totalBaseCost: 0,
        grandTotal: 0,
      },
    );
  };

  const totals = calculateTotals();

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
