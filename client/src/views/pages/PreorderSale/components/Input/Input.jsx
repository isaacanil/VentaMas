// src/components/ui/Input.jsx
import React from 'react';
import styled from 'styled-components';

const StyledInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #D1D5DB; /* border-gray-300 */
  border-radius: 0.375rem;
  font-size: 1rem;
  color: #1F2937; /* text-gray-900 */
  
  &:focus {
    outline: none;
    border-color: #3B82F6; /* focus:border-blue-500 */
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5); /* focus:shadow-outline-blue */
  }
`;

const Input = (props) => {
  return <StyledInput {...props} />;
};

export default Input;
