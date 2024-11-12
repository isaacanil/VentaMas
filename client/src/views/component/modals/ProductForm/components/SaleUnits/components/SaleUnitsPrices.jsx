import React from 'react'
import { useSelector } from 'react-redux'
import { Card } from 'antd'
import styled from 'styled-components'
import { selectIsSoldInUnits, selectSelectedSaleUnit } from '../../../../../../../features/updateProduct/updateProductSlice'

const PricesContainer = styled.div`
  margin-top: 20px;
`

const SaleUnitsPrices = () => {
  const selectedSaleUnit = useSelector(selectSelectedSaleUnit)
  const isSoldInUnits = useSelector(selectIsSoldInUnits)

  if (!isSoldInUnits || !selectedSaleUnit) return null

  const { pricing } = selectedSaleUnit

  return (
    <PricesContainer>
      <Card title={`Precios para ${selectedSaleUnit.unitName}`}>
        <p>Costo: ${pricing.cost.toFixed(2)}</p>
        <p>Precio: ${pricing.price.toFixed(2)}</p>
        <p>Precio de Lista: ${pricing.listPrice.toFixed(2)}</p>
        <p>Precio Promedio: ${pricing.avgPrice.toFixed(2)}</p>
        <p>Precio Mínimo: ${pricing.minPrice.toFixed(2)}</p>
        <p>Impuesto: {pricing.tax}</p>
      </Card>
    </PricesContainer>
  )
}

export default SaleUnitsPrices
