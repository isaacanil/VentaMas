import styled, { css } from 'styled-components';

export const TransactionFieldGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1em;

  @media (width <= 768px) {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
`;

export const TransactionProductsSection = styled.div`
  margin-top: 2em;
  padding: 0;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  background-color: #fff;
  overflow: hidden;
`;

const sectionHeaderStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8pc;
  border-bottom: 1px solid #f0f0f0;

  .title {
    margin: 0;
    font-size: 1pc;
    font-weight: 600;
    color: #262626;
  }
`;

export const TransactionProductsHeader = styled.div`
  ${sectionHeaderStyles}
`;

export const TransactionCardHeader = styled.div`
  ${sectionHeaderStyles}
`;

export const TransactionFooterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.4em;
  margin-top: 1.4em;
`;

export const TransactionSectionCard = styled.div`
  height: 100%;
  padding: 0;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  background-color: #fff;
  overflow: hidden;
`;

export const TransactionSectionContent = styled.div`
  padding: 1.2pc;
`;
