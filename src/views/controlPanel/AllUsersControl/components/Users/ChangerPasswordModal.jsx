import { useState } from 'react'
import { Modal, Form, Input, Button, Typography, message } from 'antd'
import { fbUpdateUserPassword } from '../../../../../firebase/Auth/fbAuthV2/fbUpdateUserPassword'

export const ChangerPasswordModal = ({ isOpen, data, onClose }) => {
    const [newPassword, setNewPassword] = useState('')
    const handleOk = async () => {
        try {
            await fbUpdateUserPassword(data.user.id, newPassword)
            onClose()
        } catch (error) {
            message.error(error?.message || 'Error actualizando la contraseña')
        }
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

// export const ChangerPasswordModal = ({ isOpen, data, onClose }) => {
//     const [newPassword, setNewPassword] = useState('')
//     const handleOk = () => {
//         fbUpdateUserPassword("BdNGtDt3y0", newPassword)
//         antd.message.success('Contraseña actualizada correctamente');
      
//     };

//     const handleCancel = () => {
     
//         setIsModalVisible(false);
//         setEditingUser(null); // Resetea el usuario en edición
//     };
//     return (
//         <Modal 
//         title="Editar Contraseña"
//             open={true} onOk={handleOk} onCancel={handleCancel}>
            
//             <Form
//                 name="editPasswordForm"
//                 initialValues={{ remember: true }}
//                 onFinish={handleOk}
//             >
//                 < Typography.Title level={5}>Editar Contraseña</Typography.Title>
//                 <Form.Item>
//                     <Input value={data?.user?.name} disabled />
//                 </Form.Item>
//                 <Form.Item
//                     label="Nueva Contraseña"
//                     name="password"
//                     rules={[{ required: true, message: 'Por favor ingresa la nueva contraseña!' }]}
//                 >
//                     <Input.Password 
//                        onChange={(e)=>setNewPassword(e.target.value)}
//                     />
//                 </Form.Item>
//             </Form>
//         </Modal>
//     )
// }
