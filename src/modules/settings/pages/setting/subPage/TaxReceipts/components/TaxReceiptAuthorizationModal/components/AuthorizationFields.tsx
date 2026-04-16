import {
  NumberOutlined,
  QuestionCircleOutlined,
} from '@/constants/icons/antd';
import { Col, Form, Input, Row, Tooltip } from 'antd';
import styled from 'styled-components';

import DatePicker from '@/components/DatePicker';

import type { AuthorizationFormValues } from '../types';
import { resolveReceiptIncrease } from '../utils/taxReceiptAuthorizationModal';

interface AuthorizationFieldsProps {
  increase?: number | string | null;
}

export const AuthorizationFields = ({ increase }: AuthorizationFieldsProps) => {
  const startSeq = Form.useWatch<string>('startSequence');
  const qty = Form.useWatch<string>('approvedQuantity');
  const safeIncrease = resolveReceiptIncrease(increase);

  const computedEndLabel = (() => {
    const s = parseInt(String(startSeq ?? ''), 10);
    const q = parseInt(String(qty ?? ''), 10);
    if (!isNaN(s) && !isNaN(q) && q > 0) {
      return `Fin de rango: ${(
        s +
        safeIncrease * (q - 1)
      ).toLocaleString('es-DO')}`;
    }
    return undefined;
  })();

  return (
    <>
      <SectionLabel>Datos del rango autorizado</SectionLabel>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item<AuthorizationFormValues>
            name="authorizationNumber"
            label={
              <TooltipLabel>
                Número de autorización DGII
                <Tooltip title="Número de aprobación que la DGII emite al autorizar el talonario de comprobantes.">
                  <QuestionCircleOutlined />
                </Tooltip>
              </TooltipLabel>
            }
            rules={[
              {
                required: true,
                message: 'Ingrese el número de autorización',
              },
              { pattern: /^\d+$/, message: 'Ingrese solo números' },
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
            label={
              <TooltipLabel>
                Número de solicitud DGII
                <Tooltip title="Número de la solicitud enviada a la DGII para obtener la autorización del rango.">
                  <QuestionCircleOutlined />
                </Tooltip>
              </TooltipLabel>
            }
            rules={[
              {
                required: true,
                message: 'Ingrese el número de solicitud',
              },
              { pattern: /^\d+$/, message: 'Ingrese solo números' },
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
            label="Inicio del rango"
            rules={[
              {
                required: true,
                message: 'Ingrese el inicio del rango',
              },
              { pattern: /^\d+$/, message: 'Ingrese solo números' },
            ]}
          >
            <Input
              placeholder="Ej: 1000001537"
              prefix={<NumberOutlined />}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item<AuthorizationFormValues>
            name="approvedQuantity"
            label="Cantidad autorizada"
            extra={computedEndLabel}
            rules={[
              {
                required: true,
                message: 'Ingrese la cantidad autorizada',
              },
              { pattern: /^\d+$/, message: 'Ingrese solo números' },
            ]}
          >
            <Input placeholder="Ej: 324" min={1} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item<AuthorizationFormValues>
            name="expirationDate"
            label="Vigencia hasta"
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

const SectionLabel = styled.p`
  margin: 0 0 10px;
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
`;

const TooltipLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;

  .anticon {
    color: var(--ds-color-text-muted);
    cursor: help;
    font-size: 12px;
  }
`;
