import {
  faUser,
  faShieldAlt,
  faKey,
  faEnvelope,
  faLanguage,
  faGlobe,
  faThumbsUp,
  faCog,
  faDatabase,
  faServer,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';

import { Nav } from '@/views/templates/system/Nav/Nav';

export default function SettingsExample() {
  const [activeTab, setActiveTab] = useState('profile');

  // Ejemplo de menú con algunos elementos agrupados y otros no
  const menuItems = [
    // Elementos no agrupados
    {
      key: 'profile',
      icon: <FontAwesomeIcon icon={faUser} />,
      label: 'Perfil',
    },
    {
      key: 'preferences',
      icon: <FontAwesomeIcon icon={faThumbsUp} />,
      label: 'Preferencias',
    },

    // Elementos agrupados - Seguridad (2 elementos relacionados, se agruparán)
    {
      key: 'security',
      icon: <FontAwesomeIcon icon={faShieldAlt} />,
      label: 'Configuración de Seguridad',
      group: 'security',
      groupLabel: 'Seguridad',
      groupIcon: <FontAwesomeIcon icon={faShieldAlt} />,
    },
    {
      key: 'password',
      icon: <FontAwesomeIcon icon={faKey} />,
      label: 'Cambiar Contraseña',
      group: 'security',
      groupLabel: 'Seguridad',
      groupIcon: <FontAwesomeIcon icon={faShieldAlt} />,
    },

    // Elementos agrupados - Notificaciones (solo 1 elemento, NO se agrupará)
    {
      key: 'email',
      icon: <FontAwesomeIcon icon={faEnvelope} />,
      label: 'Notificaciones por Email',
      group: 'notification',
      groupLabel: 'Notificaciones',
      groupIcon: <FontAwesomeIcon icon={faEnvelope} />,
    },

    // Elementos agrupados - Idioma (solo 1 elemento, NO se agrupará)
    {
      key: 'language',
      icon: <FontAwesomeIcon icon={faLanguage} />,
      label: 'Idioma',
      group: 'localization',
      groupLabel: 'Localización',
      groupIcon: <FontAwesomeIcon icon={faGlobe} />,
    },

    // Elementos agrupados - Sistema (3 elementos relacionados, se agruparán)
    {
      key: 'system',
      icon: <FontAwesomeIcon icon={faCog} />,
      label: 'Configuración del Sistema',
      group: 'system',
      groupLabel: 'Sistema',
      groupIcon: <FontAwesomeIcon icon={faCog} />,
    },
    {
      key: 'database',
      icon: <FontAwesomeIcon icon={faDatabase} />,
      label: 'Base de Datos',
      group: 'system',
      groupLabel: 'Sistema',
      groupIcon: <FontAwesomeIcon icon={faCog} />,
    },
    {
      key: 'server',
      icon: <FontAwesomeIcon icon={faServer} />,
      label: 'Servidor',
      group: 'system',
      groupLabel: 'Sistema',
      groupIcon: <FontAwesomeIcon icon={faCog} />,
    },
  ];

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // Renderizar el contenido según la pestaña seleccionada
  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <div>Contenido de Perfil</div>;
      case 'preferences':
        return <div>Contenido de Preferencias</div>;
      case 'security':
        return <div>Contenido de Seguridad</div>;
      case 'password':
        return <div>Contenido de Cambiar Contraseña</div>;
      case 'email':
        return <div>Contenido de Notificaciones por Email</div>;
      case 'language':
        return <div>Contenido de Idioma</div>;
      case 'system':
        return <div>Contenido de Configuración del Sistema</div>;
      case 'database':
        return <div>Contenido de Base de Datos</div>;
      case 'server':
        return <div>Contenido de Servidor</div>;
      default:
        return <div>Seleccione una opción del menú</div>;
    }
  };

  return (
    <Nav
      menuItems={menuItems}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      title="Configuraciones"
    >
      {renderContent()}
    </Nav>
  );
}
