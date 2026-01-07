// @ts-nocheck
// BusinessPill component - combines logo and business name
import styled from 'styled-components';

import type { JSX } from 'react';

interface BusinessPillProps {
  logoUrl?: string | null;
  businessName?: string | null;
}

export const BusinessPill = ({
  logoUrl,
  businessName,
}: BusinessPillProps): JSX.Element => {
  return (
    <BusinessPillContainer>
      {logoUrl && (
        <LogoContainer>
          <BusinessLogo src={logoUrl} alt="Logo" />
        </LogoContainer>
      )}
      <BusinessNameText>{businessName || 'Tu Negocio'}</BusinessNameText>
    </BusinessPillContainer>
  );
};

const BusinessPillContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 6px 20px 6px 6px;
  background-color: rgb(255 255 255);
  border-radius: 100px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 8%);
`;

const LogoContainer = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  max-width: 60px;

  /* max-height: 40px; */
  height: 50px;
  margin-right: 16px;
  overflow: hidden;
  background-color: white;
  border-radius: 8px;
`;

const BusinessLogo = styled.img`
  width: 100%;
  max-width: 100%;
  height: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const BusinessNameText = styled.h2`
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family:
    'SF Pro Display',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-gray-700, #4a5568);
  letter-spacing: -0.3px;
  white-space: nowrap;
`;
