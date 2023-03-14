import React from 'react';
import { FaTag } from 'react-icons/fa';
import styled from 'styled-components';
import { Tooltip } from '../Button/Tooltip';



function StockIndicator({ stock, trackInventory }) {


    if (trackInventory) {
        
        return (
            <StockContainer trackInventory={trackInventory} stock={stock}>
                {/* <StockBox color={color} /> */}

            
                    {stock}
                    {!stock && 'sin stock'}
            

            </StockContainer>
        );
    } else {
        return (
            
                <StockContainer>
                    <span><FaTag /></span>
                </StockContainer>
       
        );
    }
}

export default StockIndicator;

const StockContainer = styled.div`
  display: flex;
  align-items: center;
  width: 60px;
  height: 2em;
    justify-content: space-between;
    padding: 0 0.4em;    
    border-radius: var(--border-radius-light);
    ${props => !props.stock && `
    white-space: nowrap;
    width: min-content;
    background-color: #ebebeb !important;
    color: #616161 !important;
    `}
    ${props => {
        switch (true) {
            case props.stock < 10:
                return `
          justify-content: right;
          background-color: rgb(255, 220, 220);
        `;
            case props.stock >= 10:
                return `
            justify-content: right;
            background-color: rgb(220, 255, 220);
            `;
            default:
                break;
        }
    }}
    ${props => {
        switch (!props.trackInventory) {
            case true:
                return `
          justify-content: right;
          background-color: transparent !important;
        `;

            default:
                break;
        }
    }}
   
    
`;

