
import React from 'react';
import styled from 'styled-components';
import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

const Section = styled.div`
  margin-top: 24px;
`;

const SectionHeader = styled.div`
  margin-bottom: 16px;
`;

const ConfigGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const BillingSection = ({ title, description, children }) => {
  return (
    <Section>
      <SectionHeader>
        <Title level={4}>{title}</Title>
        <Paragraph>{description}</Paragraph>
      </SectionHeader>
      <ConfigGroup>
        {children}
      </ConfigGroup>
    </Section>
  );
};

export default BillingSection;