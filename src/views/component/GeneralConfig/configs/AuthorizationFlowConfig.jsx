import React from 'react';
import styled from 'styled-components';
import { Typography } from 'antd';
import AuthorizationFlowSettingsSection from './components/AuthorizationFlowSettingsSection';

const { Title, Paragraph } = Typography;

const Page = styled.div`
  display: grid;
  gap: 1.6em;
  padding: 1em;
`;

const Head = styled.div`
  display: grid;
  width: 100%;
`;

const Heading = styled(Title).attrs({ level: 3 })`
  && {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 600;
  }
`;

const Description = styled(Paragraph)`
  && {
    margin: 0;
    font-size: 16px;
    line-height: 1.5;
    color: rgba(0, 0, 0, 0.65);
  }
`;

const AuthorizationFlowConfig = () => {
  return (
    <Page>
      <Head>
        <Heading>Flujo de Autorizaciones</Heading>
        <Description>
          Define cómo se gestionan las aprobaciones con PIN en todo el sistema.
        </Description>
      </Head>

      <AuthorizationFlowSettingsSection />
    </Page>
  );
};

export default AuthorizationFlowConfig;
