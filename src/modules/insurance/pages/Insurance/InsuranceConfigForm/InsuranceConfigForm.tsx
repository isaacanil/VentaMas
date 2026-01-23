import {
  PlusOutlined,
  DeleteOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  NumberOutlined,
  CalendarOutlined,
} from '@/constants/icons/antd';
import { nanoid } from '@reduxjs/toolkit';
import { Form, Input, Modal, Button, Space, message } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import {
  closeInsuranceConfigModal,
  selectInsuranceConfigModal,
} from '@/features/insurance/insuranceConfigModalSlice';
import { saveInsuranceConfig } from '@/firebase/insurance/insuranceService';

import { PeriodSelectionModal } from './components/PeriodSelectionModal';
import { PAYMENT_TERMS, TIME_UNITS } from './constants';

type TimeUnit = 'day' | 'week' | 'month' | 'year';

interface PeriodValue {
  value: number;
  timeUnit: TimeUnit;
  isPredefined: boolean;
  days?: number;
}

interface InsuranceTypeForm {
  id: string;
  type: string;
  paymentTerm: PeriodValue | null;
  paymentTermDisplay: string;
  prescriptionValidity: PeriodValue | null;
  prescriptionValidityDisplay: string;
}

interface InsuranceFormValues {
  insuranceName?: string;
  insuranceCompanyName?: string;
  insuranceCompanyRNC?: string;
}

interface RawInsuranceType {
  id?: string;
  type?: string;
  paymentTerm?: unknown;
  prescriptionValidity?: unknown;
  paymentTermDisplay?: string;
  prescriptionValidityDisplay?: string;
  [key: string]: unknown;
}

interface RawInsuranceConfig {
  id?: string;
  insuranceName?: string;
  insuranceCompanyName?: string;
  insuranceCompanyRNC?: string;
  insuranceTypes?: RawInsuranceType[];
  [key: string]: unknown;
}

interface EditingFieldState {
  index: number | null;
  field: 'paymentTerm' | 'prescriptionValidity' | null;
  currentValue?: {
    value?: number;
    timeUnit?: TimeUnit;
    displayText?: string;
    isPredefined?: boolean;
    days?: number;
  };
}

type UserWithBusinessAndUid = {
  businessID: string;
  uid: string;
  [key: string]: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

// Styled Components
const StyledFormSection = styled.div`
  padding: 1em 0 0.4em;
  background: white;
  border-radius: 8px;
  transition: all 0.3s ease;
`;

const StyledSectionTitle = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #1f1f1f;

  .anticon {
    font-size: 18px;
    color: #1890ff;
  }
`;

const StyledTypeContainer = styled(StyledFormSection)`
  position: relative;
  padding: 12px;
  margin-bottom: 8px;
  background: #fafafa;
  border: 1px solid #f0f0f0;

  &:last-child {
    margin-bottom: 0;
  }

  .delete-button {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 10;
    transition: all 0.2s;
  }

  &:hover .delete-button {
    color: #ff4d4f;
    background: #fff0f0;
  }
`;

const StyledGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 12px;
  align-items: start;

  .ant-form-item {
    margin-bottom: 0;
  }
`;

const PlansContainer = styled.div`
  max-height: 400px;
  padding-right: 8px;
  margin: 16px 0;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d9d9d9;
    border-radius: 3px;
  }
`;

const StyledFooter = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 16px 0;
  margin-top: 24px;
  border-top: 1px solid #f0f0f0;
`;

const StyledAddButton = styled.button`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px;
  color: #1890ff;
  cursor: pointer;
  background: transparent;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  transition: all 0.3s;

  &:hover {
    color: #40a9ff;
    border-color: #1890ff;
  }

  .anticon {
    font-size: 16px;
  }
`;

const InsuranceConfigForm = () => {
  const dispatch = useDispatch();
  const modalState = useSelector(selectInsuranceConfigModal) as {
    isOpen: boolean;
    initialValues: RawInsuranceConfig | null;
  };
  const { isOpen, initialValues } = modalState;
  const user = useSelector(selectUser) as UserWithBusinessAndUid | null;
  const [form] = Form.useForm<InsuranceFormValues>();
  const [loading, setLoading] = useState(false);
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceTypeForm[]>(
    [],
  );
  const [initialized, setInitialized] = useState(false);
  const [periodModalVisible, setPeriodModalVisible] = useState(false);
  const [currentEditingField, setCurrentEditingField] =
    useState<EditingFieldState>({
      index: null,
      field: null,
    });

  useEffect(() => {
    if (isOpen && !initialized) {
      if (Array.isArray(initialValues?.insuranceTypes)) {
        const updatedTypes = initialValues.insuranceTypes.map((type) => {
          // Asegurarse de que cada tipo tenga un id
          const typeWithId = {
            ...type,
            id: typeof type.id === 'string' ? type.id : nanoid(),
          };

          // Convertir los valores antiguos al nuevo formato si es necesario
          const convertPeriod = (period: unknown): PeriodValue | null => {
            if (!period) return null;

            // Si ya tiene el formato nuevo con isPredefined, lo devolvemos tal cual
            if (isRecord(period) && typeof period.isPredefined === 'boolean') {
              if (
                typeof period.value === 'number' &&
                typeof period.timeUnit === 'string'
              ) {
                return {
                  value: period.value,
                  timeUnit: period.timeUnit as TimeUnit,
                  isPredefined: period.isPredefined,
                  days: typeof period.days === 'number' ? period.days : undefined,
                };
              }
            }

            // Si es un número, buscamos si coincide con algún período predefinido
            if (typeof period === 'number') {
              const predefinedPeriod = PAYMENT_TERMS.find(
                (t) => t.days === period,
              );
              if (predefinedPeriod) {
                return {
                  value: predefinedPeriod.value,
                  timeUnit: predefinedPeriod.timeUnit,
                  days: predefinedPeriod.days,
                  isPredefined: true,
                };
              }
            }

            // Si tiene el formato value y timeUnit pero no isPredefined
            if (
              isRecord(period) &&
              typeof period.value === 'number' &&
              typeof period.timeUnit === 'string'
            ) {
              const totalDays =
                period.value *
                (TIME_UNITS.find((u) => u.unit === period.timeUnit)?.value ||
                  1);
              const predefinedPeriod = PAYMENT_TERMS.find(
                (t) => t.days === totalDays,
              );

              if (predefinedPeriod) {
                return {
                  value: predefinedPeriod.value,
                  timeUnit: predefinedPeriod.timeUnit,
                  days: predefinedPeriod.days,
                  isPredefined: true,
                };
              } else {
                return {
                  value: period.value,
                  timeUnit: period.timeUnit as TimeUnit,
                  isPredefined: false,
                };
              }
            }

            return null;
          };

          const paymentTerm = convertPeriod(type.paymentTerm);
          const prescriptionValidity = convertPeriod(type.prescriptionValidity);

          return {
            ...typeWithId,
            paymentTerm,
            prescriptionValidity,
            paymentTermDisplay:
              type.paymentTermDisplay || getDisplayText(paymentTerm),
            prescriptionValidityDisplay:
              type.prescriptionValidityDisplay ||
              getDisplayText(prescriptionValidity),
          } as InsuranceTypeForm;
        });
        setInsuranceTypes(updatedTypes);
      }
      form.setFieldsValue({
        insuranceName: initialValues?.insuranceName ?? '',
        insuranceCompanyName: initialValues?.insuranceCompanyName ?? '',
        insuranceCompanyRNC: initialValues?.insuranceCompanyRNC ?? '',
      });
      setInitialized(true);
    }
  }, [isOpen, initialized, initialValues, form]);

  const getDisplayText = (period: PeriodValue | null): string => {
    if (!period) return '';

    if (period.isPredefined) {
      const predefinedPeriod = PAYMENT_TERMS.find(
        (t) => t.days === period.days,
      );
      return predefinedPeriod?.label || '';
    }

    const timeUnit = TIME_UNITS.find((u) => u.unit === period.timeUnit);
    if (!timeUnit) return '';
    return `${period.value} ${period.value === 1 ? timeUnit.label : timeUnit.pluralLabel}`;
  };

  const resetForm = useCallback(() => {
    form.resetFields();
    setInsuranceTypes([]);
  }, [form]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      setInitialized(false);
    }
  }, [isOpen, resetForm]);

  const addInsuranceType = () => {
    setInsuranceTypes([
      ...insuranceTypes,
      {
        id: nanoid(),
        type: '',
        paymentTerm: null,
        paymentTermDisplay: '',
        prescriptionValidity: null,
        prescriptionValidityDisplay: '',
      },
    ]);
  };
  const removeInsuranceType = (indexToRemove: number) => {
    setInsuranceTypes((prevTypes) => {
      const updatedTypes = prevTypes.filter(
        (_, index) => index !== indexToRemove,
      );
      return updatedTypes;
    });
  };

  const handleCancel = () => {
    resetForm();
    dispatch(closeInsuranceConfigModal());
  };

  const handleSubmit = async (values: InsuranceFormValues) => {
    // Validar que todos los campos del formulario principal estén llenos
    if (
      !values.insuranceName ||
      !values.insuranceCompanyName ||
      !values.insuranceCompanyRNC
    ) {
      message.error('Por favor complete todos los campos del formulario');
      return;
    }

    // Validar que haya al menos un tipo de plan
    if (insuranceTypes.length === 0) {
      message.error('Debe agregar al menos un tipo de plan');
      return;
    }

    // Validar que todos los tipos de planes tengan sus campos completos
    const hasEmptyFields = insuranceTypes.some(
      (type) =>
        !type.type ||
        !type.paymentTerm?.value ||
        !type.prescriptionValidity?.value,
    );

    if (hasEmptyFields) {
      message.error(
        'Por favor complete todos los campos en los tipos de planes',
      );
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        ...initialValues,
        ...values,
        insuranceTypes: insuranceTypes.map((type) => ({
          id: type.id,
          type: type.type,
          paymentTerm: {
            value: type.paymentTerm!.value,
            timeUnit: type.paymentTerm!.timeUnit,
          },
          prescriptionValidity: {
            value: type.prescriptionValidity!.value,
            timeUnit: type.prescriptionValidity!.timeUnit,
          },
        })),
      };

      await saveInsuranceConfig(user as UserWithBusinessAndUid, dataToSave);
      message.success('Configuración guardada exitosamente');
      resetForm();
      dispatch(closeInsuranceConfigModal());
    } catch (err) {
      console.error('Error al guardar:', err);
      message.error('No se pudo guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const openPeriodModal = (
    index: number,
    field: 'paymentTerm' | 'prescriptionValidity',
  ) => {
    const currentType = insuranceTypes[index];
    const currentValue = currentType[field];

    setCurrentEditingField({
      index,
      field,
      currentValue: {
        value: currentValue?.value,
        timeUnit: currentValue?.timeUnit,
        displayText: currentType[`${field}Display`],
        isPredefined: currentValue?.isPredefined,
        days: currentValue?.days,
      },
    });
    setPeriodModalVisible(true);
  };

  const handlePeriodSelect = (periodInfo: PeriodValue & { displayText: string }) => {
    const { index, field } = currentEditingField;
    if (index === null || field === null) return;
    setInsuranceTypes((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: {
          value: periodInfo.value,
          timeUnit: periodInfo.timeUnit,
          isPredefined: periodInfo.isPredefined,
          days: periodInfo.days,
        },
        [`${field}Display`]: periodInfo.displayText,
      };
      return updated;
    });
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <BankOutlined />
            <span>{initialValues?.id ? 'Editar Seguro' : 'Nuevo Seguro'}</span>
          </Space>
        }
        open={isOpen}
        onCancel={handleCancel}
        footer={null}
        maskClosable={false}
        width={800}
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <StyledFormSection>
            <StyledSectionTitle>
              <SafetyCertificateOutlined />
              Información General
            </StyledSectionTitle>
            <Form.Item
              name="insuranceName"
              label="Nombre del Seguro"
              rules={[
                {
                  required: true,
                  message: 'Por favor ingrese el nombre del seguro',
                },
              ]}
            >
              <Input placeholder="Ej: Seguro de Salud Premium" />
            </Form.Item>
          </StyledFormSection>

          <StyledFormSection>
            <StyledSectionTitle>
              <BankOutlined />
              Información de la Aseguradora
            </StyledSectionTitle>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item
                name="insuranceCompanyName"
                label="Nombre de la Empresa"
                style={{ flex: 2 }}
                rules={[
                  {
                    required: true,
                    message:
                      'Por favor ingrese el nombre de la empresa de seguro',
                  },
                ]}
              >
                <Input prefix={<BankOutlined />} placeholder="Ej: Mapfre" />
              </Form.Item>

              <Form.Item
                name="insuranceCompanyRNC"
                label="RNC"
                style={{ flex: 1 }}
                rules={[
                  { required: true, message: 'Por favor ingrese el RNC' },
                ]}
              >
                <Input
                  prefix={<NumberOutlined />}
                  placeholder="Ej: 123456789"
                />
              </Form.Item>
            </div>
          </StyledFormSection>

          <StyledSectionTitle style={{ margin: '24px 0 16px' }}>
            <SafetyCertificateOutlined />
            Tipos de Planes
          </StyledSectionTitle>

          <PlansContainer>
            {insuranceTypes.map((insuranceType, index) => (
              <StyledTypeContainer key={insuranceType.id}>
                <Button
                  type="text"
                  danger
                  size="small"
                  className="delete-button"
                  icon={<DeleteOutlined />}
                  onClick={() => removeInsuranceType(index)}
                />

                <StyledGrid>
                  <Form.Item label="Tipo de Plan" rules={[{ required: true }]}>
                    <Input
                      size="middle"
                      value={insuranceType.type}
                      onChange={(e) => {
                        setInsuranceTypes((prev) => {
                          const updated = [...prev];
                          updated[index] = {
                            ...updated[index],
                            type: e.target.value,
                          };
                          return updated;
                        });
                      }}
                      placeholder="Ej: Premium, Básico"
                    />
                  </Form.Item>

                  <Form.Item label="Tiempo Pago" rules={[{ required: true }]}>
                    <Input
                      size="middle"
                      value={
                        insuranceType.paymentTermDisplay ||
                        getDisplayText(insuranceType.paymentTerm)
                      }
                      placeholder="Seleccionar período"
                      readOnly
                      onClick={() => openPeriodModal(index, 'paymentTerm')}
                      suffix={<CalendarOutlined />}
                    />
                  </Form.Item>

                  <Form.Item label="Vigencia" rules={[{ required: true }]}>
                    <Input
                      size="middle"
                      value={
                        insuranceType.prescriptionValidityDisplay ||
                        getDisplayText(insuranceType.prescriptionValidity)
                      }
                      placeholder="Seleccionar vigencia"
                      readOnly
                      onClick={() =>
                        openPeriodModal(index, 'prescriptionValidity')
                      }
                      suffix={<CalendarOutlined />}
                    />
                  </Form.Item>
                </StyledGrid>
              </StyledTypeContainer>
            ))}
          </PlansContainer>

          <StyledAddButton onClick={addInsuranceType}>
            <PlusOutlined />
            Agregar Nuevo Tipo de Seguro
          </StyledAddButton>

          <StyledFooter>
            <Button onClick={handleCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {initialValues?.id ? 'Actualizar' : 'Guardar'}
            </Button>
          </StyledFooter>
        </Form>
      </Modal>

      <PeriodSelectionModal
        visible={periodModalVisible}
        onClose={() => setPeriodModalVisible(false)}
        onSelect={handlePeriodSelect}
        title={
          currentEditingField.field === 'paymentTerm'
            ? 'Seleccionar Tiempo de Pago'
            : 'Seleccionar Vigencia'
        }
        currentValue={currentEditingField.currentValue}
      />
    </>
  );
};

export default InsuranceConfigForm;
