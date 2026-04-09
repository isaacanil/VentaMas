import {
  faEllipsisV,
  faSitemap,
  faFileInvoice,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Dropdown, type MenuProps } from 'antd';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import type { ToolbarComponentProps } from '@/modules/navigation/components/MenuApp/GlobalMenu/types';

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
  gap: 8px;
  align-items: center;
  padding: 6px 12px;
  color: white;
  cursor: pointer;
  background: rgb(255 255 255 / 10%);
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: rgb(255 255 255 / 20%);
    border-color: rgb(255 255 255 / 40%);
  }

  svg {
    font-size: 14px;
  }
`;

interface ProductStudioToolbarProps extends ToolbarComponentProps {
  navigationVisible?: boolean;
  summaryVisible?: boolean;
  onToggleNavigation?: () => void;
  onToggleSummary?: () => void;
}

export const ProductStudioToolbar = ({
  side = 'left',
  navigationVisible,
  summaryVisible,
  onToggleNavigation,
  onToggleSummary,
}: ProductStudioToolbarProps) => {
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
    return <LeftContainer />;
  }

  if (side === 'right') {
    const menuItems: MenuProps['items'] = [
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
