// CombinedPill component - combines business and user information in a single pill
import { faBriefcase } from '@fortawesome/free-solid-svg-icons/faBriefcase';
import { faStore } from '@fortawesome/free-solid-svg-icons/faStore';
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

export const CombinedPill = ({ logoUrl, businessName, userName }) => {
  return (
    <PillContainer>
      <LogoContainer>
        {logoUrl ? (
          <BusinessLogo src={logoUrl} alt="Logo" />
        ) : (
          <BusinessIcon>
            <FontAwesomeIcon icon={faBriefcase} size="lg" />
          </BusinessIcon>
        )}
      </LogoContainer>
      <ContentContainer>
        <UserTextContainer>
          <UserIcon>
            <FontAwesomeIcon icon={faUser} />
          </UserIcon>
          <UserText>{userName}</UserText>
        </UserTextContainer>
        <BusinessNameContainer>
          <SmallBusinessIcon>
            <FontAwesomeIcon icon={faStore} size="xs" />
          </SmallBusinessIcon>
          <BusinessNameText>{businessName || 'Tu Negocio'}</BusinessNameText>
        </BusinessNameContainer>
      </ContentContainer>
    </PillContainer>
  );
};

CombinedPill.propTypes = {
  logoUrl: PropTypes.string,
  businessName: PropTypes.string,
  userName: PropTypes.string.isRequired,
};

const PillContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: rgb(255, 255, 255);
  border-radius: 100px;
  padding: 0.4em 1.5em 0.4em 1em;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  width: fit-content;
  min-width: 200px;
  max-width: 100%;
`;

const LogoContainer = styled.div`
  width: 50px;
  height: 50px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
  background-color: #ffffff;
  flex-shrink: 0;
`;

const BusinessLogo = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-width: 100%;
  max-height: 100%;
`;

const BusinessIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-400, #4299e1);
  width: 100%;
  height: 100%;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow: hidden;
`;

const UserTextContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const UserIcon = styled.div`
  display: flex;
  align-items: center;
  color: var(--color-primary-500, #4299e1);
  flex-shrink: 0;
`;

const UserText = styled.span`
  font-size: 1rem;
  font-weight: 600;
  line-height: 1;
  font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--color-primary-600, #3182ce);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const BusinessNameContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const SmallBusinessIcon = styled.div`
  display: flex;
  align-items: center;
  color: var(--color-gray-500, #718096);
  flex-shrink: 0;
`;

const BusinessNameText = styled.span`
  font-size: 0.8rem;
  font-weight: 500;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--color-gray-500, #718096);
  margin: 0;
  letter-spacing: -0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;


`;