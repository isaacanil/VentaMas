// @ts-nocheck
import { Typography } from 'antd';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';

const { Title, Paragraph } = Typography;

export const ErrorDetails = ({ errorStackTrace, variants }) => {
  return (
    <Container variants={variants}>
      <Title level={5}>Detalles del error:</Title>
      <ErrorCode>
        <Paragraph copyable code>
          {errorStackTrace}
        </Paragraph>
      </ErrorCode>
    </Container>
  );
};

ErrorDetails.propTypes = {
  errorStackTrace: PropTypes.string,
  variants: PropTypes.object,
};

const Container = styled(motion.div)`
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
`;

const ErrorCode = styled.div`
  max-height: 200px;
  padding: 1rem;
  overflow-y: auto;
  background: #f0f2f5;
  border-radius: 4px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
`;
