import { Statistic } from 'antd';
import React from 'react';
import styled from 'styled-components';

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
  const calculateTotals = () => {
    return replenishments.reduce(
      (acc, item) => {
        const baseCostTotal = Number(item.baseCost) || 0;
        const taxPercentage = Number(item.taxPercentage) || 0; // Use provided tax percentage
        const taxRate = taxPercentage > 1 ? taxPercentage / 100 : taxPercentage; // Normalize to percentage
        const itemITBIS = baseCostTotal * taxRate; // Calculate ITBIS (tax)
        const shippingCost = Number(item.freight) || 0; // Total freight for the lot
        const otherCosts = Number(item.otherCosts) || 0; // Total other costs for the lot
        const quantity = Number(item.quantity) || Number(item.purchaseQuantity) || 0;
        const divisor = quantity > 0 ? quantity : 1;
        const unitCost =
          baseCostTotal +
          itemITBIS +
          shippingCost / divisor +
          otherCosts / divisor;
        const subTotal = quantity * unitCost;

        return {
          totalProducts: acc.totalProducts + quantity,
          totalBaseCost: acc.totalBaseCost + baseCostTotal,
          totalItbis: acc.totalItbis + quantity * itemITBIS, // ITBIS debe sumar el impuesto total por cantidad
          totalShipping: acc.totalShipping + shippingCost, // Freight summed directly
          totalOtherCosts: acc.totalOtherCosts + otherCosts, // Other costs summed directly
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
