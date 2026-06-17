import styled from 'styled-components';

export const HighlightCard = styled.div<{
  $bg?: string;
  $border?: string;
  $iconColor?: string;
}>`
  background: ${(props: { $bg?: string }) => props.$bg || '#f9f9f9'};
  border: 1px solid
    ${(props: { $border?: string }) => props.$border || '#f0f0f0'};
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  color: #262626;

  .icon-area {
    font-size: 24px;
    color: ${(props: { $iconColor?: string }) => props.$iconColor || '#8c8c8c'};
    margin-top: 2px;
  }

  .content-area {
    flex: 1;
  }

  .title {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 4px;
    color: #262626;
  }

  .subtitle {
    color: #8c8c8c;
    font-size: 13px;
  }
`;
