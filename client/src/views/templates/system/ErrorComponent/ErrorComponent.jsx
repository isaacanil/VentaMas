import React from 'react'
import styled from 'styled-components';

const ErrorText = styled.div`
    font-size: 1em;
    display: grid;
    gap: 0.4em;
    
  

  
    overflow: auto;
    padding: 8px;

    & > p {
        height: 2em;
        display: flex;
        align-items: center;
        justify-content: center;
        ${({ error }) => error && `
        background-color: var(--color-danger-light);
        color: var(--color-danger-dark);
        border-radius: var(--border-radius);
        border: var(--border-danger);
        `}
    }
`;

export const ErrorComponent = ({ errors }) => {
    if (!errors) {
        return null;
    }

    return (
        <ErrorText error={errors.length > 0}>
          <p>{errors}</p>
        </ErrorText>
    );
};


