import { SettingOutlined } from '@/constants/icons/antd';
import { Card, List } from 'antd';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { PageShell } from '@/components/layout/PageShell';
import { MenuApp } from '@/modules/navigation/public';

import { APP_CONFIG_OPTIONS, type ConfigOption } from './AppConfig.options';
import { ContentWrapper, StyledCard } from './AppConfig.styles';

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

  return (
    <PageShell>
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
          dataSource={APP_CONFIG_OPTIONS}
          renderItem={renderConfigOption}
        />
      </ContentWrapper>
    </PageShell>
  );
};

export default AppConfig;
