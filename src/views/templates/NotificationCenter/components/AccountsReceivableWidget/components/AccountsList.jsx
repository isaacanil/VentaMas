import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { formatNumber } from '../../../../../../utils/formatNumber';
import HorizontalAccountItem from './HorizontalAccountItem';

const AccountsList = ({ 
  allAccounts, 
  containerRef, 
  scrollContainerRef, 
  scrollPosition, 
  scrollLeft, 
  scrollRight, 
  canScrollLeft, 
  canScrollRight, 
  handleAccountClick 
}) => {
  return (
    <AccountsContainer>
      {/* Header con navegación solo si hay múltiples elementos */}
      {allAccounts.length > 3 && (
        <AccountsHeader>
          <ItemsCount>
            {formatNumber(allAccounts.length)} cuenta{allAccounts.length > 1 ? 's' : ''}
          </ItemsCount>
          <NavigationControls>
            <NavButton 
              onClick={scrollLeft} 
              disabled={!canScrollLeft}
              title="Anterior"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </NavButton>
            <NavButton 
              onClick={scrollRight} 
              disabled={!canScrollRight}
              title="Siguiente"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </NavButton>
          </NavigationControls>
        </AccountsHeader>
      )}

      <HorizontalScrollContainer ref={containerRef}>
        <HorizontalItemsContainer 
          ref={scrollContainerRef}
          style={{ transform: `translateX(-${scrollPosition}px)` }}
        >
          {allAccounts.map((account, index) => (
            <HorizontalAccountItem 
              key={`${account.id}-${index}`} 
              account={account} 
              onClick={() => handleAccountClick && handleAccountClick(account)} 
            />
          ))}
        </HorizontalItemsContainer>
      </HorizontalScrollContainer>
    </AccountsContainer>
  );
};

const AccountsContainer = styled.div`
  padding: 0 24px 24px 24px;
`;

const AccountsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1em 0 0;
  margin-bottom: 16px;
  min-height: 20px;
`;

const ItemsCount = styled.div`
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  align-self: flex-start;
`;

const NavigationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
  color: #6b7280;

  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
    color: #374151;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: #f9fafb;
  }
`;

const HorizontalScrollContainer = styled.div`
  overflow: hidden;
  position: relative;
  margin: 0 -8px;
`;

const HorizontalItemsContainer = styled.div`
  display: flex;
  gap: 16px;
  padding: 0 8px;
  transition: transform 0.3s ease;
  will-change: transform;
`;

export default AccountsList;
