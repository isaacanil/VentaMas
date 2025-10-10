import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

export const BusinessName = ({ businessName }) => {
  return <StyledBusinessName>{businessName || 'Tu Negocio'}</StyledBusinessName>;
};

BusinessName.propTypes = {
  businessName: PropTypes.string,
};

const StyledBusinessName = styled.h2`
  font-size: 1rem;
  font-weight: 500;
  font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--color-gray-500, #718096);
  margin: 0;
  letter-spacing: -0.3px;
  opacity: 0.9;
  padding-left: 2px;
  
  /* Add subtle gradient background to the text */
  background-image: linear-gradient(45deg, var(--color-gray-600, #4a5568), var(--color-gray-500, #718096));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0px 1px 1px rgba(255, 255, 255, 0.5);
`;