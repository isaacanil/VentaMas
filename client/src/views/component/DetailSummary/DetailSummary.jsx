import React from 'react'
import styled from 'styled-components';

export const DetailSummary = ({ items = [] }) => {
    return (
        <AccountSection>
            {
                items.map((item) => (
                    <InfoRow>
                        <Label>{item?.label}</Label>
                        <Value>{item?.value}</Value>
                    </InfoRow>
                ))
            }
        </AccountSection>
    )
}


  const AccountSection = styled.div`
   
      max-width: 500px;
      border-radius: 8px;
    padding:1.2em;
    background-color: white;

  `
const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  :not(:last-child){
        border-bottom: 1px solid #d7d7db;
      }

`;

const Label = styled.span`
  font-weight: 600;
  color: #333;
`;

const Value = styled.span`
  color: #555;
`;
