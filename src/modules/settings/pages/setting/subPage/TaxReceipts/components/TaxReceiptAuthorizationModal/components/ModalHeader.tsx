import { Typography } from 'antd';
import styled from 'styled-components';

const { Title, Text } = Typography;

export const ModalHeader = () => {
  return (
    <HeaderContainer>
      <div>
        <Title level={4}>Registro de Autorizacion de Comprobantes</Title>
        <Text type="secondary">
          Registra una nueva autorizacion de comprobantes fiscales emitida por
          la DGI
        </Text>
      </div>
    </HeaderContainer>
  );
};

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
