import { InputNumber, Select, Form, Input } from 'antd';
import DatePicker from '@/components/DatePicker';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';

import { SelectCartData } from '../../../../../../../../../../../features/cart/cartSlice';
import { selectClient } from '../../../../../../../../../../../features/clientCart/clientCartSlice';
import {
  selectInsuranceAR,
  setInsuranceAR,
} from '../../../../../../../../../../../features/insurance/insuranceAccountsReceivableSlice';
import { calculateAmountPerInstallment } from '../../../../../../../../../../../utils/accountsReceivable/accountsReceivable';
import { getMaxInstallments } from '../../../../../../../../../../../utils/accountsReceivable/getMaxInstallments';
import DateUtils from '../../../../../../../../../../../utils/date/dateUtils';
import { setNumPrecision } from '../../../../../../../../../../../utils/pricing';
import usePaymentDates from '../ReceivableManagementPanel/usePaymentDates';


const { Option } = Select;
const { TextArea } = Input;

export const InsuranceManagementPanel = ({ form }) => {
  const dispatch = useDispatch();
  const cartData = useSelector(SelectCartData);
  const client = useSelector(selectClient);
  const insuranceAR = useSelector(selectInsuranceAR);

  const {
    paymentFrequency,
    totalInstallments,
    installmentAmount,
    totalReceivable,
    paymentDate,
    comments,
  } = insuranceAR;

  const insuranceCoverage = cartData?.totalInsurance?.value || 0;

  const containerVariants = {
    hidden: {
      opacity: 0,
      scaleY: 0.1,
      height: 0,
      transition: { duration: 0.3 },
    },
    visible: {
      opacity: 1,
      scaleY: 1,
      height: 'auto',
      transition: { duration: 0.5 },
    },
  };

  const maxInstallments = getMaxInstallments(paymentFrequency);

  const getPositive = (value) => (value < 0 ? value * -1 : value);

  // Usar la misma función de cálculo que en ReceivableManagementPanel
  const calculateInsuranceAmountPerInstallment = useMemo(() => {
    if (!totalInstallments || totalInstallments <= 0) return 0;
    return calculateAmountPerInstallment(insuranceCoverage, totalInstallments);
  }, [totalInstallments, insuranceCoverage]);

  // Usar el hook de fechas de pago de ReceivableManagementPanel
  const { nextPaymentDate } = usePaymentDates(
    paymentFrequency,
    totalInstallments,
  );

  // Manejadores de cambios en el formulario - usando setInsuranceAR con el objeto correcto
  const setFrequency = useCallback(
    (value) => dispatch(setInsuranceAR({ paymentFrequency: value })),
    [dispatch],
  );
  const setInstallments = useCallback(
    (value) =>
      dispatch(setInsuranceAR({ totalInstallments: Number(value) || 1 })),
    [dispatch],
  );
  const setAmountPerInstallment = useCallback(
    (value) =>
      dispatch(
        setInsuranceAR({
          installmentAmount: getPositive(setNumPrecision(value)),
        }),
      ),
    [dispatch],
  );
  const setTotalReceivable = useCallback(
    (value) => dispatch(setInsuranceAR({ totalReceivable: value })),
    [dispatch],
  );
  const setPaymentDate = useCallback(
    (value) => dispatch(setInsuranceAR({ paymentDate: value })),
    [dispatch],
  );
  const setComments = useCallback(
    (value) => dispatch(setInsuranceAR({ comments: value })),
    [dispatch],
  );

  // Actualizar el monto por cuota cuando cambie el número de cuotas o el monto del seguro
  useEffect(() => {
    if (insuranceCoverage > 0 && totalInstallments > 0) {
      if (
        Math.abs(calculateInsuranceAmountPerInstallment - installmentAmount) >
        0.01
      ) {
        setAmountPerInstallment(calculateInsuranceAmountPerInstallment);
      }
    }
  }, [
    insuranceCoverage,
    totalInstallments,
    calculateInsuranceAmountPerInstallment,
    installmentAmount,
    setAmountPerInstallment,
  ]);

  // Establecer el monto total del seguro
  useEffect(() => {
    if (
      insuranceCoverage > 0 &&
      Math.abs(insuranceCoverage - totalReceivable) > 0.01
    ) {
      setTotalReceivable(insuranceCoverage);
    }
  }, [insuranceCoverage, totalReceivable, setTotalReceivable]);

  // Actualizar el clientId en el estado
  useEffect(() => {
    if (client?.id && client.id !== insuranceAR.clientId) {
      dispatch(setInsuranceAR({ clientId: client.id }));
    }
  }, [client?.id, insuranceAR.clientId, dispatch]);

  // Actualizar fecha de pago cuando cambie nextPaymentDate
  useEffect(() => {
    if (nextPaymentDate && nextPaymentDate !== paymentDate) {
      setPaymentDate(nextPaymentDate);
    }
  }, [nextPaymentDate, paymentDate, setPaymentDate]);

  // Pasar al formulario los datos del seguro para ser accesibles en el envío
  useEffect(() => {
    if (form) {
      const formValues = {
        insurancePaymentFrequency: paymentFrequency,
        insuranceTotalInstallments: totalInstallments,
        insuranceInstallmentAmount: installmentAmount,
        insuranceType: 'medical',
        insuranceTotalReceivable: totalReceivable,
        insuranceComments: comments,
        insurancePaymentDate: DateUtils.convertMillisToDayjs(paymentDate),
      };

      form.setFieldsValue(formValues);
    }
  }, [
    form,
    paymentFrequency,
    totalInstallments,
    installmentAmount,
    totalReceivable,
    comments,
    paymentDate,
  ]);

  // El seguro solo se muestra si hay cobertura de seguro
  if (!insuranceCoverage || insuranceCoverage <= 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <PanelContainer
        key="insurance-management-panel"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={containerVariants}
      >
        <Header>
          <Label>Configuración de Seguro Médico</Label>
        </Header>
        <Form layout="vertical" form={form}>
          <Group>
            <FormItem
              label="Frecuencia de Pago"
              name="insurancePaymentFrequency"
              initialValue={paymentFrequency}
              rules={[
                {
                  required: true,
                  message: 'Por favor seleccione una frecuencia de pago',
                },
              ]}
            >
              <Select style={{ width: '100%' }} onChange={setFrequency}>
                <Option value="monthly">Mensual</Option>
                <Option value="weekly">Semanal</Option>
              </Select>
            </FormItem>
            <FormItem
              label="Cuotas"
              name="insuranceTotalInstallments"
              initialValue={totalInstallments}
              rules={[
                {
                  required: true,
                  message: 'Por favor seleccione el número de cuotas',
                },
                {
                  type: 'number',
                  min: 1,
                  max: maxInstallments,
                  message: `El número de cuotas debe estar entre 1 y ${maxInstallments}`,
                },
              ]}
            >
              <InputNumber
                onChange={setInstallments}
                style={{ width: '100%' }}
              />
            </FormItem>
          </Group>
          <Group>
            <FormItem
              label="Fecha de Pago"
              name="insurancePaymentDate"
              rules={[
                {
                  required: true,
                  message: 'Por favor seleccione una fecha de pago',
                },
              ]}
            >
              <DatePicker
                format={'DD/MM/YYYY'}
                style={{ width: '100%' }}
                onChange={(date) =>
                  setPaymentDate(date ? date.toMillis() : null)
                }
              />
            </FormItem>
            <FormItem label="Monto por Cuota" name="insuranceInstallmentAmount">
              <div
                style={{
                  textAlign: '',
                  fontWeight: 600,
                }}
              >
                <span>{formatPrice(installmentAmount)}</span>
              </div>
            </FormItem>
          </Group>
          <FormItem label="Comentarios" name="insuranceComments">
            <TextArea rows={3} onChange={(e) => setComments(e.target.value)} />
          </FormItem>
          <FormItem
            label="Tipo de Seguro"
            name="insuranceType"
            initialValue="medical"
            hidden
          >
            <Input type="hidden" />
          </FormItem>
        </Form>
        <Footer>
          <Header>
            <Label>Total Cobertura de Seguro</Label>
            <Label>{formatPrice(insuranceCoverage)}</Label>
          </Header>
        </Footer>
      </PanelContainer>
    </AnimatePresence>
  );
};

const PanelContainer = styled(motion.div)`
  padding: 6px 12px;
  background: #f4f4f4;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgb(0 0 0 / 10%);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.2em 0;
`;

const Footer = styled.div`
  &:nth-child(n) {
    div {
      border-bottom: 1px solid #ccc;

      &:last-child {
        border-bottom: 0;
      }
    }
  }
`;

const Label = styled.span`
  display: block;
  margin-bottom: 5px;
  font-size: 1.1em;
  font-weight: 600;
  color: #333;
`;

const FormItem = styled(Form.Item)`
  margin-bottom: 15px;
`;

const Group = styled.div`
  display: grid;
  grid-template-columns: 1fr 0.8fr;
  gap: 1em;
`;
