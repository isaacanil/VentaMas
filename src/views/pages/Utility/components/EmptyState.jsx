import React from 'react';
import styled from 'styled-components';

export const EmptyState = ({ children }) => {
    return <Wrapper>{children}</Wrapper>;
};

const Wrapper = styled.div`
    padding: 2rem;
    text-align: center;
    color: #64748b;
    border: 1px dashed #cbd5f5;
    border-radius: 16px;
    background: #f8fafc;
`;
