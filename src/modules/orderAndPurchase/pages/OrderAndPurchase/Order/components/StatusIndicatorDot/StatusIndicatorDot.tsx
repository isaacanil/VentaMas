import styled from 'styled-components';

interface StatusIndicatorDotProps {
  color?: string;
}

export const StatusIndicatorDot = ({ color }: StatusIndicatorDotProps) => {
  return <Container $color={color} />;
};

const Container = styled.div<{ $color?: string }>`
  width: 1.2em;
  height: 0.6em;
  background-color: ${({ $color }) => $color || 'transparent'};
  border-radius: 10px;
`;
