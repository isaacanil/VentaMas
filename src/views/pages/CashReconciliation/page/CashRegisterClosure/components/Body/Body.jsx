import React, { useState, useEffect } from 'react'
import styled from 'styled-components'

import { LeftSide } from './LeftSide/LeftSide'
import { RightSide } from './RightSide/RightSide'

export const Body = ({closingDate}) => {
  const [calculationIsOpen, setCalculationIsOpen] = useState(true)
  const [isNarrowScreen, setIsNarrowScreen] = useState(false)
  const [activeSide, setActiveSide] = useState('leftSide') // 'leftSide' or 'rightSide'

  // Check screen width on mount and when resized
  useEffect(() => {
    const checkScreenWidth = () => {
      setIsNarrowScreen(window.innerWidth < 768); // Adjust breakpoint as needed
    };
    
    checkScreenWidth();
    window.addEventListener('resize', checkScreenWidth);
    
    return () => {
      window.removeEventListener('resize', checkScreenWidth);
    };
  }, []);

  const toggleSide = () => {
    setActiveSide(activeSide === 'leftSide' ? 'rightSide' : 'leftSide');
  };
 
  return (
    <Container>
      {isNarrowScreen && (
        <PillToggle>
          <ToggleButton 
            active={activeSide === 'leftSide'} 
            onClick={() => setActiveSide('leftSide')}
          >
            Apertura
          </ToggleButton>
          <ToggleButton 
            active={activeSide === 'rightSide'} 
            onClick={() => setActiveSide('rightSide')}
          >
            Cierre
          </ToggleButton>
        </PillToggle>
      )}
      <Group narrow={isNarrowScreen}>
        {(!isNarrowScreen || activeSide === 'leftSide') && (
          <LeftSide
            calculationIsOpen={calculationIsOpen}
            setCalculationIsOpen={setCalculationIsOpen} 
          />
        )}
        {(!isNarrowScreen || activeSide === 'rightSide') && (
          <RightSide
            calculationIsOpen={calculationIsOpen}
            setCalculationIsOpen={setCalculationIsOpen} 
            date={closingDate}
          />
        )}
      </Group>
    </Container>
  )
}

const Container = styled.div`
    display: grid;
    gap: 0.4em;
`

const Group = styled.div`
  display: grid;
  gap: 3em;
  justify-content: space-between;
  grid-template-columns: ${props => props.narrow ? '1fr' : 'repeat(2, 1fr)'};
`

const PillToggle = styled.div`
  display: flex;
  background: #ffffff;
  border-radius: 30px;
  width: fit-content;
  padding: 4px;
  margin: 0 auto 0 auto;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`

const ToggleButton = styled.button`
  padding: 8px 16px;
  border-radius: 20px;
  border: none;
  background: ${props => props.active ? '#4285F4' : 'transparent'};
  color: ${props => props.active ? 'white' : '#333'};
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.active ? '#4285F4' : '#e0e0e0'};
  }

  &:focus {
    outline: none;
  }
`