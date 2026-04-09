import { faRobot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Typography } from 'antd';
import React from 'react';

const { Title, Text } = Typography;

const EmptyState: React.FC = () => (
  <div style={{ textAlign: 'center', marginTop: '4rem', opacity: 0.5 }}>
    <FontAwesomeIcon
      icon={faRobot}
      style={{ fontSize: '64px', color: '#ccc', marginBottom: '1rem' }}
    />
    <Title level={3} style={{ color: '#999' }}>
      ¿En qué puedo ayudarte hoy?
    </Title>
    <Text type="secondary">Gestionar negocios, consultas generales, y más.</Text>
  </div>
);

export default EmptyState;
