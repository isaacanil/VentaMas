import { Alert, Typography } from 'antd';
import React from 'react';

import { MenuApp } from '../../templates/MenuApp/MenuApp';

const { Title, Paragraph, Text } = Typography;

/**
 * Contenedor simple para agrupar herramientas o experimentos temporales.
 * Mantiene la ruta `/prueba` disponible exclusivamente para ensayos manuales.
 */
export default function TestPlayground() {
  return (
    <>
      <MenuApp sectionName="Zona de pruebas" />
      <div style={{ padding: 24 }}>
        <Title level={3} style={{ marginBottom: 8 }}>
          Zona de pruebas
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 16 }}>
          Usa este espacio para validar integraciones, componentes o flujos en desarrollo.
          Los accesos visibles aquí son temporales y pueden cambiar sin previo aviso.
        </Paragraph>
        <Alert
          type="info"
          showIcon
          message="Recomendación"
          description={
            <Text>
              Registra brevemente los objetivos de la prueba y elimina cualquier estado temporal una vez concluido
              para evitar confusiones en el equipo.
            </Text>
          }
        />
      </div>
    </>
  );
}
