import styled from 'styled-components';

export const Notice = styled.div<{ $tone: 'warning' | 'info' }>`
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border: 1px solid
    ${(p) =>
      p.$tone === 'warning' ? 'rgb(217 119 6 / 20%)' : 'rgb(14 165 233 / 20%)'};
  border-radius: 12px;
  background: ${(p) =>
    p.$tone === 'warning' ? 'rgb(255 251 235)' : 'rgb(240 249 255)'};
`;

export const NoticeText = styled.p`
  margin: 0;
  color: #374151;
  font-size: 0.9rem;
  line-height: 1.5;
`;
