import { UserOutlined } from '@ant-design/icons';
import { Modal, Form, Input, Select, message, Spin } from 'antd';
import DatePicker from '@/components/DatePicker';
import { DateTime } from 'luxon';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

import DoctorModal from '../../../../../../../../components/DoctorModal/DoctorModal';
import DoctorSelector from '../../../../../../../../components/DoctorSelector/DoctorSelector';
import { selectUser } from '../../../../../../../../features/auth/userSlice';
import { selectClient } from '../../../../../../../../features/clientCart/clientCartSlice';
import {
  setAuthData,
  selectInsuranceAuthData,
  selectInsuranceAuthLoading,
  selectInsuranceModal,
  closeModal,
  fetchInsuranceAuthByClientId,
  updateAuthField,
} from '../../../../../../../../features/insurance/insuranceAuthSlice';
import { useFbGetDoctors } from '../../../../../../../../firebase/doctors/useFbGetDoctors';
import {
  createClientInsurance,
  updateClientInsurance,
  getClientInsuranceByClientId,
} from '../../../../../../../../firebase/insurance/clientInsuranceService';
import { useListenInsuranceConfig } from '../../../../../../../../firebase/insurance/insuranceService';
import useInsuranceEnabled from '../../../../../../../../hooks/useInsuranceEnabled';
import FileUploader from '../../../../../../../component/FileUploader/FileUploader';

import Dependent from './components/Dependent/Dependent';

// Importamos el componente FileUploader
// Importamos los componentes de médicos

const Row = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
`;

const Col = styled.div`
  flex: 1;
`;

// Componente estilizado rediseñado con una estética más corporativa, minimalista y moderna
const ClientInfoWidget = styled.div`

  /* border-bottom: 1px solid #eaeaea; */
  display: flex;
  align-items: center;
  padding: 10px 0 0;
  margin-bottom: 20px;

  .icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-right: 12px;
    background-color: #f5f5f5;
    border-radius: 4px;
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
    margin-bottom: 2px;
    font-size: 12px;
    color: #8c8c8c;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .client-name {
    font-size: 16px;
    font-weight: 500;
    color: #262626;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

// Nuevo componente para los encabezados de sección
const SectionHeader = styled.h3`
  padding-bottom: 8px;
  margin-top: 10px;
  margin-bottom: 16px;
  font-size: 16px;
  color: #262626;
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
  const [submitting, setSubmitting] = useState(false);
  const [formComplete, setFormComplete] = useState(false);

  // Este estado guardará el ID de la aseguradora seleccionada
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  // Añadimos un estado para guardar la aseguradora seleccionada completa
  const [selectedInsuranceData, setSelectedInsuranceData] = useState(null);
  const [prescriptionFiles, setPrescriptionFiles] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Escuchamos la configuración de seguros (aseguradoras + tipos)
  const { data: insuranceConfigData, loading: configLoading } =
    useListenInsuranceConfig();
  // Escuchamos los médicos disponibles
  const { doctors } = useFbGetDoctors();

  // Función para encontrar una aseguradora por ID
  const findInsuranceById = useCallback(
    (id) => {
      if (!insuranceConfigData || !id) return null;
      return insuranceConfigData.find((ins) => ins.id === id) || null;
    },
    [insuranceConfigData],
  );

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

  // Handler para cambio de aseguradora
  const handleInsuranceChange = (value) => {
    // 'value' es el ID de la aseguradora
    setSelectedInsurance(value);
    // Reseteamos el tipo de seguro
    form.setFieldValue('insuranceType', undefined);

    // Solo actualizar Redux, no guardar inmediatamente
    dispatch(updateAuthField({ field: 'insuranceId', value }));
  };

  // Handler para cambio de tipo de seguro
  const handleInsuranceTypeChange = (value) => {
    // Solo actualizar Redux, no guardar inmediatamente
    dispatch(updateAuthField({ field: 'insuranceType', value }));
  };

  // Handler para cambio de fecha de nacimiento
  const handleBirthDateChange = (date) => {
    if (date) {
      // Solo actualizar Redux, no guardar inmediatamente
      dispatch(
        updateAuthField({ field: 'birthDate', value: date.toISOString() }),
      );
    }
  };

  // Handler para cambio de médico
  const handleDoctorChange = (doctor) => {
    setSelectedDoctor(doctor);

    // Actualizar los campos en el formulario
    if (doctor) {
      form.setFieldsValue({
        doctorId: doctor.id,
        doctor: doctor.name,
        specialty: doctor.specialty,
      });

      // Actualizar Redux
      dispatch(updateAuthField({ field: 'doctorId', value: doctor.id }));
      dispatch(updateAuthField({ field: 'doctor', value: doctor.name }));
      dispatch(
        updateAuthField({ field: 'specialty', value: doctor.specialty }),
      );
    } else {
      form.setFieldsValue({
        doctorId: undefined,
        doctor: undefined,
        specialty: undefined,
      });

      // Limpiar Redux
      dispatch(updateAuthField({ field: 'doctorId', value: null }));
      dispatch(updateAuthField({ field: 'doctor', value: null }));
      dispatch(updateAuthField({ field: 'specialty', value: null }));
    }

    // Validar completitud
    validateFormCompletion();
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
        // Eliminamos birthDate e indicationDate de los campos requeridos
      ];

      // Verificar si todos los campos requeridos tienen valor
      const allFieldsComplete = requiredFields.every((field) => {
        const value = values[field];
        return value !== undefined && value !== null && value !== '';
      });

      // También verificar que el médico esté seleccionado
      const doctorSelected = selectedDoctor !== null;

      const isComplete = allFieldsComplete && doctorSelected;
      setFormComplete(isComplete);
      return isComplete;
    } catch (error) {
      console.error('Error validando completitud del formulario:', error);
      return false;
    }
  }, [form, insuranceEnabled, selectedDoctor]);

  // Esta función será llamada automáticamente cuando cambie cualquier valor del formulario
  const handleFormValuesChange = useCallback(() => {
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
      console.log('🔍 Cargando datos de seguro para cliente:', client.id);
      dispatch(
        fetchInsuranceAuthByClientId({
          user,
          clientId: client.id,
        }),
      );
    }
  }, [open, client?.id, user, authData?.clientId, dispatch]);

  // Separate effect for initial load only
  useEffect(() => {
    if (open && authData && !initialDataLoaded) {
      console.log('📋 Datos cargados desde Redux:', authData);
      const formValues = authData || {};

      if (formValues.insuranceId) {
        setSelectedInsurance(formValues.insuranceId);
      }

      // Set selected doctor if available
      if (formValues.doctorId) {
        const doctor = doctors.find((d) => d.id === formValues.doctorId);
        if (doctor) {
          setSelectedDoctor(doctor);
        }
      }

      // Convert ISO date strings to Luxon DateTime for DatePicker
      const formattedValues = { ...formValues };

      // Properly format dates for the form
      if (formattedValues.birthDate) {
        console.log(
          '📅 Fecha de nacimiento encontrada:',
          formattedValues.birthDate,
        );
        formattedValues.birthDate = DateTime.fromISO(formattedValues.birthDate);
      } else {
        console.log('❌ No se encontró fecha de nacimiento');
      }
      if (formattedValues.indicationDate) {
        formattedValues.indicationDate = DateTime.fromISO(
          formattedValues.indicationDate,
        );
      }

      console.log('✍️ Estableciendo valores en formulario:', formattedValues);
      // Configuramos los valores del formulario SOLO en la carga inicial
      form.setFieldsValue(formattedValues);
      setHasDependent(formValues.hasDependent || false);

      // Marcar que los datos iniciales ya fueron cargados
      setInitialDataLoaded(true);

      // Validar completitud después de cargar datos
      setTimeout(() => validateFormCompletion(), 300);
    }
  }, [
    open,
    authData,
    doctors,
    initialDataLoaded,
    form,
    validateFormCompletion,
  ]);

  // Reset initialDataLoaded when modal closes
  useEffect(() => {
    if (!open) {
      // Limpiar todos los estados locales cuando se cierra el modal
      setInitialDataLoaded(false);
      setSelectedDoctor(null);
      setSelectedInsurance(null);
      setSelectedInsuranceData(null);
      setPrescriptionFiles([]);
      setHasDependent(false);

      // También resetear el formulario cuando se cierra el modal
      form.resetFields();
    }
  }, [open, form]);

  // Reset form when authData is cleared (after invoice completion or cancellation)
  useEffect(() => {
    // Si authData es null o tiene valores iniciales (significa que se limpió), resetear formulario
    if (
      open &&
      authData &&
      (authData.clientId === null ||
        (authData.insuranceId === null &&
          authData.birthDate === null &&
          authData.affiliateNumber === ''))
    ) {
      console.log(
        '🧹 Limpiando formulario porque authData se reseteo:',
        authData,
      );
      form.resetFields();
      setSelectedDoctor(null);
      setSelectedInsurance(null);
      setSelectedInsuranceData(null);
      setPrescriptionFiles([]);
      setHasDependent(false);
    }
  }, [authData, open, form]);

  // Validamos las fechas para que no sean del futuro
  const disabledFutureDate = (current) => {
    // Use the DateTime object provided by the DatePicker
    return current && current.toMillis() > DateTime.local().toMillis();
  };

  // Función para manejar la adición de archivos de receta
  const handleAddPrescriptionFiles = (newFiles) => {
    // Guardar los archivos en el estado local
    setPrescriptionFiles((prev) => [...prev, ...newFiles]);

    // También actualizar el campo en el formulario para mantener la consistencia
    const currentFiles = form.getFieldValue('prescription') || [];
    form.setFieldValue('prescription', [...currentFiles, ...newFiles]);

    validateFormCompletion();
  };

  // Función para manejar la eliminación de archivos de receta
  const handleRemovePrescriptionFile = (fileId) => {
    setPrescriptionFiles((prev) => prev.filter((file) => file.id !== fileId));

    const currentFiles = form.getFieldValue('prescription') || [];
    form.setFieldValue(
      'prescription',
      currentFiles.filter((file) => file.id !== fileId),
    );

    validateFormCompletion();
  };

  // Cargar los archivos de prescripción cuando se abra el modal
  useEffect(() => {
    if (open && authData?.prescription) {
      const files = Array.isArray(authData.prescription)
        ? authData.prescription
        : [authData.prescription];

      setPrescriptionFiles(
        files.map((file) => ({
          ...file,
          // Asegurarnos de que cada archivo tenga un ID
          id: file.id || Math.random().toString(36).substr(2, 9),
          // Si el archivo es un objeto File, necesitamos extraer su nombre
          name:
            file.name || (file.file && file.file.name) || 'Archivo de receta',
        })),
      );
    } else {
      setPrescriptionFiles([]);
    }
  }, [open, authData?.prescription]);

  const handleCancel = () => {
    // Limpiar estados locales del componente
    setSelectedDoctor(null);
    setSelectedInsurance(null);
    setSelectedInsuranceData(null);
    setPrescriptionFiles([]);
    setHasDependent(false);
    setInitialDataLoaded(false);

    // Resetear el formulario explícitamente
    form.resetFields();

    // Cerrar el modal
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
        indicationDate: values.indicationDate
          ? values.indicationDate.toISOString()
          : null,
        // Incluimos los archivos de receta
        prescription: prescriptionFiles,
        // Incluimos la información del médico seleccionado
        doctorId: selectedDoctor?.id || null,
        doctor: selectedDoctor?.name || null,
        specialty: selectedDoctor?.specialty || null,
      };

      // Guardamos en el estado de Redux
      dispatch(setAuthData(formattedValues));

      // Guardamos en Firebase si tenemos un cliente seleccionado
      if (client?.id) {
        try {
          // Obtenemos los datos de seguro existentes para este cliente
          const existingInsurance = await getClientInsuranceByClientId(
            user,
            client.id,
          );

          // Extraemos solo los campos específicos que queremos guardar
          const specificInsuranceData = {
            clientId: client.id,
            insuranceId: formattedValues.insuranceId,
            insuranceType: formattedValues.insuranceType,
            birthDate: formattedValues.birthDate,
          };

          let success = false;

          if (existingInsurance) {
            // Si ya existe un registro, verificamos si hay cambios en alguno de los campos específicos
            const hasChanges =
              existingInsurance.insuranceId !==
                specificInsuranceData.insuranceId ||
              existingInsurance.insuranceType !==
                specificInsuranceData.insuranceType ||
              existingInsurance.birthDate !== specificInsuranceData.birthDate;

            if (hasChanges) {
              // Actualizamos solo si hay cambios
              success = await updateClientInsurance(user, {
                id: existingInsurance.id,
                ...specificInsuranceData,
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
          console.error('Error al guardar datos de seguro:', error);
          message.error(
            error.message || 'Error al guardar los datos de seguro',
          );
          setSubmitting(false);
          return;
        }
      } else {
        message.warning(
          'No se puede guardar la autorización sin un cliente seleccionado',
        );
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
  const isOkButtonDisabled =
    !insuranceEnabled || (insuranceEnabled && !formComplete);

  return (
    <Modal
      title="Autorización de Seguro"
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      okButtonProps={{
        loading: submitting,
        disabled: isOkButtonDisabled,
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
          <span className="client-name">
            {client?.name || 'Sin cliente seleccionado'}
          </span>
        </div>
      </ClientInfoWidget>

      {!insuranceEnabled && (
        <div
          style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#fffbe6',
            border: '1px solid #ffe58f',
            borderRadius: '4px',
          }}
        >
          <strong>Seguro no disponible:</strong> El seguro no está habilitado.
          Verifique su tipo de negocio o active el seguro en la configuración.
        </div>
      )}

      {isLoading ? (
        <LoadingContainer>
          <Spin tip="Cargando datos de autorización...">
            <div style={{ width: '100%', minHeight: 160 }} />
          </Spin>
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
                rules={[
                  {
                    required: true,
                    message: 'Por favor seleccione la aseguradora',
                  },
                ]}
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
                rules={[
                  {
                    required: true,
                    message: 'Por favor seleccione el tipo de seguro',
                  },
                ]}
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
                rules={[
                  {
                    required: true,
                    message: 'Por favor ingrese el número de afiliado',
                  },
                ]}
              >
                <Input
                  placeholder="Ingrese el número de afiliado"
                  autoComplete="off"
                />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item
                name="authNumber"
                label="Número de Autorización"
                rules={[
                  {
                    required: true,
                    message: 'Por favor ingrese el número de autorización',
                  },
                ]}
              >
                <Input
                  placeholder="Número de autorización"
                  autoComplete="off"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Selector de médico - Ahora en sección de seguro */}
          <Row>
            <Col>
              <Form.Item label="Médico">
                <DoctorSelector
                  doctors={doctors}
                  selectedDoctor={selectedDoctor}
                  onSelectDoctor={handleDoctorChange}
                  validateStatus={
                    !selectedDoctor && insuranceEnabled ? 'error' : ''
                  }
                  help={
                    !selectedDoctor && insuranceEnabled
                      ? 'Por favor seleccione un médico'
                      : ''
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Fecha de indicación - Ahora en sección de seguro */}
          <Row>
            <Col>
              <Form.Item
                name="indicationDate"
                label="Fecha de Indicación (opcional)"
                rules={[{ required: false }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  autoComplete="off"
                  format="DD/MM/YYYY"
                  disabledDate={disabledFutureDate}
                  placeholder="Seleccionar fecha (opcional)"
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
                  fileTypes={[
                    'prescription',
                    'document',
                    'identification',
                    'insurance',
                  ]}
                  fileTypeLabels={{
                    prescription: 'Receta',
                    document: 'Documento',
                    identification: 'Identificación',
                    insurance: 'Seguro',
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
                label="Fecha de Nacimiento (opcional)"
                rules={[{ required: false }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  autoComplete="off"
                  format="DD/MM/YYYY"
                  disabledDate={disabledFutureDate}
                  onChange={handleBirthDateChange}
                  placeholder="Seleccionar fecha (opcional)"
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

      {/* Modal para agregar/editar médicos */}
      <DoctorModal />
    </Modal>
  );
};
