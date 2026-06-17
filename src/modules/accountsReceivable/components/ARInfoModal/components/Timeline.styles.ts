import styled from 'styled-components';

export const TimelineContainer = styled.div`
  padding: 20px;
  background: #fafafa;
  border-radius: 12px;

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .timeline-title {
    font-size: 14px;
    font-weight: 600;
    color: #262626;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .timeline-info {
    font-size: 12px;
    color: #8c8c8c;
  }
`;

export const StyledProgress = styled.div`
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  margin-top: 12px;
  margin-bottom: 8px;
`;

export const StyledProgressBar = styled.div<{ percent: number }>`
  height: 100%;
  background-color: #52c41a;
  width: ${(props: { percent: number }) => props.percent}%;
  transition: width 0.3s ease;
  border-radius: 4px;
`;

export const StyledAlert = styled.div<{ type?: 'error' | 'info' | 'success' }>`
  padding: 12px 16px;
  background-color: ${(props: { type?: 'error' | 'info' | 'success' }) =>
    props.type === 'error'
      ? '#fff1f0'
      : props.type === 'info'
        ? '#e6f7ff'
        : '#f6ffed'};
  border: 1px solid
    ${(props: { type?: 'error' | 'info' | 'success' }) =>
      props.type === 'error'
        ? '#ffa39e'
        : props.type === 'info'
          ? '#91d5ff'
          : '#b7eb8f'};
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 16px;
  font-size: 14px;

  .alert-icon {
    color: ${(props: { type?: 'error' | 'info' | 'success' }) =>
      props.type === 'error'
        ? '#ff4d4f'
        : props.type === 'info'
          ? '#1890ff'
          : '#52c41a'};
    font-size: 16px;
    margin-top: 2px;
  }

  .alert-content {
    flex: 1;
  }

  .alert-message {
    font-weight: 600;
    color: #262626;
    margin-bottom: 4px;
  }

  .alert-description {
    font-size: 13px;
    color: #595959;
  }
`;
