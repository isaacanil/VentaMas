import styled from 'styled-components';

type IconButtonStyleProps = { $color: string; $hoverColor: string };

export const IconButton = styled.button<IconButtonStyleProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  font-size: 20px;
  color: ${(props: IconButtonStyleProps) => props.$color};
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 6px;
  transition: all 0.3s;

  &:hover {
    color: ${(props: IconButtonStyleProps) => props.$hoverColor};
    background-color: #f5f5f5;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;
