import styled from 'styled-components';

export const ContextContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

export const ContextPanel = styled.div<{ background?: string }>`
  padding: 20px;
  background: ${(props: { background?: string }) =>
    props.background || '#ffffff'};
  border-radius: 12px;
  border: 1px solid #e8e8e8;

  .panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 14px;
    font-weight: 600;
    color: #262626;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .info-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 12px;
    font-size: 14px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .info-label {
    min-width: 100px;
    font-weight: 500;
    color: #8c8c8c;
  }

  .info-value {
    flex: 1;
    color: #262626;
    font-weight: 500;
  }

  .quick-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e8e8e8;
  }
`;

export const StyledTag = styled.span<{ color?: 'error' | 'info' }>`
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  height: 22px;
  font-size: 12px;
  border-radius: 4px;
  background-color: ${(props: { color?: 'error' | 'info' }) =>
    props.color === 'error' ? '#fff1f0' : '#e6f7ff'};
  color: ${(props: { color?: 'error' | 'info' }) =>
    props.color === 'error' ? '#ff4d4f' : '#1890ff'};
  border: 1px solid
    ${(props: { color?: 'error' | 'info' }) =>
      props.color === 'error' ? '#ffa39e' : '#91d5ff'};
  margin-left: 8px;
  white-space: nowrap;
`;
