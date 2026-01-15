import { useState, useRef, useMemo, useEffect } from 'react';
import styled from 'styled-components';

const SectionContainer = styled.div`
  padding: 16px;
  margin-bottom: 12px;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  margin-bottom: 12px;
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
  gap: 4px;
  align-items: center;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  cursor: pointer;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #b5b5b5;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  i {
    font-size: 14px;
    color: #595959;
  }
`;

const PageIndicator = styled.span`
  min-width: 40px;
  margin: 0 8px;
  font-size: 11px;
  color: #8c8c8c;
  text-align: center;
`;

const ContentContainer = styled.div`
  position: relative;
  overflow: hidden;
`;

const ScrollableContent = styled.div<{ offset: number }>`
  display: flex;
  transform: translateX(${({ offset }: { offset: number }) => offset}px);
  transition: transform 0.3s ease;
`;

const PageContainer = styled.div`
  flex-shrink: 0;
  min-width: 100%;
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
import type { ReactNode } from 'react';

interface NotificationSectionProps {
  title: string;
  pages?: unknown[];
  showNavigation?: boolean;
  renderPage?: (pageData: unknown, index: number) => ReactNode;
  itemsPerPage?: number;
  data?: unknown[];
  children?: ReactNode;
}

const NotificationSection = ({
  title,
  pages = [],
  showNavigation = true,
  renderPage,
  itemsPerPage = 3,
  data = [],
  children,
}: NotificationSectionProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);

  // Auto-dividir data en páginas si no se proporcionan páginas específicas
  const finalPages = useMemo(() => {
    if (pages.length > 0) return pages;
    if (data.length === 0) return [children];

    const chunks = [];
    for (let i = 0; i < data.length; i += itemsPerPage) {
      chunks.push(data.slice(i, i + itemsPerPage));
    }
    return chunks;
  }, [pages, data, itemsPerPage, children]);

  const totalPages = finalPages.length;

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth((containerRef.current as HTMLDivElement).offsetWidth);
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
              aria-label="Página anterior"
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
              aria-label="Página siguiente"
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
