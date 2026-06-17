import type { ReactNode } from 'react';
import 'react-resizable/css/styles.css';

import { Container, Content, ResizeContainer } from './ResizableSidebar.styles';

type ResizableSidebarProps = {
  Sidebar: ReactNode;
  children: ReactNode;
};

export const ResizableSidebar = ({
  Sidebar,
  children,
}: ResizableSidebarProps) => {
  return (
    <Container>
      <ResizeContainer>{Sidebar}</ResizeContainer>
      <Content>{children}</Content>
    </Container>
  );
};
