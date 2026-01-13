import React from 'react';
import styled from 'styled-components';

import logo from './ventamax.svg';

const imgSize = {
  xsmall: '1.5rem',
  small: '3rem',
  badge: '3.25rem',
  medium: '5rem',
  large: '6rem',
  xlarge: '10rem',
  xxlarge: '12rem',
};

type LogoSize = keyof typeof imgSize;

type LogoProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  size?: LogoSize;
  customSize?: string;
};

export const Logo = ({
  size = 'medium',
  customSize,
  className,
  alt = '',
  ...imgProps
}: LogoProps) => {
  const resolvedSize = customSize ?? imgSize[size] ?? imgSize.medium;

  return (
    <Img
      src={logo}
      alt={alt}
      className={className}
      $dimension={resolvedSize}
      {...imgProps}
    />
  );
};

const Img = styled.img<{ $dimension: string }>`
  display: block !important;
  width: ${({ $dimension }: { $dimension: string }) => $dimension} !important;
  height: ${({ $dimension }: { $dimension: string }) => $dimension} !important;
`;
