import React, { useEffect, useState } from 'react';
import * as antd from 'antd';
import { InvoiceInfo } from './components/InvoiceInfo/InfoiceInfo';
import { Products } from './components/Products/Products';
import { useDispatch, useSelector } from 'react-redux';
import { addInvoice, changeClientInvoiceForm, changeValueInvoiceForm, closeInvoiceForm, selectInvoice } from '../../../../features/invoice/invoiceFormSlice';
import { Client } from './components/Client/Client';
import { DateTime } from 'luxon';
const { Form, Input, InputNumber, Button, Modal, DatePicker, Select, Row, Col } = antd;
const { Option } = Select;
import { useFormatPrice } from '../../../../hooks/useFormatPrice';
import { fbUpdateInvoice } from '../../../../firebase/invoices/fbUpdateInvoice';
import { selectUser } from '../../../../features/auth/userSlice';
import { InvoiceInfoExtras } from './components/InvoiceInfoExtras/InvoiceInfoExtras';

export const InvoiceForm = ({ }) => {

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [shouldRenderModal, setShouldRenderModal] = useState(false);
  const { invoice, modal } = useSelector(selectInvoice)
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await fbUpdateInvoice(user, invoice);
      dispatch(closeInvoiceForm());
      antd.message.success('Factura actualizada correctamente');
    } catch (info) {
      antd.message.error('Error al actualizar factura');
      console.error('Validate Failed or Update Failed:', info);
    }
  };

  useEffect(() => {
    form.setFieldsValue(invoice)
  }, [invoice]);

  useEffect(() => {
    if (modal.isOpen) {
      setShouldRenderModal(true);
    } else {
      // Esperar que la animación de cierre se complete antes de desmontar el modal
      const timer = setTimeout(() => {
        setShouldRenderModal(false);
      }, 600); // Asumiendo que la animación dura 300ms

      return () => clearTimeout(timer);
    }
  }, [modal.isOpen]);
  const handleCancel = () => {
    dispatch(closeInvoiceForm())
  };

  const sections = [
    {
      key: "1",
      label: "General",
      children: <InvoiceInfo invoice={invoice} />
    },
    {
      key: "2",
      label: "Productos",
      children: <Products invoice={invoice} />
    },
    {
      key: "3",
      label: "Más Detalles",
      children: <InvoiceInfoExtras invoice={invoice} />
    },
  ]
  const handleChange = (value) => {
    const key = Object.keys(value)[0]

    if (key === 'client') {
      dispatch(changeClientInvoiceForm(value))
      return
    }
    if (key === 'discount') {
      console.log(key)
      dispatch(changeValueInvoiceForm({ invoice: { [key]: { value: Number(value.discount.value) } } }));
      return
    }
    dispatch(changeValueInvoiceForm({ invoice: value }))
  }

  return (
    <Modal
      style={{ top: 10 }}
      title={`Editar factura: ${invoice?.NCF ? (invoice?.NCF + " / ") : ""}  ${invoice?.date && (DateTime.fromMillis(invoice?.date).toFormat("dd LLL yyyy"))} `}
      open={modal.isOpen}
      width={800}
      onCancel={handleCancel}
      destroyOnClose
      footer={[
        <div key="1" style={{
          float: 'left',
          alignItems: 'center',
          display: 'flex',
          gap: 16,
        }}>
          <div>
            Total: {useFormatPrice(invoice.totalPurchase.value)}
          </div>
          <div>
            Itbis: {useFormatPrice(invoice.totalTaxes.value)}
          </div>
          <div>
            Items: {invoice.totalShoppingItems.value}
          </div>
        </div>,

        <Button key="back" onClick={handleCancel}>
          Cancelar
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          Guardar
        </Button>,
      ]}
    >
      <Form
        form={form}
        initialValues={invoice}
        layout="vertical"
        onValuesChange={handleChange}
      >

        <antd.Tabs defaultActiveKey='1' items={sections} />
      </Form>
    </Modal>)
}
  ;




