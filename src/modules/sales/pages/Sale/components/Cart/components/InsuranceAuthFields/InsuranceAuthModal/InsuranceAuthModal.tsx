import { UserOutlined } from '@/constants/icons/antd';
import { Modal, Form, Input, Select, message, Spin } from 'antd';
import { DateTime } from 'luxon';
import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';

import DatePicker from '@/components/DatePicker';
import DoctorModal from '@/components/DoctorModal/DoctorModal';
import DoctorSelector from '@/components/DoctorSelector/DoctorSelector';
import type { DoctorRecord } from '@/types/doctors';
import type { UserIdentity, UserWithBusiness } from '@/types/users';
import { selectUser } from '@/features/auth/userSlice';
import { selectClient } from '@/features/clientCart/clientCartSlice';
import {
  setAuthData,
  selectInsuranceAuthData,
  selectInsuranceAuthLoading,
  selectInsuranceModal,
  closeModal,
  fetchInsuranceAuthByClientId,
  updateAuthField,
} from '@/features/insurance/insuranceAuthSlice';
import { useFbGetDoctors } from '@/firebase/doctors/useFbGetDoctors';
import {
  createClientInsurance,
  updateClientInsurance,
  getClientInsuranceByClientId,
} from '@/firebase/insurance/clientInsuranceService';
import { useListenInsuranceConfig } from '@/firebase/insurance/insuranceService';
import useInsuranceEnabled from '@/hooks/useInsuranceEnabled';
import FileUploader from '@/components/common/FileUploader/FileUploader';

import Dependent from './components/Dependent/Dependent';

type ClientIdentity = {
  id?: string;
  name?: string;
};

type InsuranceType = {
  id: string;
  type?: string;
};

type InsuranceConfigRecord = {
  id: string;
  insuranceCompanyName?: string;
  insuranceTypes?: InsuranceType[];
};

type InsuranceAuthData = {
  clientId?: string | null;
  insuranceId?: string | null;
  insuranceType?: string | null;
  birthDate?: string | null;
  indicationDate?: string | null;
  affiliateNumber?: string;
  authNumber?: string;
  doctorId?: string | null;
  doctor?: string | null;
  specialty?: string | null;
  hasDependent?: boolean;
  prescription?: unknown;
  [key: string]: unknown;
};

const hasBusinessId = (
  value: UserIdentity | null,
): value is UserWithBusiness =>
  typeof value?.businessID === 'string' && value.businessID.trim().length > 0;

type InsuranceFormValues = Omit<
  InsuranceAuthData,
  'birthDate' | 'indicationDate'
> & {
  birthDate?: DateTime | string | null;
  indicationDate?: DateTime | string | null;
  prescription?: unknown;
};

type PrescriptionFile = {
  id?: string;
  name?: string;
  file?: { name?: string };
  [key: string]: unknown;
};

type SaveClientInsuranceResult =
  | { success: true }
  | { success: false; errorMessage: string };

const normalizePrescriptionFiles = (value: unknown): PrescriptionFile[] => {
  const files = Array.isArray(value) ? value : value ? [value] : [];

  return files
    .filter(
      (file): file is PrescriptionFile =>
        typeof file === 'object' && file !== null,
    )
    .map((file, index) => {
      const fallbackName = file.file?.name || 'Archivo de receta';
      const name =
        typeof file.name === 'string' && file.name.trim().length > 0
          ? file.name
          : fallbackName;
      const id =
        typeof file.id === 'string' && file.id.trim().length > 0
          ? file.id
          : `${name}-${index}`;

      return {
        ...file,
        id,
        name,
      };
    });
};

const persistClientInsurance = async ({
  user,
  clientId,
  formattedValues,
}: {
  user: UserWithBusiness;
  clientId: string;
  formattedValues: InsuranceAuthData;
}): Promise<SaveClientInsuranceResult> => {
  try {
    const existingInsurance = await getClientInsuranceByClientId(user, clientId);
    const specificInsuranceData = {
      clientId,
      insuranceId: formattedValues.insuranceId,
      insuranceType: formattedValues.insuranceType,
      birthDate: formattedValues.birthDate,
    };

    let success = false;

    if (existingInsurance) {
      const hasChanges =
        existingInsurance.insuranceId !== specificInsuranceData.insuranceId ||
        existingInsurance.insuranceType !== specificInsuranceData.insuranceType ||
        existingInsurance.birthDate !== specificInsuranceData.birthDate;

      success = hasChanges
        ? await updateClientInsurance(user, {
            id: existingInsurance.id,
            ...specificInsuranceData,
          })
        : true;
    } else {
      success = await createClientInsurance(user, specificInsuranceData);
    }

    return success
      ? { success: true }
      : {
          success: false,
          errorMessage: 'Error al guardar los datos de seguro',
        };
  } catch (error) {
    const err = error as Error;
    console.error('Error al guardar datos de seguro:', err);

    return {
      success: false,
      errorMessage: err.message || 'Error al guardar los datos de seguro',
    };
  }
};

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
  const { open } = useSelector(selectInsuranceModal) as { open: boolean };
  const authData = useSelector(selectInsuranceAuthData) as any;
  const isLoading = useSelector(selectInsuranceAuthLoading) as boolean;
  const user = useSelector(selectUser) as UserIdentity | null;
  const userWithBusiness = hasBusinessId(user) ? user : null;
  const client = useSelector(selectClient) as ClientIdentity | null;
  const insuranceEnabled = useInsuranceEnabled();

  const dispatch = useDispatch();

  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const initialDataLoadedRef = useRef(false);
  const watchedInsuranceId = Form.useWatch('insuranceId', form) as
    | string
    | null
    | undefined;
  const watchedInsuranceType = Form.useWatch('insuranceType', form) as
    | string
    | null
    | undefined;
  const watchedAffiliateNumber = Form.useWatch('affiliateNumber', form) as
    | string
    | null
    | undefined;
  const watchedAuthNumber = Form.useWatch('authNumber', form) as
    | string
    | null
    | undefined;
  const watchedDoctorId = Form.useWatch('doctorId', form) as
    | string
    | null
    | undefined;
  const watchedDoctorName = Form.useWatch('doctor', form) as
    | string
    | null
    | undefined;
  const watchedDoctorSpecialty = Form.useWatch('specialty', form) as
    | string
    | null
    | undefined;
  const watchedPrescription = Form.useWatch('prescription', form) as unknown;

  const formatDateValue = (value?: DateTime | string | null): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    return value.toISO?.() || value.toString();
  };

  // Escuchamos la configuración de seguros (aseguradoras + tipos)
  const { data: insuranceConfigData, loading: configLoading } =
    useListenInsuranceConfig() as {
      data: InsuranceConfigRecord[];
      loading: boolean;
    };
  // Escuchamos los médicos disponibles
  const { doctors = [] } = useFbGetDoctors() as {
    doctors?: DoctorRecord[];
  };
  const selectedInsurance =
    typeof watchedInsuranceId === 'string' ? watchedInsuranceId : null;

  // Función para encontrar una aseguradora por ID
  const findInsuranceById = useCallback(
    (id: string | null) => {
      if (!insuranceConfigData || !id) return null;
      return insuranceConfigData.find((ins) => ins.id === id) || null;
    },
    [insuranceConfigData],
  );
  const selectedInsuranceData = useMemo(
    () => findInsuranceById(selectedInsurance),
    [findInsuranceById, selectedInsurance],
  );

  // Mapeamos los tipos de seguro según la aseguradora seleccionada
  const insuranceTypes = useMemo(() => {
    if (!selectedInsuranceData?.insuranceTypes) return [];
    return selectedInsuranceData.insuranceTypes;
  }, [selectedInsuranceData]);

  // Handler para cambio de aseguradora
  const handleInsuranceChange = (value: string) => {
    // Reseteamos el tipo de seguro
    form.setFieldValue('insuranceType', undefined);

    // Solo actualizar Redux, no guardar inmediatamente
    dispatch(updateAuthField({ field: 'insuranceId', value }));
  };

  // Handler para cambio de tipo de seguro
  const handleInsuranceTypeChange = (value: string) => {
    // Solo actualizar Redux, no guardar inmediatamente
    dispatch(updateAuthField({ field: 'insuranceType', value }));
  };

  // Handler para cambio de fecha de nacimiento
  const handleBirthDateChange = (date: DateTime | null) => {
    if (date) {
      // Solo actualizar Redux, no guardar inmediatamente
      dispatch(updateAuthField({ field: 'birthDate', value: date.toISO() }));
    }
  };

  // Handler para cambio de médico
  const handleDoctorChange = (doctor: DoctorRecord | null) => {
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
  };

  const selectedDoctor = useMemo<DoctorRecord | null>(() => {
    if (!watchedDoctorId) {
      return null;
    }

    return (
      doctors.find((doctor) => doctor.id === watchedDoctorId) || {
        id: watchedDoctorId,
        name: watchedDoctorName || undefined,
        specialty: watchedDoctorSpecialty || undefined,
      }
    );
  }, [doctors, watchedDoctorId, watchedDoctorName, watchedDoctorSpecialty]);

  const prescriptionFiles = useMemo(
    () => normalizePrescriptionFiles(watchedPrescription),
    [watchedPrescription],
  );

  const formComplete = useMemo(() => {
    if (!insuranceEnabled) {
      return false;
    }

    return (
      [selectedInsurance, watchedInsuranceType, watchedAffiliateNumber, watchedAuthNumber]
        .every((value) => value !== undefined && value !== null && value !== '') &&
      selectedDoctor !== null
    );
  }, [
    insuranceEnabled,
    selectedInsurance,
    watchedInsuranceType,
    watchedAffiliateNumber,
    watchedAuthNumber,
    selectedDoctor,
  ]);

  // Load insurance auth data from Firebase when modal opens
  useEffect(() => {
    if (open && client?.id && userWithBusiness && !authData?.clientId) {
      console.log('🔍 Cargando datos de seguro para cliente:', client.id);
      dispatch(
        fetchInsuranceAuthByClientId({
          user: userWithBusiness,
          clientId: client.id,
        }),
      );
    }
  }, [open, client?.id, userWithBusiness, authData?.clientId, dispatch]);

  // Separate effect for initial load only
  useEffect(() => {
    if (open && authData && !initialDataLoadedRef.current) {
      console.log('📋 Datos cargados desde Redux:', authData);
      const formValues: InsuranceFormValues = authData || {};

      // Convert ISO date strings to Luxon DateTime for DatePicker
      const formattedValues: InsuranceFormValues = { ...formValues };

      // Properly format dates for the form
      if (formattedValues.birthDate) {
        console.log(
          '📅 Fecha de nacimiento encontrada:',
          formattedValues.birthDate,
        );
        if (typeof formattedValues.birthDate === 'string') {
          formattedValues.birthDate = DateTime.fromISO(
            formattedValues.birthDate,
          );
        }
      } else {
        console.log('❌ No se encontró fecha de nacimiento');
      }
      if (formattedValues.indicationDate) {
        if (typeof formattedValues.indicationDate === 'string') {
          formattedValues.indicationDate = DateTime.fromISO(
            formattedValues.indicationDate,
          );
        }
      }
      if (formattedValues.prescription) {
        formattedValues.prescription = normalizePrescriptionFiles(
          formattedValues.prescription,
        );
      }

      console.log('✍️ Estableciendo valores en formulario:', formattedValues);
      // Configuramos los valores del formulario SOLO en la carga inicial
      form.setFieldsValue(formattedValues);

      // Marcar que los datos iniciales ya fueron cargados
      initialDataLoadedRef.current = true;
    }
  }, [open, authData, form]);

  // Reset initialDataLoaded when modal closes
  useEffect(() => {
    if (!open) {
      initialDataLoadedRef.current = false;

      // También resetear el formulario cuando se cierra el modal
      form.resetFields([]);
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
      form.resetFields([]);
      initialDataLoadedRef.current = false;
    }
  }, [authData, open, form]);

  // Validamos las fechas para que no sean del futuro
  const disabledFutureDate = (current: DateTime | null): boolean => {
    // Use the DateTime object provided by the DatePicker
    return Boolean(current && current.toMillis() > DateTime.local().toMillis());
  };

  // Función para manejar la adición de archivos de receta
  const handleAddPrescriptionFiles = (newFiles: PrescriptionFile[]) => {
    const currentFiles = normalizePrescriptionFiles(
      form.getFieldValue('prescription'),
    );
    const nextFiles = normalizePrescriptionFiles(newFiles);

    form.setFieldValue('prescription', [...currentFiles, ...nextFiles]);
  };

  // Función para manejar la eliminación de archivos de receta
  const handleRemovePrescriptionFile = (fileId: string) => {
    const currentFiles = normalizePrescriptionFiles(
      form.getFieldValue('prescription'),
    );
    form.setFieldValue(
      'prescription',
      currentFiles.filter((file) => file.id !== fileId),
    );
  };

  const handleCancel = () => {
    initialDataLoadedRef.current = false;

    // Resetear el formulario explícitamente
    form.resetFields([]);

    // Cerrar el modal
    dispatch(closeModal(undefined));
  };

  const handleOk = async () => {
    setSubmitting(true);

    const submissionError = await (async () => {
      const values = (await form.validateFields()) as InsuranceFormValues;

      // Formatamos las fechas antes de guardar
      const formattedValues: InsuranceAuthData = {
        ...values,
        birthDate: formatDateValue(values.birthDate),
        indicationDate: formatDateValue(values.indicationDate),
        // Incluimos los archivos de receta
        prescription: prescriptionFiles,
        // Incluimos la información del médico seleccionado
        doctorId: selectedDoctor?.id || null,
        doctor: selectedDoctor?.name || null,
        specialty: selectedDoctor?.specialty || null,
      };

      // Guardamos en el estado de Redux
      dispatch(setAuthData(formattedValues as any));

      // Guardamos en Firebase si tenemos un cliente seleccionado
      if (client?.id) {
        if (!userWithBusiness) {
          message.error('No se pudo determinar el negocio activo.');
          return;
        }
        const saveResult = await persistClientInsurance({
          user: userWithBusiness,
          clientId: client.id,
          formattedValues,
        });

        if (!saveResult.success) {
          message.error(saveResult.errorMessage);
          return;
        }

        message.success('Datos de seguro guardados exitosamente');
      } else {
        message.warning(
          'No se puede guardar la autorización sin un cliente seleccionado',
        );
      }

      dispatch(closeModal(undefined));
    })()
      .then(() => null)
      .catch((error) => error);

    if (submissionError) {
      const err = submissionError as Error;
      console.error('Validation failed:', err);
    }

    setSubmitting(false);
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
                  options={insuranceConfigData?.map((insurance) => ({
                    value: insurance.id,
                    label: insurance.insuranceCompanyName,
                  }))}
                />
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
                  onChange={handleInsuranceTypeChange}
                  options={insuranceTypes.map((type) => ({
                    value: type.id,
                    label: type.type,
                  }))}
                />
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
          <Dependent form={form} />
        </Form>
      )}

      {/* Modal para agregar/editar médicos */}
      <DoctorModal />
    </Modal>
  );
};
