import React, { useState } from 'react'
import * as antd from 'antd'
import { fbUpdateUserPassword } from '../../../../../firebase/Auth/fbAuthV2/fbUpdateUserPassword'
const { Modal, Form, Input, Button, Typography } = antd
export const ChangerPasswordModal = ({ isOpen, data, onClose }) => {
    const [newPassword, setNewPassword] = useState('')
    const handleOk = () => {
        alert("id: "+data.user.id+" password: "+newPassword)
        fbUpdateUserPassword(data.user.id, newPassword)
        onClose()
    };

    const handleCancel = () => {
        onClose()
        setIsModalVisible(false);
        setEditingUser(null); // Resetea el usuario en edición
    };
    return (
        <Modal 
        title="Editar Contraseña"
            open={isOpen} onOk={handleOk} onCancel={handleCancel}>
            
            <Form
                name="editPasswordForm"
                initialValues={{ remember: true }}
                onFinish={handleOk}
            >
                < Typography.Title level={5}>Editar Contraseña</Typography.Title>
                <Form.Item>
                    <Input value={data?.user?.name} disabled />
                </Form.Item>
                <Form.Item
                    label="Nueva Contraseña"
                    name="password"
                    rules={[{ required: true, message: 'Por favor ingresa la nueva contraseña!' }]}
                >
                    <Input.Password 
                       onChange={(e)=>setNewPassword(e.target.value)}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}
