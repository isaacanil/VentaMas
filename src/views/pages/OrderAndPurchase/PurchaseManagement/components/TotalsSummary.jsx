import { Statistic } from 'antd';
import React from 'react';
import styled from 'styled-components';

const Contained = styled.div`
  padding: 1em 0;
`;

const StyledCard = styled(Contained)`
  background: #fafafa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
`;

const Group = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  justify-items: center;
  gap: 16px;
  @media (max-width: 768px) {
    justify-items: start;
  }
`;

const TotalItem = styled(Statistic)`
  .ant-statistic-title {
    color: #8c8c8c;
    font-size: 14px;
  }
  .ant-statistic-content {
    color: #262626;
    font-size: 16px;
  }
`;

const GrandTotalItem = styled(TotalItem)`
  color: #cf1322;
  font-weight: bold;
`;

const TotalsSummary = ({ replenishments }) => {
  const calculateTotals = () => {
    return replenishments.reduce(
      (acc, item) => {
        const baseCostTotal = Number(item.baseCost);
        const taxPercentage = Number(item.taxPercentage) || 0; // Use provided tax percentage
        const itemITBIS = (baseCostTotal * taxPercentage) / 100; // Calculate ITBIS (tax)
        const shippingCost = Number(item.freight) || 0; // Use provided freight or default to 0
        const otherCosts = Number(item.otherCosts) || 0; // Use provided other costs or default to 0
        const subTotal =
          (baseCostTotal + itemITBIS + shippingCost + otherCosts) *
          Number(item?.purchaseQuantity || item?.quantity);

        return {
          totalProducts: acc.totalProducts + Number(item.quantity),
          totalBaseCost: acc.totalBaseCost + baseCostTotal,
          totalItbis: acc.totalItbis + itemITBIS,
          totalShipping: acc.totalShipping + shippingCost,
          totalOtherCosts: acc.totalOtherCosts + otherCosts,
          grandTotal: acc.grandTotal + subTotal,
        };
      },
      {
        totalProducts: 0,
        totalBaseCost: 0,
        totalItbis: 0,
        totalShipping: 0,
        totalOtherCosts: 0,
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
        <TotalItem
          title="Total ITBIS"
          value={totals.totalItbis}
          prefix="$"
          precision={2}
        />
        <TotalItem
          title="Total Flete"
          value={totals.totalShipping}
          prefix="$"
          precision={2}
        />
        <TotalItem
          title="Total Otros Costos"
          value={totals.totalOtherCosts}
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
