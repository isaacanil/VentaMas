import styled from 'styled-components';

export const Wrapper = styled.div`
  height: 100%;
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 8px;
  overflow: hidden;
`;

export const Header = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 0 1em;

  .search-container {
    flex: 1;
  }
`;

export const ProvidersContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  padding: 0 1em;
  overflow-y: auto;
  align-content: start;
`;

export const ProviderCard = styled.div`
  background-color: ${(props) => (props.$isSelected ? '#e6f7ff' : 'white')};
  border: 1px solid ${(props) => (props.$isSelected ? '#1890ff' : '#e8e8e8')};
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .actions {
    color: #8c8c8c;
    padding: 4px;
    border-radius: 4px;

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
  }

  .name {
    font-size: 14px;
    font-weight: 500;
    color: #262626;
  }

  .rnc {
    font-size: 12px;
    color: #8c8c8c;
  }
`;

export const ProviderInfo = styled.div`
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 0.4em 0.6em 0.6em;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #40a9ff;
  }

  &.empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8c8c8c;
    min-height: 100px;
  }

  .provider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;

    .change-indicator {
      color: #8c8c8c;
      font-size: 14px;
    }
  }

  .provider-name {
    font-size: 16px;
    font-weight: 500;
    color: #262626;
  }

  .provider-details {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1.3em;
    font-size: 14px;
    line-height: 1.1pc;
    color: #595959;
  }

  .detail-item {
    gap: 4px;
  }

  .detail-label {
    color: #40a9ff;
    font-size: 12px;
  }
`;
