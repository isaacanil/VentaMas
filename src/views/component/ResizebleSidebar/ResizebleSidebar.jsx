// src/components/ResizableSidebar.js
import styled from 'styled-components';
import 'react-resizable/css/styles.css'; // Importar estilos básicos para el resizer

const Container = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  height: 100%;
  overflow-y: hidden;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  /* background-color: #ffffff; */

  // padding: 0.4em 0;
  height: 100%;
`;

const ResizeContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%; /* Asegura que el contenedor de redimensionado ocupe el 100% de la altura */
  overflow-y: auto;
`;

export const ResizableSidebar = ({ Sidebar, children }) => {
  return (
    <Container>
      <ResizeContainer>{Sidebar}</ResizeContainer>
      <Content>{children}</Content>
    </Container>
  );
};
