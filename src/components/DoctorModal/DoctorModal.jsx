import { UserOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { Modal, Form, Input, Button, message } from 'antd';
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import {
    selectDoctorsModal,
    selectSelectedDoctor,
    selectDoctorsError,
    closeModal,
    addDoctor,
    updateDoctor,
    clearError
} from '../../features/doctors/doctorsSlice';

const DoctorModal = () => {
    const [form] = Form.useForm();
    const dispatch = useDispatch();
    
    const user = useSelector(selectUser);
    const modal = useSelector(selectDoctorsModal);
    const selectedDoctor = useSelector(selectSelectedDoctor);
    const error = useSelector(selectDoctorsError);

    const isEditMode = modal.mode === 'edit';

    // Clear error when modal opens/closes
    useEffect(() => {
        if (modal.open) {
            dispatch(clearError());
        }
    }, [modal.open, dispatch]);

    // Set form values when editing
    useEffect(() => {
        if (modal.open && selectedDoctor && isEditMode) {
            form.setFieldsValue({
                name: selectedDoctor.name,
                specialty: selectedDoctor.specialty
            });
        } else if (modal.open && !isEditMode) {
            form.resetFields();
        }
    }, [modal.open, selectedDoctor, isEditMode, form]);

    // Show error messages
    useEffect(() => {
        if (error) {
            message.error(error);
        }
    }, [error]);

    const handleCancel = () => {
        form.resetFields();
        dispatch(closeModal());
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            
            if (isEditMode) {
                await dispatch(updateDoctor({
                    doctor: {
                        ...selectedDoctor,
                        ...values
                    },
                    user
                })).unwrap();
                
                message.success('Médico actualizado exitosamente');
            } else {
                await dispatch(addDoctor({
                    doctor: values,
                    user
                })).unwrap();
                
                message.success('Médico agregado exitosamente');
            }
            
            form.resetFields();
        } catch (rejectedValueOrSerializedError) {
            // Error already handled by Redux and shown via useEffect
        }
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MedicineBoxOutlined />
                    {isEditMode ? 'Editar Médico' : 'Agregar Médico'}
                </div>
            }
            open={modal.open}
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Cancelar
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={modal.loading}
                    onClick={handleSubmit}
                >
                    {isEditMode ? 'Actualizar' : 'Agregar'}
                </Button>
            ]}
            destroyOnClose
            width={500}
        >
            <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                disabled={modal.loading}
            >
                <Form.Item
                    name="name"
                    label="Nombre del Médico"
                    rules={[
                        { required: true, message: 'El nombre del médico es requerido' },
                        { min: 2, message: 'El nombre debe tener al menos 2 caracteres' },
                        { max: 100, message: 'El nombre no puede exceder 100 caracteres' }
                    ]}
                >
                    <Input
                        prefix={<UserOutlined />}
                        placeholder="Ingrese el nombre del médico"
                        autoComplete="off"
                    />
                </Form.Item>

                <Form.Item
                    name="specialty"
                    label="Especialidad"
                    rules={[
                        { required: true, message: 'La especialidad es requerida' },
                        { min: 2, message: 'La especialidad debe tener al menos 2 caracteres' },
                        { max: 100, message: 'La especialidad no puede exceder 100 caracteres' }
                    ]}
                >
                    <Input
                        prefix={<MedicineBoxOutlined />}
                        placeholder="Ingrese la especialidad del médico"
                        autoComplete="off"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default DoctorModal; 