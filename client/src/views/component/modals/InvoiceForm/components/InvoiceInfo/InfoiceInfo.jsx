import React, { useEffect, useState } from 'react';
import * as antd from 'antd';
const { Form, Input, Col, Row, Button, Modal, Alert, Typography, Spin } = antd;
import { DateTime, Duration } from 'luxon';
import { Client } from '../Client/Client';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { cancelInvoice, closeInvoiceForm } from '../../../../../../features/invoice/invoiceFormSlice';
import { InvoiceResume } from './components/InvoiceResume';
import { fbCancelInvoice } from '../../../../../../firebase/invoices/fbCancelInvoice';

export const InvoiceInfo = ({ invoice }) => {
  const [isOpenCancelInvoiceConfirm, setIsOpenCancelInvoiceConfirm] = useState(false)

  const defaultDate = invoice?.date && DateTime.fromSeconds(invoice?.date).toFormat('yyyy-LL-dd');
  const handleCloseCancelInvoiceConfirm = () => setIsOpenCancelInvoiceConfirm(false)
  const handleOpenCancelInvoiceConfirm = () => setIsOpenCancelInvoiceConfirm(true)

  return (
    <>
      <Client invoice={invoice} />
      <antd.Divider orientation='left' orientationMargin={false}>Informacion de Pago</antd.Divider>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            label="Monto Pagado"
            name={["payment", "value"]}
          >
            <Input type={"number"} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label="Descuento %"
            name={["discount", "value"]}
            help="Ejemplo: 10 = 10%"
          >
            <Input type="number" />
          </Form.Item>
        </Col>
      </Row>
      <InvoiceResume invoice={invoice} />
      <br />
      < Row gutter={16}>
        <Col>
          <Form.Item>
            <Button danger disabled={invoice.NCF} onClick={
              handleOpenCancelInvoiceConfirm
            }>
              Anular
            </Button>
          </Form.Item>
        </Col>
      </Row>
      <CancelInvoiceConfirm
        isOpen={isOpenCancelInvoiceConfirm}
        invoice={invoice}
        handleClose={handleCloseCancelInvoiceConfirm}
      />
    </>
  );
};


const CancelInvoiceConfirm = ({ isOpen, invoice, handleClose }) => {
  const [form] = Form.useForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const handleOk = async () => {
    setIsLoading(true)
    try {
      const values = await form.validateFields();
      const cancellationReason = values.cancellationReason
      await fbCancelInvoice(user, invoice, cancellationReason)
      dispatch(closeInvoiceForm())
      handleClose()
      antd.message.success('Factura anulada correctamente')
    } catch (error) {
      antd.message.error('Error al anular factura')
    } finally {
      form.resetFields()
      setIsLoading(false)
    }
  }
  const handleCancel = () => {
    form.resetFields()
    handleClose()
  }
  return (

    <Modal
      title="Confirmación de Anulación"
      open={isOpen}
      onOk={handleOk}
      okText="Anular"
      okButtonProps={{ danger: true }}
      onCancel={handleCancel}
    >
      <Spin
        spinning={isLoading}
        tip="Cargando..."
        size="large"
      >


        <Alert
          message={"¿Está seguro que desea anular esta factura?"}
          description={
            <div>
              <ul
                style={
                  {

                    paddingInlineStart: 0
                  }
                }
              >
                <li>
                  <Typography.Text>
                    Esta factura se anulará y no se podrá revertir
                  </Typography.Text>
                </li>
                <li>
                  <Typography.Text>
                    Los productos de esta factura volverán a estar disponibles en el inventario
                  </Typography.Text>
                </li>
              </ul>
            </div>
          }
          type="warning"
          showIcon
        />
        <br />
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            label="Motivo de la anulación"
            name="cancellationReason"
            help="Ejemplo: El cliente se arrepintió de la compra"
            rules={[{ required: true, message: 'Por favor ingrese el motivo de la anulación' }]}
          >
            <Input
              type="text"
              placeholder="Motivo de la anulación"
            />
          </Form.Item>
          <br />
        </Form>
      </Spin>
    </Modal>

  )
}