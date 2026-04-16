import { Typography } from 'antd';
import styled from 'styled-components';

const { Title, Text } = Typography;

export const ModalHeader = () => {
  return (
    <HeaderContainer>
      <div>
        <Title level={4}>Registrar secuencia autorizada</Title>
        <Text type="secondary">
          Carga el rango aprobado por DGII para la serie seleccionada y deja
          trazabilidad del cambio.
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
