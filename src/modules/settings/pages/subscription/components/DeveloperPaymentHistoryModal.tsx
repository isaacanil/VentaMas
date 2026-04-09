import { faCog } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Col, Form, Input, InputNumber, Modal, Row, Space, Typography } from 'antd';

import type { JSX } from 'react';

interface DeveloperPaymentHistoryModalProps {
    open: boolean;
    onClose: () => void;
    devBusy: boolean;
    paymentAmount: number;
    onPaymentAmountChange: (value: number) => void;
    paymentDescription: string;
    onPaymentDescriptionChange: (value: string) => void;
    onRecordPayment: () => void;
}

export const DeveloperPaymentHistoryModal = ({
    open,
    onClose,
    devBusy,
    paymentAmount,
    onPaymentAmountChange,
    paymentDescription,
    onPaymentDescriptionChange,
    onRecordPayment,
}: DeveloperPaymentHistoryModalProps): JSX.Element => {
    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={
                <Space>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button
                        type="primary"
                        loading={devBusy}
                        disabled={!paymentAmount || paymentAmount <= 0 || !paymentDescription.trim()}
                        onClick={() => {
                            onRecordPayment();
                        }}
                    >
                        Registrar pago manual
                    </Button>
                </Space>
            }
            destroyOnHidden
            width={500}
            title={
                <Space>
                    <FontAwesomeIcon icon={faCog} />
                    Historial manual de pago
                </Space>
            }
        >
            <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
                Registra un pago manual en el historial para pruebas o soporte operativo.
            </Typography.Paragraph>
            <Form layout="vertical">
                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <Form.Item label="Monto" required>
                            <InputNumber
                                min={1}
                                step={100}
                                style={{ width: '100%' }}
                                value={paymentAmount}
                                onChange={(value) => onPaymentAmountChange(Number(value || 0))}
                                placeholder="Ej. 1500"
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} md={16}>
                        <Form.Item label="Descripción" required>
                            <Input
                                value={paymentDescription}
                                onChange={(event) => onPaymentDescriptionChange(event.target.value)}
                                placeholder="Ej. Ajuste manual de pago"
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default DeveloperPaymentHistoryModal;
