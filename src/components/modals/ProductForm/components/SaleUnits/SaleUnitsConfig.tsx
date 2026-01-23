import React, { useState } from 'react';
import styled from 'styled-components';

import PricingModal from './components/PricingModal';
import SaleUnitsManager from './components/SaleUnitsManager';
import type { SaleUnitRecord } from './components/SaleUnit';

const ConfigurationContainer = styled.div``;
export const SaleUnitsConfig = () => {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<SaleUnitRecord | null>(null);

  const openPricingModal = (unit: SaleUnitRecord) => {
    setSelectedUnit(unit);
    setIsPricingModalOpen(true);
  };

  const closePricingModal = () => {
    setSelectedUnit(null);
    setIsPricingModalOpen(false);
  };

  return (
    <ConfigurationContainer>
      <SaleUnitsManager onShowPricingModal={openPricingModal} />
      <PricingModal
        visible={isPricingModalOpen}
        unit={selectedUnit}
        onClose={closePricingModal}
      />
    </ConfigurationContainer>
  );
};
