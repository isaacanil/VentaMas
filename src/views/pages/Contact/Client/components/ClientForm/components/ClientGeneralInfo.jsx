import React, { useEffect } from 'react'
import * as antd from 'antd';
import styled from 'styled-components';
import { fbDeleteClient } from '../../../../../../../firebase/client/fbDeleteClient';
import { selectUser } from '../../../../../../../features/auth/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import { toggleClientModal } from '../../../../../../../features/modals/modalSlice';
import { OPERATION_MODES } from '../../../../../../../constants/modes';
import { GlobalOutlined } from '@ant-design/icons';
import { useRncSearch } from '../../../../../../../hooks/useRncSearch';
import { DgiiSyncAlert } from '../../../../../../component/Rnc/DgiiSyncAlert/DgiiSyncAlert';
import { RncPanel } from '../../../../../../component/Rnc/RncPanel/RncPanel';
const { Form, Input, Button, notification, Space } = antd;

const Wrapper = styled.div`
    display: grid;
    gap: 1em;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
`;

export const ClientGeneralInfo = ({ 
    form, 
    customerData, 
    creditLimitForm, 
    isUpdating, 
    handleSubmit, 
    loading: submitLoading, 
    submitted 
}) => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();
    const update = OPERATION_MODES.UPDATE.id;
    const create = OPERATION_MODES.CREATE.id;
    const { loading, error, rncInfo, differences, consultarRNC, syncWithDgii, compareDgiiData } = useRncSearch(form, 'personalID');

    // Add formValues watch for comparison
    const formValues = Form.useWatch([], form);

    // Add effects for RNC handling
    useEffect(() => {
        if (rncInfo && formValues) {
            compareDgiiData(formValues, rncInfo);
        }
    }, [formValues, rncInfo, compareDgiiData]);

    useEffect(() => {
        // Check RNC when component loads with customerData
        if (customerData?.personalID) {
            const rnc = customerData.personalID.trim();
            if (rnc.length >= 9 && rnc.length <= 11) {
                consultarRNC(rnc, true); // true for silent mode
            }
        }
    }, [customerData]);

    const handleDeleteUser = async () => {
        antd.Modal.confirm({
            title: '¿Está seguro de eliminar este cliente?',
            content: `Se eliminará permanentemente el cliente "${customerData.name}". Esta acción no se puede deshacer.`,
            okText: 'Sí, eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    await fbDeleteClient(user.businessID, customerData.id);

                    form.resetFields();
                    creditLimitForm.resetFields();

                    notification.success({
                        message: 'Cliente Eliminado',
                        description: 'El cliente ha sido eliminado correctamente'
                    });
                    dispatch(toggleClientModal({ mode: create }));
                } catch (error) {
                    notification.error({
                        message: 'Error al eliminar',
                        description: 'No se pudo eliminar el cliente. Inténtelo de nuevo.'
                    });
                }
            }
        });
    }

    const handleRNCSearch = (value) => {
        const rnc = (value || form.getFieldValue('personalID'))?.trim();
        if (rnc && rnc.length >= 9 && rnc.length <= 11) {
            consultarRNC(rnc);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.stopPropagation(); // Previene que el evento llegue al document
        }
    };

    const hasRncPanel = loading || rncInfo;

    return (
        <Wrapper $hasRnc={hasRncPanel}>
            <div>
                {differences.length > 0 && (
                    <DgiiSyncAlert
                        differences={differences}
                        onSync={syncWithDgii}
                        loading={loading}
                    />
                )}
                <Form
                    form={form}
                    layout="vertical"
                    name="form_in_modal"
                    initialValues={{
                        ...customerData,
                        modifier: 'public',
                    }}
                >
                    <Form.Item
                        name="personalID"

                        label={<span>Cédula/RNC</span>}
                        validateStatus={error ? 'error' : undefined}
                        help={
                            error ? (
                                <span style={{ color: '#ff4d4f' }}>
                                    {error}
                                </span>
                            ) : rncInfo?.status === 'SUSPENDIDO' ? (
                                <span style={{ color: '#e49800', fontSize: '13px' }}>
                                    ⚠️ Este RNC se encuentra actualmente suspendido en la DGII
                                </span>
                            ) : rncInfo?.status === 'DADO DE BAJA' ? (
                                <span style={{ color: '#ff4d4f', fontSize: '13px' }}>
                                    ⚠️ Este RNC se encuentra dado de baja en la DGII
                                </span>
                            ) : null
                        }
                    >
                        <Input.Search
                            placeholder="Cédula o RNC"

                            enterButton={
                                <Button
                                    type="primary"
                                    icon={<GlobalOutlined />}
                                >
                                    Buscar RNC
                                </Button>
                            }
                            onSearch={handleRNCSearch}
                            onKeyDown={handleKeyDown}
                            loading={loading}
                            disabled={loading}
                        />
                    </Form.Item>

                    {error && (
                        <p style={{ color: 'red', marginTop: '-10px', marginBottom: '10px' }}>
                            {error}
                        </p>
                    )}

                    <Form.Item
                        name="name"
                        label="Nombre Completo"
                        rules={[
                            {
                                required: true,
                                message: 'Por favor ingrese el nombre del cliente',
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <FlexContainer>
                        <Form.Item
                            name="tel"
                            label="Teléfono 1"
                            style={{
                                width: '100%'
                            }}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="tel2"
                            label="Teléfono 2"
                            style={{
                                width: '100%'
                            }}
                        >
                            <Input />
                        </Form.Item>

                    </FlexContainer>

                    <Form.Item
                        name="address"
                        label="Dirección"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="sector"
                        label="Sector"
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="province"
                        label="Provincia"
                    >
                        <Input />
                    </Form.Item>
                    
                    <ButtonContainer>
                        <DeleteButtonContainer>
                            <Button danger onClick={handleDeleteUser}>
                                Eliminar Cliente
                            </Button>
                        </DeleteButtonContainer>
                        {isUpdating && (
                            <UpdateButtonContainer>
                                <Button 
                                    type="primary" 
                                    style={{width: '100%'}}
                                    onClick={handleSubmit}
                                    loading={submitLoading || submitted}
                                    disabled={submitLoading || submitted}
                                >
                                    Actualizar Cliente
                                </Button>
                            </UpdateButtonContainer>
                        )}
                    </ButtonContainer>
                </Form>
            </div>
            {hasRncPanel && (
              <div>
                <RncPanel rncInfo={rncInfo} loading={loading} />
              </div>
            )}
        </Wrapper>
    )
}

const FlexContainer = styled.div`
    display: flex;
    gap: 1em;
    flex-grow: 1;
`;

const ButtonContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1em;
    margin-top: 1em;
`;

const UpdateButtonContainer = styled.div`
    display: flex;

`;

const DeleteButtonContainer = styled.div`
    display: flex;
    justify-content: flex-start;
`;
