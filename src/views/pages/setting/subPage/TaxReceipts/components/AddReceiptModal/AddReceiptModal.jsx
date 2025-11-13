import { ExclamationCircleOutlined } from '@ant-design/icons';
import {
  Drawer,
  Select,
  Card,
  Button,
  Tooltip,
  message,
  Badge,
  Typography,
} from 'antd';
import React, { useState, useEffect } from 'react';
// Importar Redux y la función para agregar a Firebase
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../../features/auth/userSlice';
import { addTaxReceipt } from '../../../../../../../firebase/taxReceipt/addTaxReceipt'; // Asumiendo que esta función existe
import {
  countryComprobantes,
  getAvailableCountries,
} from '../../../../../../../firebase/taxReceipt/taxReceiptTemplates';

const { Option } = Select;
const { Title, Text } = Typography;

/**
 * Drawer para agregar comprobantes predefinidos según el país
 */
const AddReceiptDrawer = ({ visible, onCancel, existingReceipts = [] }) => {
  const [selectedCountry, setSelectedCountry] = useState('DO'); // República Dominicana por defecto
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const countries = getAvailableCountries();
  const user = useSelector(selectUser); // Obtener el usuario del estado de Redux

  // Crear conjuntos de nombres y series existentes para rápida verificación
  const existingNames = new Set(
    existingReceipts.map((receipt) => receipt.data?.name || ''),
  );
  const existingSeries = new Set(
    existingReceipts.map((receipt) => receipt.data?.serie || ''),
  );

  // Limpiar selecciones cuando se cierra el drawer
  useEffect(() => {
    if (!visible) {
      setSelectedTemplates([]);
    }
  }, [visible]);

  // Función para verificar si un comprobante ya existe
  const isTemplateExisting = (template) => {
    return (
      existingNames.has(template.name) || existingSeries.has(template.serie)
    );
  };

  // Mensaje de por qué no se puede agregar un comprobante
  const getExistingReason = (template) => {
    if (existingNames.has(template.name))
      return `Ya existe un comprobante con el nombre "${template.name}"`;
    if (existingSeries.has(template.serie))
      return `Ya existe un comprobante con la serie "${template.serie}"`;
    return '';
  };

  // Función para manejar la selección/deselección de una plantilla
  const toggleTemplateSelection = (template) => {
    // No permitir seleccionar comprobantes que ya existen
    if (isTemplateExisting(template)) {
      message.error(getExistingReason(template));
      return;
    }

    const isSelected = selectedTemplates.some(
      (t) => t.name === template.name && t.serie === template.serie,
    );

    if (isSelected) {
      setSelectedTemplates(
        selectedTemplates.filter(
          (t) => t.name !== template.name || t.serie !== template.serie,
        ),
      );
    } else {
      setSelectedTemplates([...selectedTemplates, template]);
    }
  };

  // Función para verificar si una plantilla está seleccionada
  const isTemplateSelected = (template) => {
    return selectedTemplates.some(
      (t) => t.name === template.name && t.serie === template.serie,
    );
  };

  // Función para agregar los comprobantes seleccionados a Firebase
  const handleAddTemplates = async () => {
    if (selectedTemplates.length === 0) {
      message.warning('Por favor selecciona al menos un comprobante');
      return;
    }

    // Mostrar mensaje de carga
    const key = 'addingReceipts';
    message.loading({
      content: `Agregando ${selectedTemplates.length} comprobante(s)...`,
      key,
    });

    try {
      // Crear un array de promesas para agregar cada comprobante
      const addPromises = selectedTemplates.map((template) => {
        // Asegurarse de que 'disabled' sea false por defecto si no está definido
        const dataToAdd = {
          ...template,
          disabled: template.disabled === undefined ? false : template.disabled,
        };
        return addTaxReceipt(user, dataToAdd); // Llamar a la función de Firebase
      });

      // Esperar a que todas las promesas se resuelvan
      await Promise.all(addPromises);

      message.success({
        content: `${selectedTemplates.length} comprobante(s) agregado(s) correctamente.`,
        key,
        duration: 2,
      });
      setSelectedTemplates([]); // Limpiar selección
      onCancel(); // Cerrar el drawer
    } catch (error) {
      console.error('Error al agregar comprobantes predefinidos:', error);
      message.error({
        content:
          'Error al agregar los comprobantes. Por favor, inténtalo de nuevo.',
        key,
        duration: 3,
      });
    }
  };

  return (
    <Drawer
      title={
        <TitleContainer>
          <Title level={4}>Agregar Comprobantes por País</Title>
          <Text type="secondary">
            Selecciona los comprobantes fiscales predefinidos que deseas agregar
          </Text>
        </TitleContainer>
      }
      placement="bottom"
      onClose={onCancel}
      open={visible}
      width="100%"
      height="100%"
      footer={
        <FooterContainer>
          <SelectedCount>
            {selectedTemplates.length > 0 && (
              <Badge count={selectedTemplates.length} overflowCount={999}>
                <Text>Comprobantes seleccionados</Text>
              </Badge>
            )}
          </SelectedCount>
          <ButtonGroup>
            <Button onClick={onCancel}>Cancelar</Button>
            <Button
              type="primary"
              onClick={handleAddTemplates} // Usar la nueva función async
              disabled={selectedTemplates.length === 0}
            >
              Agregar
            </Button>
          </ButtonGroup>
        </FooterContainer>
      }
    >
      <Content>
        <SelectContainer>
          <label>Selecciona un país:</label>
          <Select
            value={selectedCountry}
            onChange={setSelectedCountry}
            style={{ width: '100%' }}
            size="large"
            dropdownMatchSelectWidth={false}
          >
            {countries.map((country) => (
              <Option key={country.code} value={country.code}>
                {country.name}
              </Option>
            ))}
          </Select>
        </SelectContainer>

        <TemplatesSection>
          <Title level={5}>
            Comprobantes disponibles para{' '}
            {countryComprobantes[selectedCountry].countryName}
          </Title>
          <TemplatesGrid>
            {countryComprobantes[selectedCountry].templates.map(
              (template, idx) => {
                const isExisting = isTemplateExisting(template);
                const selected = isTemplateSelected(template);
                return (
                  <TemplateCard
                    key={`${template.name}-${idx}`}
                    selected={selected}
                    disabled={isExisting}
                    onClick={() =>
                      !isExisting && toggleTemplateSelection(template)
                    }
                  >
                    {isExisting && (
                      <ExistingOverlay>
                        <ExclamationCircleOutlined /> Ya existe
                      </ExistingOverlay>
                    )}
                    <CardHeader selected={selected} disabled={isExisting}>
                      <h4>{template.name}</h4>
                      <small>
                        Tipo: {template.type} | Serie: {template.serie}
                      </small>
                    </CardHeader>
                    <CardBody>
                      <p>{template.description}</p>
                      <p>Secuencia: {template.sequence}</p>
                      <p>
                        Incremento: {template.increase} | Cantidad:{' '}
                        {template.quantity}
                      </p>
                    </CardBody>
                    <Tooltip
                      title={
                        isExisting
                          ? getExistingReason(template)
                          : selected
                            ? 'Quitar selección'
                            : 'Seleccionar'
                      }
                    >
                      <Button
                        type={selected ? 'primary' : 'default'}
                        disabled={isExisting}
                        block
                      >
                        {isExisting
                          ? 'No disponible'
                          : selected
                            ? 'Seleccionado'
                            : 'Seleccionar'}
                      </Button>
                    </Tooltip>
                  </TemplateCard>
                );
              },
            )}
          </TemplatesGrid>
        </TemplatesSection>
      </Content>
    </Drawer>
  );
};

// Estilos
const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const TitleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  h4 {
    margin-bottom: 0;
  }
`;

const SelectContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 16px;
    font-weight: 500;
  }
`;

const TemplatesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  h5 {
    margin: 0;
  }
`;

const TemplatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding-right: 8px;
`;

const TemplateCard = styled(Card)`
  position: relative;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  background-color: ${(props) => {
    if (props.disabled) return '#f5f5f5';
    return props.selected ? '#f0f8ff' : '#fff';
  }};
  border: 2px solid
    ${(props) => {
      if (props.disabled) return '#f0f0f0';
      return props.selected ? '#1890ff' : '#f0f0f0';
    }};
  opacity: ${(props) => (props.disabled ? 0.7 : 1)};
  transition: all 0.3s;

    &:hover {
    box-shadow: ${(props) =>
      props.disabled ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.1)'};
  }

  .ant-card-body {
    padding: 16px;
  }
`;

const ExistingOverlay = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 2px 8px;
  font-size: 0.8em;
  color: white;
  background-color: #ff4d4f;
  border-radius: 4px;
`;

const CardHeader = styled.div`
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;

  h4 {
    margin: 0 0 6px;
    font-size: 16px;
    font-weight: 600;
    color: ${(props) => {
      if (props.disabled) return '#aaaaaa';
      return props.selected ? '#1890ff' : 'inherit';
    }};
  }

  small {
    font-size: 12px;
    color: #999;
  }
`;

const CardBody = styled.div`
  margin-bottom: 16px;

  p {
    margin: 4px 0;
    font-size: 14px;
  }
`;

const FooterContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const SelectedCount = styled.div`
  min-width: 200px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`; // Added missing closing brace and semicolon

export default AddReceiptDrawer;
