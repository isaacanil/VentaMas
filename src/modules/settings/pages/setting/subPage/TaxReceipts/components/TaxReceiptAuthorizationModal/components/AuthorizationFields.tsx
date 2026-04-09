import {
  FileAddOutlined,
  NumberOutlined,
} from '@/constants/icons/antd';
import { Col, Divider, Form, Input, Row } from 'antd';

import DatePicker from '@/components/DatePicker';

import type { AuthorizationFormValues } from '../types';

export const AuthorizationFields = () => {
  return (
    <>
      <Divider>Datos de Autorizacion</Divider>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item<AuthorizationFormValues>
            name="authorizationNumber"
            label="Numero de Autorizacion"
            rules={[
              {
                required: true,
                message: 'Ingrese el numero de autorizacion',
              },
              { pattern: /^\d+$/, message: 'Ingrese solo numeros' },
            ]}
          >
            <Input
              placeholder="Ej: 5004526018"
              prefix={<NumberOutlined />}
              maxLength={20}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item<AuthorizationFormValues>
            name="requestNumber"
            label="Numero de Solicitud"
            rules={[
              {
                required: true,
                message: 'Ingrese el numero de solicitud',
              },
              { pattern: /^\d+$/, message: 'Ingrese solo numeros' },
            ]}
          >
            <Input
              placeholder="Ej: 5009083898"
              prefix={<NumberOutlined />}
              maxLength={20}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item<AuthorizationFormValues>
            name="startSequence"
            label="Secuencia Inicial"
            rules={[
              {
                required: true,
                message: 'Ingrese la secuencia inicial',
              },
              { pattern: /^\d+$/, message: 'Ingrese solo numeros' },
            ]}
          >
            <Input
              placeholder="Ej: 1000001537"
              prefix={<FileAddOutlined />}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item<AuthorizationFormValues>
            name="approvedQuantity"
            label="Cantidad Aprobada"
            rules={[
              {
                required: true,
                message: 'Ingrese la cantidad aprobada',
              },
              { pattern: /^\d+$/, message: 'Ingrese solo numeros' },
            ]}
          >
            <Input placeholder="Ej: 324" type="number" min={1} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item<AuthorizationFormValues>
            name="expirationDate"
            label="Fecha de Vencimiento"
            rules={[
              {
                required: true,
                message: 'Seleccione la fecha de vencimiento',
              },
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="Seleccione fecha"
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};
