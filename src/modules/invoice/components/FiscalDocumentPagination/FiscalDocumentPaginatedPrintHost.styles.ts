import styled from 'styled-components';

export const HiddenHost = styled.div`
  position: fixed;
  inset-block-start: 0;
  inset-inline-start: -10000px;
  inline-size: 210mm;
  min-block-size: 297mm;
  overflow: visible;
  background: #fff;
  opacity: 0;
  pointer-events: none;
  visibility: visible;
  z-index: -1;
`;
