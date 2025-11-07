// BusinessPill component - combines logo and business name
import type { JSX } from 'react';
import styled from 'styled-components';

type BusinessPillProps = {
  logoUrl?: string | null;
  businessName?: string | null;
};

export const BusinessPill = ({ logoUrl, businessName }: BusinessPillProps): JSX.Element => {
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
  background-color: rgb(255, 255, 255);
  border-radius: 100px;
  padding: 6px 20px 6px 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
`;

const LogoContainer = styled.div`
  max-width: 60px;
  /* max-height: 40px; */
  height: 50px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  background-color: white;
  flex-shrink: 0;
`;

const BusinessLogo = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-width: 100%;
  max-height: 100%;
`;

const BusinessNameText = styled.h2`
  font-size: 0.95rem;
  font-weight: 600;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--color-gray-700, #4a5568);
  margin: 0;
  letter-spacing: -0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
