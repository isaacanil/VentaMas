import React from 'react';
import styled from 'styled-components';

const StyledInput = styled.input`
  border: 1px solid #ccc;
  border-radius: 4px;
  height: 2em;
  width: 100%;
  font-size: 16px;
  margin-bottom: 10px;
`;

const StyledLabel = styled.label`
  font-size: 14px;
  display: block;
`;

export const Input = ({ label, placeholder, title, onClick, onChange, ...props }) => {
    return (
        <div>
            {label && <StyledLabel>{label}</StyledLabel>}
            <StyledInput
                placeholder={placeholder}
                title={title}
                onClick={onClick}
                onChange={onChange}
                {...props}
            />
        </div>
    );
};

