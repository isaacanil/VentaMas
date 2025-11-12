import { SettingOutlined } from '@ant-design/icons';
import { Card, List } from 'antd';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import ROUTES_NAME from '../../../routes/routesName';
import { MenuApp } from '../../templates/MenuApp/MenuApp';

const AppConfig = () => {
  const navigate = useNavigate();
  const configOptions = [
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
        showBackButton={true}
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
          renderItem={(item) => (
            <List.Item>
              <Link to={item.route}>
                <StyledCard hoverable>
                  <Card.Meta
                    title={item.title}
                    description={item.description}
                  />
                </StyledCard>
              </Link>
            </List.Item>
          )}
        />
      </ContentWrapper>
    </PageWrapper>
  );
};

const PageWrapper = styled.div`
  min-height: 100vh;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const StyledCard = styled(Card)`
  height: 100%;
  .ant-card-meta-title {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }
  .ant-card-meta-description {
    color: rgba(0, 0, 0, 0.45);
    line-height: 1.5;
  }
`;

export default AppConfig;
