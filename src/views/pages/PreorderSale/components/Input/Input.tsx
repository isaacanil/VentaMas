// @ts-nocheck
// src/components/ui/Input.tsx
import React from 'react';
import styled from 'styled-components';

const StyledInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  color: #1f2937; /* text-gray-900 */
  border: 1px solid #d1d5db; /* border-gray-300 */
  border-radius: 0.375rem;

  &:focus {
    outline: none;
    border-color: #3b82f6; /* focus:border-blue-500 */
    box-shadow: 0 0 0 3px rgb(59 130 246 / 50%); /* focus:shadow-outline-blue */
  }
`;

const Input = (props) => {
  return <StyledInput {...props} />;
};

export default Input;
