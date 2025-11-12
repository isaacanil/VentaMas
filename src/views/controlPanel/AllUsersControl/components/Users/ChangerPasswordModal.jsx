import { Form, Input, Modal, Typography, message } from 'antd'
import { useCallback, useState } from 'react'

import { fbUpdateUserPassword } from '../../../../../firebase/Auth/fbAuthV2/fbUpdateUserPassword'

export const ChangerPasswordModal = ({ isOpen, data, onClose }) => {
    const [form] = Form.useForm()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const closeModal = useCallback(() => {
        form.resetFields()
        onClose?.()
    }, [form, onClose])

    const handleFinish = useCallback(async ({ password }) => {
        if (!data?.user?.id) {
            message.error('No se pudo identificar al usuario seleccionado.')
            return
        }

        setIsSubmitting(true)

        try {
            await fbUpdateUserPassword(data.user.id, password)
            message.success('Contraseña actualizada correctamente')
            closeModal()
        } catch (error) {
            message.error(error?.message || 'Error actualizando la contraseña')
        } finally {
            setIsSubmitting(false)
        }
    }, [closeModal, data?.user?.id])

    const handleCancel = useCallback(() => {
        closeModal()
    }, [closeModal])

    return (
        <Modal
            title="Editar Contraseña"
            open={isOpen}
            onOk={() => form.submit()}
            onCancel={handleCancel}
            confirmLoading={isSubmitting}
            okText="Guardar"
            cancelText="Cancelar"
        >
            <Form
                form={form}
                layout="vertical"
                name="editPasswordForm"
                onFinish={handleFinish}
            >
                <Typography.Title level={5}>Editar Contraseña</Typography.Title>
                <Form.Item label="Usuario">
                    <Input value={data?.user?.name ?? ''} disabled />
                </Form.Item>
                <Form.Item
                    label="Nueva Contraseña"
                    name="password"
                    rules={[{ required: true, message: 'Por favor ingresa la nueva contraseña.' }]}
                >
                    <Input.Password autoComplete="new-password" />
                </Form.Item>
            </Form>
        </Modal>
    )
}

