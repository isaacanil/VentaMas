import { ExclamationCircleOutlined } from '@/constants/icons/antd';
import { Form, Button, Modal, Alert, message, Tabs } from 'antd';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';



import { selectUser } from '@/features/auth/userSlice';
import {
  changeClientInvoiceForm,
  changeValueInvoiceForm,
  closeInvoiceForm,
  selectInvoice,
} from '@/features/invoice/invoiceFormSlice';
import { markAuthorizationUsed } from '@/firebase/authorizations/invoiceEditAuthorizations';
import { fbUpdateInvoice } from '@/firebase/invoices/fbUpdateInvoice';
import { formatPrice } from '@/utils/format';
import { convertInvoiceDateToMillis } from '@/utils/invoice';
import type { UserIdentity } from '@/types/users';
import type { InvoiceData, InvoiceFormSliceState } from '@/types/invoice';

import { InvoiceInfo } from './components/InvoiceInfo/InfoiceInfo';
import { Products } from './components/Products/Products';


export const InvoiceForm = () => {
  const [form] = Form.useForm<InvoiceData>();
  const [loading, setLoading] = useState(false);
  const ignoreDiscountChangeRef = useRef(false);
  const { invoice, modal, authorizationRequest } = useSelector(
    selectInvoice,
  ) as InvoiceFormSliceState;
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserIdentity | null;

  const isEditLocked = useMemo(() => {
    if (!invoice?.date) return true;
    const timestamp = convertInvoiceDateToMillis(invoice.date);
    if (!Number.isFinite(timestamp)) return true;

    const elapsedMs = Date.now() - timestamp;
    const limitMs = 48 * 60 * 60 * 1000;

    return elapsedMs >= limitMs;
  }, [invoice?.date]);

  const handleOk = async () => {
    if (isEditLocked) {
      message.warning(
        'Esta factura superó el límite de 48 horas y no puede modificarse.',
      );
      return;
    }

    if (!user) {
      message.error('No se encontró un usuario válido para actualizar.');
      return;
    }

    if (!invoice?.id) {
      message.error('No se encontró el ID de la factura a actualizar.');
      return;
    }

    try {
      setLoading(true);
      await form.validateFields();
      const invoiceToUpdate = {
        ...invoice,
        id: invoice?.id ?? '',
      } as InvoiceData & { id: string };
      await fbUpdateInvoice(user, invoiceToUpdate);

      if (authorizationRequest?.id) {
        try {
          await markAuthorizationUsed(user, authorizationRequest.id, user);
        } catch (markError) {
          console.warn(
            'No se pudo marcar la autorización como usada',
            markError,
          );
          message.warning(
            'Factura actualizada, pero la autorización no pudo marcarse como usada.',
          );
        }
      }

      dispatch(closeInvoiceForm());
      message.success('Factura actualizada correctamente');
    } catch (info) {
      message.error('Error al actualizar factura');
      console.error('Validate Failed or Update Failed:', info);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!modal?.isOpen) return;
    form.setFieldsValue(invoice);
  }, [form, invoice, modal?.isOpen]);

  const sections = useMemo(
    () => [
      {
        key: '1',
        label: 'General',
        children: <InvoiceInfo invoice={invoice} isEditLocked={isEditLocked} />,
      },
      {
        key: '2',
        label: 'Productos',
        children: <Products invoice={invoice} isEditLocked={isEditLocked} />,
      },
    ],
    [invoice, isEditLocked],
  );

  const handleCancel = () => {
    if (loading) return;
    dispatch(closeInvoiceForm());
  };

  const handleChange = (value: Partial<InvoiceData>) => {
    if (isEditLocked) return;

    const key = Object.keys(value)[0];
    if (!key) return;

    if (key === 'discount' && ignoreDiscountChangeRef.current) {
      ignoreDiscountChangeRef.current = false;
      return;
    }


    if (key === 'client') {
      dispatch(changeClientInvoiceForm({ client: value.client }));
      return;
    }
    if (key === 'discount') {
      const previousValue = Number(invoice?.discount?.value) || 0;
      const rawValue = Number(value?.discount?.value);
      const numericValue = Number.isFinite(rawValue) ? rawValue : 0;

      let normalizedValue = Math.max(0, numericValue);

      if (normalizedValue > 99) {
        message.warning('El descuento no puede superar el 99%.');
        normalizedValue = 99;
      }

      if (normalizedValue !== numericValue) {
        ignoreDiscountChangeRef.current = true;
        form.setFieldsValue({ discount: { value: normalizedValue } });
        return;
      }

      const applyDiscount = (nextValue: number) => {
        dispatch(
          changeValueInvoiceForm({
            invoice: { discount: { value: nextValue } },
          }),
        );
      };

      if (normalizedValue > 90 && normalizedValue !== previousValue) {
        Modal.confirm({
          title: 'Confirmar descuento alto',
          icon: <ExclamationCircleOutlined />,
          content:
            'Un descuento superior al 90% reduce drásticamente la ganancia. ¿Deseas continuar?',
          okText: 'Aplicar descuento',
          cancelText: 'Cancelar',
          onOk: () => {
            applyDiscount(normalizedValue);
          },
          onCancel: () => {
            ignoreDiscountChangeRef.current = true;
            form.setFieldsValue({ discount: { value: previousValue } });
          },
        });
        return;
      }

      applyDiscount(normalizedValue);
      return;
    }
    dispatch(changeValueInvoiceForm({ invoice: value }));
  };

  return (
    <Modal
      style={{ top: 10 }}
      title={`Editar factura: #${invoice?.numberID}${isEditLocked ? ' (solo lectura)' : ''}`}
      open={modal.isOpen}
      width={800}
      onCancel={handleCancel}
      destroyOnClose
      footer={[
        <div
          key="1"
          style={{
            float: 'left',
            alignItems: 'center',
            display: 'flex',
            gap: 16,
          }}
        >
          <div>Total: {formatPrice(invoice?.totalPurchase?.value ?? 0)}</div>
          <div>Itbis: {formatPrice(invoice?.totalTaxes?.value ?? 0)}</div>
          <div>Items: {invoice?.totalShoppingItems?.value ?? 0}</div>
        </div>,

        <Button key="back" onClick={handleCancel} disabled={loading}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleOk}
          loading={loading}
          disabled={isEditLocked}
        >
          Guardar
        </Button>,
      ]}
    >
      {isEditLocked ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="La ventana de edición de 48 horas expiró."
          description="Puedes consultar la información de la factura, pero no es posible modificarla."
        />
      ) : null}
      <Form
        form={form}
        initialValues={invoice}
        layout="vertical"
        onValuesChange={handleChange}
        disabled={isEditLocked}
      >
        <Tabs defaultActiveKey="1" items={sections} />
      </Form>
    </Modal>
  );
};
