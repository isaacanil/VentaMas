import styled from 'styled-components';

interface ContainerProps {
  isMobile?: boolean;
}

export const Container = styled.div<ContainerProps>`
  display: flex;
  flex-direction: column;
  gap: ${({ isMobile }) => (isMobile ? '1rem' : '1.5rem')};
  height: ${({ isMobile }) => (isMobile ? '100%' : 'auto')};
`;

export const TitleRow = styled.span`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-weight: 600;
`;
