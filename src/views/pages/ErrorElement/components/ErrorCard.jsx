import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Card } from 'antd';
import { motion } from 'framer-motion';

export const ErrorCard = ({ children }) => {
    return (
        <StyledCard>
            {children}
        </StyledCard>
    );
};

ErrorCard.propTypes = {
    children: PropTypes.node.isRequired,
};

const StyledCard = styled.div`
    max-width: 600px;
    width: 100%;
    border-radius: 8px;
    padding: 2rem;
    height: 100%;
    max-height: none;
`;
