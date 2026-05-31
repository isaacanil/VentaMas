import styled from 'styled-components';

type PanelStyleProps = {
  $dimmed?: boolean;
};

export const PanelRoot = styled.div`
  position: relative;
`;

export const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(255 255 255 / 80%);
`;

export const LoadingSpacer = styled.div`
  width: 140px;
  height: 96px;
`;

export const Panel = styled.div<PanelStyleProps>`
  padding: 1em;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
  opacity: ${(props) => (props.$dimmed ? 0.6 : 1)};
`;
