import React, { useState } from 'react'
import styled from 'styled-components'
import SaleUnitsManager from './components/SaleUnitsManager'
import PricingModal from './components/PricingModal'

const ConfigurationContainer = styled.div`

 
`
export const SaleUnitsConfig = () => {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState(null)

  const openPricingModal = (unit) => {
    setSelectedUnit(unit)
    setIsPricingModalOpen(true)
  }

  const closePricingModal = () => {
    setSelectedUnit(null)
    setIsPricingModalOpen(false)
  }
  


  return (
    <ConfigurationContainer>
      <SaleUnitsManager onShowPricingModal={openPricingModal} />
      <PricingModal
          visible={isPricingModalOpen}
          unit={selectedUnit}
          onClose={closePricingModal}
        />
  </ConfigurationContainer>
  )
}
