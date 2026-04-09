import { InfoCircleOutlined, GlobalOutlined } from '@/constants/icons/antd';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form, Input, Button, Select, message, Tooltip, Space } from 'antd';
import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from 'libphonenumber-js/min';
import { useEffect, useState, type ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Local imports
import { OPERATION_MODES } from '@/constants/modes';
import { selectUser } from '@/features/auth/userSlice';
import {
  SelectProviderModalData,
  toggleProviderModal,
} from '@/features/modals/modalSlice';
import { fbAddProvider } from '@/firebase/provider/fbAddProvider';
import { fbCheckProviderExists } from '@/firebase/provider/fbCheckProviderExists';
import { fbUpdateProvider } from '@/firebase/provider/fbUpdateProvider';
import { useRncSearch } from '@/hooks/useRncSearch';
import {
  formatPhoneNumber,
  unformatPhoneNumber,
  isValidPhoneNumber,
} from '@/utils/format';
import { Modal } from '@/components/common/Modal/Modal';
import { DgiiSyncAlert } from '@/modules/contacts/components/Rnc/DgiiSyncAlert/DgiiSyncAlert';
import { RncPanel } from '@/modules/contacts/components/Rnc/RncPanel/RncPanel';

import { comprobantesOptions } from './constants';
import {
  AlertStack,
  DetailsPanel,
  FormGrid,
  FormPanel,
  ModalLayout,
} from './styles';

const { TextArea } = Input;

// Constants
const createMode = OPERATION_MODES.CREATE.id;
const updateMode = OPERATION_MODES.UPDATE.id;

const resolveProviderSaveErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object') {
    const typedError = error as { message?: string; code?: string };
    const message = String(typedError.message || '').trim();
    const code = String(typedError.code || '').toLowerCase();

    if (code.includes('permission-denied')) {
      return 'No tienes permisos para crear proveedores en este negocio.';
    }
    if (code.includes('unauthenticated')) {
      return 'Tu sesión expiró. Inicia sesión nuevamente.';
    }
    if (message) {
      return message;
    }
  }

  return 'Error al procesar el proveedor';
};

interface CountryOption {
  value: CountryCode;
  label: ReactNode;
  searchText: string;
}

interface ProviderFormValues {
  rnc: string;
  name: string;
  email?: string;
  tel?: string;
  address?: string;
  voucherType?: string;
  notes?: string;
  country?: CountryCode;
}

type ProviderModalData = ProviderFormValues & {
  id?: string;
};

// Generate country options
const countryOptions: CountryOption[] = getCountries().map((country) => ({
  value: country,
  label: (
    <Space>
      <span>{country}</span>
      <span style={{ color: '#888', fontSize: '0.9em' }}>
        (+{getCountryCallingCode(country)})
      </span>
    </Space>
  ),
  searchText: `${country} +${getCountryCallingCode(country)}`,
}));

interface OptionalLabelProps {
  children: ReactNode;
}

const OptionalLabel = ({ children }: OptionalLabelProps) => (
  <span>
    {children}
    <span style={{ color: '#999', marginLeft: '4px', fontSize: '13px' }}>
      (Opcional)
    </span>
  </span>
);

export const ProviderForm = () => {
  const dispatch = useDispatch();

  const { isOpen, mode, data } = useSelector(SelectProviderModalData) as {
    isOpen: boolean;
    mode: string;
    data?: ProviderModalData | null;
  };
  const user = useSelector(selectUser);
  const [form] = Form.useForm<ProviderFormValues>();
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('DO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedSuccessfully, setHasSubmittedSuccessfully] =
    useState(false);

  const [isWideScreen, setIsWideScreen] = useState(window.innerWidth > 1100);

  useEffect(() => {
    const handleResize = () => setIsWideScreen(window.innerWidth > 1100);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const {
    loading,
    error,
    rncInfo,
    differences,
    consultarRNC,
    syncWithDgii,
    compareDgiiData,
  } = useRncSearch(form);

  // Reemplazar el useEffect problemático con Form.useWatch
  const formValues = Form.useWatch([], form) as ProviderFormValues | undefined;

  useEffect(() => {
    if (rncInfo && formValues) {
      compareDgiiData(formValues, rncInfo);
    }
  }, [formValues, rncInfo, compareDgiiData]);

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      setHasSubmittedSuccessfully(false);
      setSelectedCountry('DO');
      return;
    }

    setIsSubmitting(false);
    setHasSubmittedSuccessfully(false);

    if (mode === updateMode && data) {
      form.setFieldsValue(data);
      setSelectedCountry(data.country ?? 'DO');
      // Si hay un RNC en los datos, consultarlo automáticamente
      if (data.rnc) {
        consultarRNC(data.rnc);
      }
    } else {
      setSelectedCountry('DO');
      // Initialize form with default empty values for non-required fields
      form.setFieldsValue({
        country: 'DO',
        email: '',
        notes: '',
      });
    }
  }, [isOpen, mode, data, form, consultarRNC]);

  const handleOpenModal = () => {
    dispatch(toggleProviderModal({ mode: createMode }));
    form.resetFields();
  };

  const handleSubmit = async () => {
    if (isSubmitting || hasSubmittedSuccessfully) {
      return;
    }

    try {
      const values = await form.validateFields();

      if (rncInfo?.status === 'DADO DE BAJA') {
        message.warning({
          content: 'El RNC está dado de baja en la DGII',
          key: 'providerSubmit',
        });
        return;
      }

      await submitForm(values as ProviderFormValues);
    } catch (error) {
      message.error({
        content: 'Error al procesar el proveedor',
        key: 'providerSubmit',
      });
      console.error('Error en proveedor:', error);
    }
  };

  const submitForm = async (values: ProviderFormValues) => {
    if (isSubmitting || hasSubmittedSuccessfully) {
      return;
    }

    if (!user?.businessID) {
      message.error({
        content: 'No se encontró el negocio activo.',
        key: 'providerSubmit',
      });
      return;
    }
    setIsSubmitting(true);
    message.loading({ content: 'Guardando proveedor...', key: 'providerSubmit' });

    try {
      const currentProviderId = mode === updateMode ? (data?.id ?? null) : null;
      const duplicateCheck = await fbCheckProviderExists(
        user.businessID,
        values.rnc.trim(),
        values.name.trim(),
        currentProviderId,
      )
        .then((duplicates) => ({
          duplicates,
          error: null,
        }))
        .catch((error) => ({
          duplicates: null,
          error,
        }));

      if (duplicateCheck.error || !duplicateCheck.duplicates) {
        message.error({
          content: 'Error al procesar el proveedor',
          key: 'providerSubmit',
        });
        console.error('Error en proveedor:', duplicateCheck.error);
        return;
      }

      const duplicates = duplicateCheck.duplicates;
      if (duplicates.rnc || duplicates.name) {
        let errorMsg = '';
        if (duplicates.rnc) errorMsg += 'Ya existe un proveedor con este RNC. ';
        if (duplicates.name)
          errorMsg += 'Ya existe un proveedor con este nombre. ';
        message.error({ content: errorMsg.trim(), key: 'providerSubmit' });
        return;
      }

      const provider = {
        ...values,
        tel: unformatPhoneNumber(values.tel ?? ''),
        email: values.email || '',
        notes: values.notes || '',
        address: values.address || '',
      };

      const saveError =
        mode === createMode
          ? await fbAddProvider(provider, user)
              .then(() => null)
              .catch((error) => error)
          : await fbUpdateProvider({ ...provider, id: data?.id }, user)
              .then(() => null)
              .catch((error) => error);

      if (saveError) {
        message.error({
          content: resolveProviderSaveErrorMessage(saveError),
          key: 'providerSubmit',
        });
        console.error('Error en proveedor:', saveError);
        return;
      }

      setHasSubmittedSuccessfully(true);
      message.success({
        content:
          mode === createMode
            ? 'Proveedor creado exitosamente'
            : 'Proveedor actualizado exitosamente',
        key: 'providerSubmit',
      });
      handleOpenModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const formattedPhoneNumber = formatPhoneNumber(value, selectedCountry);
    form.setFieldsValue({ tel: formattedPhoneNumber });
  };

  const onCountryChange = (value: CountryCode) => {
    setSelectedCountry(value);
    const currentPhone = form.getFieldValue('tel');
    if (currentPhone) {
      const formattedPhoneNumber = formatPhoneNumber(currentPhone, value);
      form.setFieldsValue({ tel: formattedPhoneNumber });
    }
  };

  const handleRNCSearch = (value?: string) => {
    const rnc = (value || form.getFieldValue('rnc'))?.trim();
    if (rnc && rnc.length >= 9 && rnc.length <= 11) {
      consultarRNC(rnc);
    }
  };

  const hasDetailsPanel = Boolean(rncInfo || loading);
  const isFormLocked = isSubmitting || hasSubmittedSuccessfully;

  return (
    <>
      <Modal
        title={mode === createMode ? 'Nuevo Proveedor' : 'Editar Proveedor'}
        open={isOpen}
        onCancel={handleOpenModal}
        centered
        footer={[
          <Button key="cancel" onClick={handleOpenModal} disabled={isSubmitting}>
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => form.submit()}
            loading={isSubmitting}
            disabled={isFormLocked}
          >
            {isSubmitting
              ? 'Guardando...'
              : mode === createMode
                ? 'Crear'
                : 'Actualizar'}
          </Button>,
        ]}
        closeIcon={<FontAwesomeIcon icon={faTimes} />}
        width={hasDetailsPanel ? (isWideScreen ? 860 : 500) : 480}
        style={{ maxWidth: 'calc(100vw - 32px)' }}
      >
        <ModalLayout $hasDetails={hasDetailsPanel}>
          <FormPanel $hasDetails={hasDetailsPanel}>
            <AlertStack>
              {differences.length > 0 && (
                <DgiiSyncAlert
                  differences={differences}
                  onSync={syncWithDgii}
                  loading={loading}
                />
              )}
            </AlertStack>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              disabled={isFormLocked}
            >
              <FormGrid>
                <Form.Item
                  label="RNC"
                  name="rnc"
                  rules={[
                    {
                      transform: (value) => value?.trim(),
                      required: true,
                      message: 'Por favor, ingrese el RNC del proveedor.',
                    },
                    {
                      transform: (value) => value?.trim(),
                      pattern: /^[0-9]{9,11}$/,
                      message: 'El RNC debe tener entre 9 y 11 dígitos.',
                    },
                  ]}
                  help={
                    rncInfo?.status === 'SUSPENDIDO' ? (
                      <span style={{ color: '#e49800', fontSize: '13px' }}>
                        ⚠️ Este RNC se encuentra actualmente suspendido en la
                        DGII
                      </span>
                    ) : rncInfo?.status === 'DADO DE BAJA' ? (
                      <span style={{ color: '#ff4d4f', fontSize: '13px' }}>
                        ⚠️ Este RNC se encuentra dado de baja en la DGII
                      </span>
                    ) : null
                  }
                  validateStatus={
                    rncInfo?.status === 'SUSPENDIDO' ||
                    rncInfo?.status === 'DADO DE BAJA'
                      ? 'warning'
                      : undefined
                  }
                >
                  <Input.Search
                    placeholder="101123456"
                    enterButton={
                      <Button type="primary" icon={<GlobalOutlined />}>
                        Buscar RNC
                      </Button>
                    }
                    onSearch={handleRNCSearch}
                    loading={loading}
                  />
                </Form.Item>

                {error && (
                  <p
                    style={{
                      color: 'red',
                      marginTop: '-10px',
                      marginBottom: '10px',
                    }}
                  >
                    {error}
                  </p>
                )}

                {/* Campo Nombre */}
                <Form.Item
                  label={
                    <span>
                      Nombre&nbsp;
                      <Tooltip title="Nombre comercial del proveedor">
                        <InfoCircleOutlined />
                      </Tooltip>
                    </span>
                  }
                  name="name"
                  rules={[
                    {
                      required: true,
                      message: 'Por favor, ingrese el nombre del proveedor.',
                    },
                    {
                      min: 3,
                      message: 'El nombre debe tener al menos 3 caracteres.',
                    },
                    {
                      max: 100,
                      message: 'El nombre no puede exceder 100 caracteres.',
                    },
                  ]}
                >
                  <Input placeholder="Ejemplo: Distribuidora XYZ" />
                </Form.Item>

                <Form.Item
                  label={<OptionalLabel>Email</OptionalLabel>}
                  name="email"
                  rules={[
                    {
                      type: 'email',
                      message: 'Por favor ingrese un email válido',
                    },
                  ]}
                >
                  <Input placeholder="ejemplo@dominio.com" />
                </Form.Item>

                {/* Información de Contacto */}
                <Form.Item
                  label={
                    <Space>
                      <GlobalOutlined />
                      <span>Teléfono</span>
                    </Space>
                  }
                  style={{ marginBottom: 0 }}
                  tooltip="Seleccione el país y escriba el número sin código de área"
                >
                  <Space.Compact style={{ width: '100%' }}>
                    <Form.Item
                      name="country"
                      initialValue="DO"
                      style={{ marginBottom: 0, width: '40%' }}
                    >
                      <Select
                        showSearch
                        options={countryOptions}
                        onChange={onCountryChange}
                        placeholder={
                          <Space>
                            <GlobalOutlined />
                            <span>País</span>
                          </Space>
                        }
                        optionLabelProp="label"
                        filterOption={(input, option) =>
                          (option as CountryOption | undefined)?.searchText
                            ?.toLowerCase()
                            .includes(input.toLowerCase()) ?? false
                        }
                        popupMatchSelectWidth={false}
                        style={{ minWidth: '150px' }}
                      />
                    </Form.Item>
                    <Form.Item
                      name="tel"
                      style={{ flex: 1 }}
                      rules={[
                        {
                          validator: (_, value) => {
                            if (!value) return Promise.resolve();
                            return isValidPhoneNumber(value, selectedCountry)
                              ? Promise.resolve()
                              : Promise.reject(
                                  <span>
                                    Formato inválido para {selectedCountry}
                                    <br />
                                  </span>,
                                );
                          },
                        },
                      ]}
                    >
                      <Input
                        onChange={onPhoneChange}
                        placeholder={`Ejemplo: ${getCountryCallingCode(selectedCountry)} XX XXX XXXX`}
                        type="tel"
                      />
                    </Form.Item>
                  </Space.Compact>
                </Form.Item>

                <Form.Item
                  label={<OptionalLabel>Dirección</OptionalLabel>}
                  name="address"
                >
                  <TextArea
                    placeholder="27 de Febrero #12, Ensanche Ozama, Santo Domingo"
                    rows={5}
                  />
                </Form.Item>

                <Form.Item
                  label="Tipo de Comprobante"
                  name="voucherType"
                  rules={[
                    {
                      required: true,
                      message: 'Por favor, seleccione un tipo de comprobante.',
                    },
                  ]}
                >
                  <Select
                    allowClear
                    placeholder="Seleccione el tipo de comprobante"
                    options={comprobantesOptions}
                  />
                </Form.Item>
              </FormGrid>

              <Form.Item
                label={<OptionalLabel>Notas</OptionalLabel>}
                name="notes"
              >
                <TextArea
                  placeholder="Información adicional sobre el proveedor"
                  rows={3}
                />
              </Form.Item>
            </Form>
          </FormPanel>
          {hasDetailsPanel && (
            <DetailsPanel>
              <RncPanel rncInfo={rncInfo} loading={loading} />
            </DetailsPanel>
          )}
        </ModalLayout>
      </Modal>
    </>
  );
};
