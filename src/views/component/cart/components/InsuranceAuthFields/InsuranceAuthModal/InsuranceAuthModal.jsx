import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Modal, Form, Input, DatePicker, Select, message, Spin } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { useListenInsuranceConfig } from '../../../../../../firebase/insurance/insuranceService';
import { selectClient } from '../../../../../../features/clientCart/clientCartSlice';
import dayjs from 'dayjs'; // Import dayjs for date handling
import {
  setAuthData,
  selectInsuranceAuthData,
  selectInsuranceAuthLoading,
  selectInsuranceModal,
  closeModal,
  fetchInsuranceAuthByClientId,
  updateAuthField
} from '../../../../../../features/insurance/insuranceAuthSlice';
import { createClientInsurance, updateClientInsurance, getClientInsuranceByClientId } from '../../../../../../firebase/insurance/clientInsuranceService';
import Dependent from './components/Dependent/Dependent';
import useInsuranceEnabled from '../../../../../../hooks/useInsuranceEnabled';
// Importamos el componente FileUploader
import FileUploader from '../../../../FileUploader/FileUploader';
import { setInsuranceAR } from '../../../../../../features/insurance/insuranceAccountsReceivableSlice';

const Row = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
`;

const Col = styled.div`
  flex: 1;
`;

// Componente estilizado rediseñado con una estética más corporativa, minimalista y moderna
const ClientInfoWidget = styled.div`
  padding: 10px 0 0;
  margin-bottom: 20px;
  /* border-bottom: 1px solid #eaeaea; */
  display: flex;
  align-items: center;
  
  .icon-container {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
  }
  
  .icon {
    font-size: 16px;
    color: #666;
  }
  
  .client-info {
    display: flex;
    flex-direction: column;
  }
  
  .label {
    font-size: 12px;
    color: #8c8c8c;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }
  
  .client-name {
    font-size: 16px;
    font-weight: 500;
    color: #262626;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

// Nuevo componente para los encabezados de sección
const SectionHeader = styled.h3`
  font-size: 16px;
  color: #262626;
  margin-top: 10px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
`;

export const InsuranceAuthModal = () => {
  // Se obtienen los valores desde el slice
  const { open } = useSelector(selectInsuranceModal);
  const authData = useSelector(selectInsuranceAuthData);
  const isLoading = useSelector(selectInsuranceAuthLoading);
  const user = useSelector(selectUser);
  const client = useSelector(selectClient);
  const insuranceEnabled = useInsuranceEnabled();

  const dispatch = useDispatch();

  const [form] = Form.useForm();
  const [hasDependent, setHasDependent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formComplete, setFormComplete] = useState(false);

  // Este estado guardará el ID de la aseguradora seleccionada
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  // Añadimos un estado para guardar la aseguradora seleccionada completa
  const [selectedInsuranceData, setSelectedInsuranceData] = useState(null);
  const [prescriptionFiles, setPrescriptionFiles] = useState([]);

  // Escuchamos la configuración de seguros (aseguradoras + tipos)
  const { data: insuranceConfigData, loading: configLoading } = useListenInsuranceConfig();

  // Función para encontrar una aseguradora por ID
  const findInsuranceById = useCallback((id) => {
    if (!insuranceConfigData || !id) return null;
    return insuranceConfigData.find(ins => ins.id === id) || null;
  }, [insuranceConfigData]);

  // Función para encontrar un tipo de seguro por ID
  const findInsuranceTypeById = useCallback((typeId) => {
    if (!selectedInsuranceData?.insuranceTypes || !typeId) return null;
    return selectedInsuranceData.insuranceTypes.find(type => type.id === typeId) || null;
  }, [selectedInsuranceData]);

  // Actualizar el objeto de aseguradora seleccionada cuando cambie el ID
  useEffect(() => {
    const insuranceData = findInsuranceById(selectedInsurance);
    setSelectedInsuranceData(insuranceData);
  }, [selectedInsurance, findInsuranceById]);

  // Mapeamos los tipos de seguro según la aseguradora seleccionada
  const insuranceTypes = useMemo(() => {
    if (!selectedInsuranceData?.insuranceTypes) return [];
    return selectedInsuranceData.insuranceTypes;
  }, [selectedInsuranceData]);

  // Nueva función para guardar datos específicos inmediatamente
  const saveSpecificFieldsToClientInsurance = useCallback(async (field, value) => {
    if (!client?.id || !user) return;

    try {
      // Convertir fechas a formato ISO si es necesario
      let processedValue = value;
      if (field === 'birthDate' && value instanceof dayjs) {
        processedValue = value.toISOString();
      }

      // Preparar los datos a guardar
      const dataToSave = {
        clientId: client.id,
        [field]: processedValue
      };

      // Si ya tenemos un ID de aseguradora e insuranceType, incluirlos en los datos
      if (field !== 'insuranceId' && authData.insuranceId) {
        dataToSave.insuranceId = authData.insuranceId;
      }
      if (field !== 'insuranceType' && authData.insuranceType) {
        dataToSave.insuranceType = authData.insuranceType;
      }
      if (field !== 'birthDate' && authData.birthDate) {
        dataToSave.birthDate = authData.birthDate instanceof dayjs 
          ? authData.birthDate.toISOString() 
          : authData.birthDate;
      }

      // Actualizar o crear el registro del seguro del cliente
      if (authData.clientInsuranceId) {
        await updateClientInsurance(user, { 
          id: authData.clientInsuranceId,
          ...dataToSave
        });
      } else {
        // Crear un nuevo registro
        const success = await createClientInsurance(user, dataToSave);
        if (success) {
          // Si se crea exitosamente, podríamos actualizar el estado con el ID
          // Pero necesitaríamos recuperar el ID creado, lo que depende de la implementación
        }
      }
      dispatch(setInsuranceAR({insuranceId: authData.insuranceId}))
      // Actualizar Redux después de guardar en Firebase
      dispatch(updateAuthField({ field, value: processedValue }));
    } catch (error) {
      console.error("Error saving specific insurance field:", error);
      message.error("No se pudo guardar el campo de seguro");
    }
  }, [client?.id, user, authData.insuranceId, authData.insuranceType, authData.birthDate, authData.clientInsuranceId, dispatch]);

  // Handler para cambio de aseguradora
  const handleInsuranceChange = (value) => {
    // 'value' es el ID de la aseguradora
    setSelectedInsurance(value);
    // Reseteamos el tipo de seguro
    form.setFieldValue('insuranceType', undefined);
    
    // Guardar inmediatamente el cambio
    saveSpecificFieldsToClientInsurance('insuranceId', value);
  };

  // Handler para cambio de tipo de seguro
  const handleInsuranceTypeChange = (value) => {
    // Guardar inmediatamente el cambio
    saveSpecificFieldsToClientInsurance('insuranceType', value);
  };

  // Handler para cambio de fecha de nacimiento
  const handleBirthDateChange = (date) => {
    if (date) {
      saveSpecificFieldsToClientInsurance('birthDate', date);
    }
  };

  // Función para validar que todos los campos requeridos estén completos
  const validateFormCompletion = useCallback(() => {
    // Si el seguro no está habilitado, no importa si el formulario está completo
    if (!insuranceEnabled) {
      setFormComplete(false);
      return false;
    }

    try {
      // Obtener los valores actuales del formulario
      const values = form.getFieldsValue();
      
      // Lista de campos requeridos
      const requiredFields = [
        'insuranceId',
        'insuranceType',
        'affiliateNumber',
        'authNumber',
        'doctor',
        'specialty',
        'indicationDate',
        // Eliminamos birthDate de los campos requeridos
      ];
      
      // Verificar si todos los campos requeridos tienen valor
      const allFieldsComplete = requiredFields.every(field => {
        const value = values[field];
        return value !== undefined && value !== null && value !== '';
      });
      
      setFormComplete(allFieldsComplete);
      return allFieldsComplete;
    } catch (error) {
      console.error('Error validando completitud del formulario:', error);
      return false;
    }
  }, [form, insuranceEnabled]);
  
  // Esta función será llamada automáticamente cuando cambie cualquier valor del formulario
  const handleFormValuesChange = useCallback((changedValues) => {
    validateFormCompletion();
  }, [validateFormCompletion]);
  
  // También validamos al cargar los datos iniciales
  useEffect(() => {
    if (authData) {
      setTimeout(() => validateFormCompletion(), 300);
    }
  }, [authData, validateFormCompletion]);

  // Load insurance auth data from Firebase when modal opens
  useEffect(() => {
    if (open && client?.id && user && !authData?.clientId) {
      dispatch(fetchInsuranceAuthByClientId({
        user,
        clientId: client.id
      }));
    }
  }, [open, client?.id, user, authData?.clientId, dispatch]);

  useEffect(() => {
    if (open) {
      const formValues = authData || {};

      if (formValues.insuranceId) {
        setSelectedInsurance(formValues.insuranceId);
      }

      // Convert ISO date strings to dayjs objects for DatePicker
      const formattedValues = { ...formValues };
      
      // Properly format dates for the form
      if (formattedValues.birthDate) {
        formattedValues.birthDate = dayjs(formattedValues.birthDate);
      }
      if (formattedValues.indicationDate) {
        formattedValues.indicationDate = dayjs(formattedValues.indicationDate);
      }

      // Configuramos los valores del formulario
      form.setFieldsValue(formattedValues);
      setHasDependent(formValues.hasDependent || false);
      
      // Validar completitud después de cargar datos
      setTimeout(() => validateFormCompletion(), 300);
    }
  }, [open, authData, form, validateFormCompletion]);

  // Validamos las fechas para que no sean del futuro
  const disabledFutureDate = (current) => {
    // Use the dayjs object provided by the DatePicker
    return current && current > dayjs();
  };

  // Función para manejar la adición de archivos de receta
  const handleAddPrescriptionFiles = (newFiles) => {
    // Guardar los archivos en el estado local
    setPrescriptionFiles(prev => [...prev, ...newFiles]);
    
    // También actualizar el campo en el formulario para mantener la consistencia
    const currentFiles = form.getFieldValue('prescription') || [];
    form.setFieldValue('prescription', [...currentFiles, ...newFiles]);
    
    validateFormCompletion();
  };

  // Función para manejar la eliminación de archivos de receta
  const handleRemovePrescriptionFile = (fileId) => {
    setPrescriptionFiles(prev => prev.filter(file => file.id !== fileId));
    
    const currentFiles = form.getFieldValue('prescription') || [];
    form.setFieldValue('prescription', currentFiles.filter(file => file.id !== fileId));
    
    validateFormCompletion();
  };

  // Cargar los archivos de prescripción cuando se abra el modal
  useEffect(() => {
    if (open && authData?.prescription) {
      const files = Array.isArray(authData.prescription) 
        ? authData.prescription 
        : [authData.prescription];
      
      setPrescriptionFiles(
        files.map(file => ({
          ...file,
          // Asegurarnos de que cada archivo tenga un ID
          id: file.id || Math.random().toString(36).substr(2, 9),
          // Si el archivo es un objeto File, necesitamos extraer su nombre
          name: file.name || (file.file && file.file.name) || 'Archivo de receta'
        }))
      );
    } else {
      setPrescriptionFiles([]);
    }
  }, [open, authData?.prescription]);

  const handleCancel = () => {
    dispatch(closeModal());
  };

  const handleOk = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();

      // Formatamos las fechas antes de guardar
      const formattedValues = {
        ...values,
        birthDate: values.birthDate ? values.birthDate.toISOString() : null,
        indicationDate: values.indicationDate ? values.indicationDate.toISOString() : null,
        // Incluimos los archivos de receta
        prescription: prescriptionFiles
      };

      // Guardamos en el estado de Redux
      dispatch(setAuthData(formattedValues));
      
      // Guardamos en Firebase si tenemos un cliente seleccionado
      if (client?.id) {
        try {
          // Obtenemos los datos de seguro existentes para este cliente
          const existingInsurance = await getClientInsuranceByClientId(user, client.id);
          
          // Extraemos solo los campos específicos que queremos guardar
          const specificInsuranceData = {
            clientId: client.id,
            insuranceId: formattedValues.insuranceId,
            insuranceType: formattedValues.insuranceType,
            birthDate: formattedValues.birthDate
          };
          
          let success = false;
          
          if (existingInsurance) {
            // Si ya existe un registro, verificamos si hay cambios en alguno de los campos específicos
            const hasChanges = 
              existingInsurance.insuranceId !== specificInsuranceData.insuranceId ||
              existingInsurance.insuranceType !== specificInsuranceData.insuranceType ||
              existingInsurance.birthDate !== specificInsuranceData.birthDate;
            
            if (hasChanges) {
              // Actualizamos solo si hay cambios
              success = await updateClientInsurance(user, {
                id: existingInsurance.id,
                ...specificInsuranceData
              });
            } else {
              // No hay cambios que guardar
              success = true;
            }
          } else {
            // Si no existe, creamos un nuevo registro
            success = await createClientInsurance(user, specificInsuranceData);
          }
          
          if (success) {
            message.success('Datos de seguro guardados exitosamente');
          } else {
            message.error('Error al guardar los datos de seguro');
            setSubmitting(false);
            return;
          }
          
        } catch (error) {
          console.error("Error al guardar datos de seguro:", error);
          message.error(error.message || 'Error al guardar los datos de seguro');
          setSubmitting(false);
          return;
        }
      } else {
        message.warning('No se puede guardar la autorización sin un cliente seleccionado');
      }

      dispatch(closeModal());
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Verificar si debemos deshabilitar el formulario
  // FIX: Corregir la lógica para que el formulario solo se deshabilite cuando el seguro no está habilitado
  const isFormDisabled = !insuranceEnabled;

  // Para el botón OK, debe estar deshabilitado cuando:
  // 1. El seguro no esté habilitado
  // 2. El formulario no esté completo (pero solo si el seguro está habilitado)
  const isOkButtonDisabled = !insuranceEnabled || (insuranceEnabled && !formComplete);

  return (
    <Modal
      title="Autorización de Seguro"
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      okButtonProps={{ 
        loading: submitting,
        disabled: isOkButtonDisabled
      }}
      style={{ top: 20 }}
      width={800}
      destroyOnHidden
    >
      {/* Widget informativo del cliente actual con diseño minimalista y corporativo */}
      <ClientInfoWidget>
        <div className="icon-container">
          <UserOutlined className="icon" />
        </div>
        <div className="client-info">
          <span className="label">Cliente</span>
          <span className="client-name">{client?.name || 'Sin cliente seleccionado'}</span>
        </div>
      </ClientInfoWidget>

      {!insuranceEnabled && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '4px' }}>
          <strong>Seguro no disponible:</strong> El seguro no está habilitado. Verifique su tipo de negocio o active el seguro en la configuración.
        </div>
      )}

      {isLoading ? (
        <LoadingContainer>
          <Spin tip="Cargando datos de autorización..." />
        </LoadingContainer>
      ) : (
        <Form 
          form={form} 
          layout="vertical" 
          disabled={isFormDisabled}
          onValuesChange={handleFormValuesChange}
        >
          {/* SECCIÓN 1: INFORMACIÓN DEL SEGURO */}
          <SectionHeader>Información del Seguro</SectionHeader>
          
          {/* Grupo de información de seguro */}
          <Row>
            <Col>
              <Form.Item
                name="insuranceId"
                label="Aseguradora"
                rules={[{ required: true, message: 'Por favor seleccione la aseguradora' }]}
              >
                <Select
                  placeholder="Seleccione la aseguradora"
                  loading={configLoading}
                  onChange={handleInsuranceChange}
                  optionLabelProp="label"
                >
                  {insuranceConfigData?.map((insurance) => (
                    <Select.Option
                      key={insurance.id}
                      value={insurance.id}
                      label={insurance.insuranceCompanyName}
                    >
                      {insurance.insuranceCompanyName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="insuranceType"
                label="Tipo de Seguro"
                rules={[{ required: true, message: 'Por favor seleccione el tipo de seguro' }]}
              >
                <Select
                  placeholder="Seleccione el tipo de seguro"
                  disabled={!selectedInsurance || isFormDisabled}
                  optionLabelProp="label"
                  onChange={handleInsuranceTypeChange}
                >
                  {insuranceTypes.map((type) => (
                    <Select.Option
                      key={type.id}
                      value={type.id}
                      label={type.type}
                    >
                      {type.type}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Grupo de números de identificación */}
          <Row>
            <Col>
              <Form.Item
                name="affiliateNumber"
                label="Número de Afiliado"
                rules={[{ required: true, message: 'Por favor ingrese el número de afiliado' }]}
              >
                <Input placeholder="Ingrese el número de afiliado" autoComplete="off" />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="authNumber"
                label="Número de Autorización"
                rules={[{ required: true, message: 'Por favor ingrese el número de autorización' }]}
              >
                <Input placeholder="Número de autorización" autoComplete="off" />
              </Form.Item>
            </Col>
          </Row>

          {/* Grupo de información médica - Ahora en sección de seguro */}
          <Row>
            <Col>
              <Form.Item
                name="doctor"
                label="Médico"
                rules={[{ required: true, message: 'Por favor ingrese el nombre del médico' }]}
              >
                <Input placeholder="Nombre del médico" autoComplete="off" />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="specialty"
                label="Especialidad del Médico"
                rules={[{ required: true, message: 'Por favor ingrese la especialidad del médico' }]}
              >
                <Input placeholder="Especialidad del médico" autoComplete="off" />
              </Form.Item>
            </Col>
          </Row>

          {/* Fecha de indicación - Ahora en sección de seguro */}
          <Row>
            <Col>
              <Form.Item
                name="indicationDate"
                label="Fecha de Indicación"
                rules={[{ required: true, message: 'Por favor seleccione la fecha de indicación' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  autoComplete="off"
                  format="DD/MM/YYYY"
                  disabledDate={disabledFutureDate}
                />
              </Form.Item>
            </Col>
            <Col>
              {/* Reemplazamos el Upload por el FileUploader con modo compacto y en una línea */}
             
            </Col>
          </Row>
          <Row>
          <Col>
          <Form.Item name="prescription" label="Receta">
                <FileUploader 
                  files={prescriptionFiles}
                  onAddFiles={handleAddPrescriptionFiles}
                  onRemoveFiles={handleRemovePrescriptionFile}
                  defaultFileType="prescription"
                  fileTypes={["prescription", "document", "identification", "insurance"]}
                  fileTypeLabels={{
                    prescription: "Receta", 
                    document: "Documento",
                    identification: "Identificación",
                    insurance: "Seguro"
                  }}
                  acceptedFileTypes=".pdf,.jpg,.jpeg,.png"
                  uploaderTitle="cargar"
                  successMessage="Archivo de receta agregado"
                  showFileList={true}
                  maxFiles={3}
                  compact={true}
                  alwaysShowTypeSelector={true}
                  inlineLayout={true}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* SECCIÓN 2: INFORMACIÓN DEL CLIENTE */}
          <SectionHeader>Información del Cliente</SectionHeader>
          
          {/* Solo fecha de nacimiento en la sección del cliente */}
          <Row>
            <Col>
              <Form.Item
                name="birthDate"
                label="Fecha de Nacimiento"
                rules={[{ required: false, message: 'Por favor seleccione la fecha de nacimiento' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  autoComplete="off"
                  format="DD/MM/YYYY"
                  disabledDate={disabledFutureDate}
                  onChange={handleBirthDateChange}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* SECCIÓN 3: INFORMACIÓN DEL DEPENDIENTE */}
          <SectionHeader>Información del Dependiente (opcional)</SectionHeader>
          <Dependent 
            form={form} 
            hasDependent={hasDependent} 
            onDependentChange={setHasDependent} 
          />
        </Form>
      )}
    </Modal>
  );
};