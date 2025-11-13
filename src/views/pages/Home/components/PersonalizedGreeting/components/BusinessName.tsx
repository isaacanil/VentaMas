import styled from 'styled-components';

import type { JSX } from 'react';

type BusinessNameProps = {
  businessName?: string | null;
};

export const BusinessName = ({
  businessName,
}: BusinessNameProps): JSX.Element => {
  return (
    <StyledBusinessName>{businessName || 'Tu Negocio'}</StyledBusinessName>
  );
};

const StyledBusinessName = styled.h2`
  padding-left: 2px;
  margin: 0;
  font-family:
    'SF Pro Text',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-gray-500, #718096);
  color: transparent;
  letter-spacing: -0.3px;
  text-shadow: 0 1px 1px rgb(255 255 255 / 50%);

  /* Add subtle gradient background to the text */
  background-image: linear-gradient(
    45deg,
    var(--color-gray-600, #4a5568),
    var(--color-gray-500, #718096)
  );
  background-clip: text;
  opacity: 0.9;
`;
