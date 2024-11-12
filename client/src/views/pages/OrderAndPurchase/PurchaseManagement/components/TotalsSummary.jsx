import React from 'react'
import styled from 'styled-components'
import { Card, Statistic, Divider } from 'antd'
const Contained = styled.div`
  padding: 1em 0;
`
const StyledCard = styled(Contained)`
  background: #fafafa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`

const Group = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));

  justify-items: center;
  
  gap: 16px;
  @media (max-width: 768px) {
    justify-items: start;
  }
`

const TotalItem = styled(Statistic)`
  .ant-statistic-title {
    color: #8c8c8c;
    font-size: 14px;
  }
  .ant-statistic-content {
    color: #262626;
    font-size: 16px;
  }
`

const GrandTotalItem = styled(TotalItem)`
 color: #cf1322;
 font-weight: bold;
`

const TotalsSummary = ({ totals = {} }) => {
  const {
    totalProducts = 0,
    totalBaseCost = 0,
    totalItbis = 0,
    totalShipping = 0,
    totalOtherCosts = 0,
    grandTotal = 0
  } = totals

  return (
    <StyledCard>
      <Group>
        <TotalItem 
          title="Total Productos" 
          value={totalProducts}
          prefix="#"
        />
        <TotalItem 
          title="Total Costo Base" 
          value={totalBaseCost} 
          prefix="$"
          precision={2}
        />
        <TotalItem 
          title="Total ITBIS" 
          value={totalItbis} 
          prefix="$"
          precision={2}
        />
        <TotalItem 
          title="Total Flete" 
          value={totalShipping} 
          prefix="$"
          precision={2}
        />
        <TotalItem 
          title="Total Otros Costos" 
          value={totalOtherCosts} 
          prefix="$"
          precision={2}
        />
   
        <GrandTotalItem 
          title="Gran Total" 
          value={grandTotal} 
          prefix="$"
          precision={2}
        />
   
      </Group>
    </StyledCard>
  )
}

export default TotalsSummary