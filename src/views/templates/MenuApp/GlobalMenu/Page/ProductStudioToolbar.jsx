import { faEllipsisV, faSitemap, faFileInvoice } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dropdown } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

const LeftContainer = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

const RightContainer = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
  }

  svg {
    font-size: 14px;
  }
`;

const ModeBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.35em 0.9em;
  border-radius: 999px;
  font-size: 0.75em;
  font-weight: 600;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.35);
`;

export const ProductStudioToolbar = ({
  side = 'left',
  isUpdateMode,
  navigationVisible,
  summaryVisible,
  onToggleNavigation,
  onToggleSummary,
}) => {
  const label = isUpdateMode ? 'Actualizando' : 'Creando';
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1200);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (side === 'left') {
    return (
      <LeftContainer>
        <ModeBadge>{label}</ModeBadge>
      </LeftContainer>
    );
  }

  if (side === 'right') {
    const menuItems = [
      {
        key: 'navigation',
        icon: <FontAwesomeIcon icon={faSitemap} />,
        label: navigationVisible ? 'Ocultar navegación' : 'Mostrar navegación',
        onClick: onToggleNavigation,
      },
    ];

    // Solo agregar opción de resumen en pantallas grandes
    if (!isMobile) {
      menuItems.push({
        key: 'summary',
        icon: <FontAwesomeIcon icon={faFileInvoice} />,
        label: summaryVisible ? 'Ocultar resumen' : 'Mostrar resumen',
        onClick: onToggleSummary,
      });
    }

    return (
      <RightContainer>
        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <DropdownButton>
            <FontAwesomeIcon icon={faEllipsisV} />
          </DropdownButton>
        </Dropdown>
      </RightContainer>
    );
  }

  return null;
};
