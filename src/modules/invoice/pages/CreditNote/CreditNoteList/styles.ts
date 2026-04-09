import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;

export const TableContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 1rem;
  overflow: hidden;
`;

export const CreditNoteConfigWarning = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 1em 2em;
  background-color: #f8f9fa;
`;

export const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background: white;
  border-bottom: 1px solid #f0f0f0;
`;

export const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 1.2em;
  font-weight: 600;
  color: #262626;
`;

export const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 480px;
  padding: 2.5em;
  margin: 0 auto;
  text-align: center;
  background-color: white;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 5%);
`;

export const EmptyStateIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 1.5em;
  font-size: 24px;
  color: #f5a623;
  background-color: #fffbe6;
  border-radius: 50%;
`;

export const EmptyStateTitle = styled.h3`
  margin: 0;
  margin-bottom: 0.6em;
  font-size: 1.4em;
  font-weight: 600;
  color: #262626;
`;

export const EmptyStateSubDescription = styled.p`
  max-width: 380px;
  margin: 0 0 1.5em;
  font-size: 1rem;
  font-weight: 500;
  color: #595959;
`;

export const EmptyStateDescription = styled.p`
  margin: 0 0 2em;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #8c8c8c;
`;

export const ConfigButton = styled.button`
  padding: 0.8em 1.8em;
  font-size: 0.95rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  background-color: #1890ff;
  border: none;
  border-radius: 8px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #40a9ff;
  }
`;
