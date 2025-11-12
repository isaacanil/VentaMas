import React from 'react';
import styled from 'styled-components';

const SectionContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 12px;
  border: 1px solid #f0f0f0;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f5f5f5;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #262626;
`;

const NavigationContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #b5b5b5;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  i {
    font-size: 14px;
    color: #595959;
  }
`;

const PageIndicator = styled.span`
  font-size: 11px;
  color: #8c8c8c;
  margin: 0 8px;
  min-width: 40px;
  text-align: center;
`;

const ContentContainer = styled.div`
  overflow: hidden;
  position: relative;
`;

const ScrollableContent = styled.div`
  display: flex;
  transition: transform 0.3s ease;
  transform: translateX(${(props) => props.offset}px);
`;

const PageContainer = styled.div`
  min-width: 100%;
  flex-shrink: 0;
`;

/**
 * Componente reutilizable para secciones del NotificationCenter
 * @param {string} title - Título de la sección
 * @param {Array} pages - Array de contenido para cada página
 * @param {boolean} showNavigation - Si mostrar controles de navegación
 * @param {function} renderPage - Función para renderizar cada página
 * @param {number} itemsPerPage - Elementos por página (para cálculo automático)
 * @param {Array} data - Datos para dividir automáticamente en páginas
 */
const NotificationSection = ({
  title,
  pages = [],
  showNavigation = true,
  renderPage,
  itemsPerPage = 3,
  data = [],
  children,
}) => {
  const [currentPage, setCurrentPage] = React.useState(0);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const containerRef = React.useRef(null);

  // Auto-dividir data en páginas si no se proporcionan páginas específicas
  const finalPages = React.useMemo(() => {
    if (pages.length > 0) return pages;
    if (data.length === 0) return [children];

    const chunks = [];
    for (let i = 0; i < data.length; i += itemsPerPage) {
      chunks.push(data.slice(i, i + itemsPerPage));
    }
    return chunks;
  }, [pages, data, itemsPerPage, children]);

  const totalPages = finalPages.length;

  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const goToNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const offset = -currentPage * containerWidth;

  return (
    <SectionContainer>
      <SectionHeader>
        <SectionTitle>{title}</SectionTitle>
        {showNavigation && totalPages > 1 && (
          <NavigationContainer>
            <NavButton
              onClick={goToPrevious}
              disabled={currentPage === 0}
              title="Anterior"
            >
              <i className="fas fa-chevron-left" />
            </NavButton>
            <PageIndicator>
              {currentPage + 1} / {totalPages}
            </PageIndicator>
            <NavButton
              onClick={goToNext}
              disabled={currentPage === totalPages - 1}
              title="Siguiente"
            >
              <i className="fas fa-chevron-right" />
            </NavButton>
          </NavigationContainer>
        )}
      </SectionHeader>

      <ContentContainer ref={containerRef}>
        <ScrollableContent offset={offset}>
          {finalPages.map((pageData, index) => (
            <PageContainer key={index}>
              {renderPage ? renderPage(pageData, index) : pageData}
            </PageContainer>
          ))}
        </ScrollableContent>
      </ContentContainer>
    </SectionContainer>
  );
};

export default NotificationSection;
