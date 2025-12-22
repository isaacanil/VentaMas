import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => (props.isMobile ? '1rem' : '1.5rem')};
  height: ${(props) => (props.isMobile ? '100%' : 'auto')};
`;

export const TitleRow = styled.span`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-weight: 600;
`;
