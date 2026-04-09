import { SettingOutlined } from '@/constants/icons/antd';
import { Card, List } from 'antd';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import ROUTES_NAME from '@/router/routes/routesName';
import { PageShell } from '@/components/layout/PageShell';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

interface ConfigOption {
  title: string;
  description: string;
  route: string;
}

const renderConfigOption = (item: ConfigOption) => (
  <List.Item>
    <Link to={item.route}>
      <StyledCard hoverable>
        <Card.Meta title={item.title} description={item.description} />
      </StyledCard>
    </Link>
  </List.Item>
);

const AppConfig: React.FC = () => {
  const navigate = useNavigate();
  const configOptions: ConfigOption[] = [
    {
      title: 'Imagen de Login',
      description:
        'Configurar la imagen que se muestra en la página de inicio de sesión',
      route: ROUTES_NAME.DEV_VIEW_TERM.APP_CONFIG.LOGIN_IMAGE,
    },
    // Aquí puedes agregar más opciones de configuración en el futuro
  ];

  return (
    <PageWrapper>
      <MenuApp
        sectionName="Configuración de App"
        sectionNameIcon={<SettingOutlined />}
        onBackClick={() => navigate(-1)}
      />
      <ContentWrapper>
        <List
          grid={{
            gutter: 16,
            xs: 1,
            sm: 1,
            md: 2,
            lg: 2,
            xl: 3,
            xxl: 3,
          }}
          dataSource={configOptions}
          renderItem={renderConfigOption}
        />
      </ContentWrapper>
    </PageWrapper>
  );
};

const PageWrapper = styled(PageShell)``;

const ContentWrapper = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  max-width: 1200px;
  padding: 0 1rem;
  margin: 2rem auto;
`;

const StyledCard = styled(Card)`
  height: 100%;

  .ant-card-meta-title {
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
  }

  .ant-card-meta-description {
    line-height: 1.5;
    color: rgb(0 0 0 / 45%);
  }
`;

export default AppConfig;
