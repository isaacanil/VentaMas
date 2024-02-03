import React, { useEffect, useState } from 'react';
import * as antd from 'antd';
import ProductCard from './components/ProductCard';
import { InvoiceInfo } from './components/InvoiceInfo/InfoiceInfo';
import { Products } from './components/Products/Products';
import { useDispatch, useSelector } from 'react-redux';
import { addInvoice, changeClientInvoiceForm, changeValueInvoiceForm, closeInvoiceForm, selectInvoice } from '../../../../features/invoice/invoiceFormSlice';
import { Client } from './components/Client/Client';
import { DateTime } from 'luxon';
const { Form, Input, InputNumber, Button, Modal, DatePicker, Select, Row, Col } = antd;
const { Option } = Select;
import { useFormatPrice } from '../../../../hooks/useFormatPrice';
import { useForm } from 'antd/es/form/Form';
import { fbUpdateInvoice } from '../../../../firebase/invoices/fbUpdateInvoice';
import { selectUser } from '../../../../features/auth/userSlice';
import modalStyle from './InvoiceForm.module.css'
import { InvoiceInfoExtras } from './components/InvoiceInfoExtras/InvoiceInfoExtras';
const data = {
  "id": "LziSjmxV_4A9",
  "sourceOfPurchase": "Presencial",
  "paymentMethod": [
    {
      "name": "Efectivo",
      "status": true,
      "method": "cash",
      "value": 757.6
    },
    {
      "method": "card",
      "status": false,
      "name": "Tarjeta"
    },
    {
      "method": "transfer",
      "name": "Transfer...",
      "status": false
    }
  ],
  "client": {
    "tel": "345697654456",
    "id": "GC-0000",
    "address": "Prueba de direccion",
    "name": "Lucas",
    "personalID": "",
    "delivery": {
      "status": false,
      "value": 0
    }
  },
  "NCF": "B020000000048",
  "totalPurchaseWithoutTaxes": {
    "value": 420
  },
  "totalTaxes": {
    "value": 125.464
  },
  "delivery": {
    "value": "",
    "status": false
  },
  "date": {
    "seconds": 1705066304,
    "nanoseconds": 81000000
  },
  "change": {
    "value": 2
  },
  "products": [
    {
      "barCode": "",
      "netContent": "Prueba",
      "type": "Prueba",
      "tax": {
        "ref": "16%",
        "unit": 0.16,
        "value": 0.16,
        "total": 0.48
      },
      "amountToBuy": {
        "unit": 1,
        "total": 2
      },
      "averagePrice": 30,
      "id": "woqhnKlQY6",
      "minimumPrice": 25,
      "trackInventory": true,
      "productName": "Prueba 1",
      "price": {
        "unit": 40.6,
        "total": 81.2
      },
      "cost": {
        "unit": 20,
        "total": 60
      },
      "isVisible": true,
      "size": "Prueba",
      "productImageURL": "",
      "order": 1,
      "qrCode": "",
      "stock": 97,
      "listPrice": 35,
      "category": "Snacks"
    },
    {
      "size": "Prueba",
      "productImageURL": "",
      "listPrice": 80,
      "netContent": "prueba",
      "trackInventory": true,
      "type": "Prueba",
      "isVisible": true,
      "minimumPrice": 60,
      "price": {
        "unit": 92.8,
        "total": 464
      },
      "barCode": "",
      "stock": -7,
      "category": "Snacks",
      "qrCode": "",
      "id": "dT9NnWDixP",
      "averagePrice": 70,
      "amountToBuy": {
        "unit": 1,
        "total": 5
      },
      "cost": {
        "unit": 40,
        "total": 240
      },
      "tax": {
        "ref": "16%",
        "value": 0.16,
        "total": 0.9600000000000001,
        "unit": 0.16
      },
      "order": 1,
      "productName": "Prueba 2"
    },
    {
      "size": "prueba",
      "productImageURL": "",
      "price": {
        "total": 212.39999999999998,
        "unit": 70.8
      },
      "order": 1,
      "category": "Snacks",
      "qrCode": "prueba QR",
      "barCode": "prueba",
      "minimumPrice": 40,
      "netContent": "Prueba",
      "trackInventory": true,
      "amountToBuy": {
        "unit": 1,
        "total": 3
      },
      "listPrice": 60,
      "type": "Prueba",
      "tax": {
        "ref": "18%",
        "total": 0.72,
        "value": 0.18,
        "unit": 0.18
      },
      "productName": "Prueba 3",
      "isVisible": true,
      "id": "NAHZsBT7zQ",
      "averagePrice": 50,
      "cost": {
        "unit": 30,
        "total": 120
      },
      "stock": 0
    },


  ],
  "payment": {
    "value": 757.6
  },
  "totalPurchase": {
    "value": 757.6
  },
  "totalShoppingItems": {
    "value": 10
  },
  "discount": {
    "value": 0
  }
}

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
      children: (
        <InvoiceInfo invoice={invoice} />
      )
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
    if(key === 'discount'){
      console.log(key)
      dispatch(changeValueInvoiceForm({ invoice: {[key]: {value: Number(value.discount.value)}}}));
      return
    }
    dispatch(changeValueInvoiceForm({ invoice: value }))
  }
  console.log(invoice.products)
  return shouldRenderModal &&

    <Modal
      style={{ top: 10 }}
      title={`Editar factura: ${invoice?.NCF ? (invoice?.NCF + " / ") : ""}  ${invoice?.date && (DateTime.fromMillis(invoice?.date).toFormat("dd LLL yyyy"))} `}
      open={modal.isOpen}
      width={800}
      onCancel={handleCancel}
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
    </Modal>
}
  ;




