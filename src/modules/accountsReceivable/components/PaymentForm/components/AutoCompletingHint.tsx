import styled from 'styled-components';

export const AutoCompletingHint = () => (
  <HintContainer>Generando factura automática desde la preventa...</HintContainer>
);

const HintContainer = styled.div`
  padding: 10px 12px;
  border-radius: 8px;
  background: #e6f4ff;
  color: #0958d9;
  font-weight: 500;
`;
