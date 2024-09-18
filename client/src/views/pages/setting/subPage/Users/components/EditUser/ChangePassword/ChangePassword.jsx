import React, { useEffect, useState } from 'react'
import { icons } from '../../../../../../../../constants/icons/icons'
import styled from 'styled-components'
import { fbUpdateUserPassword } from '../../../../../../../../firebase/Auth/fbAuthV2/fbUpdateUser'
import { useDispatch } from 'react-redux'
import * as antd from 'antd'
const { Modal, Form, Input, notification, Button } = antd
const formIcon = icons.forms
export const ChangePassword = ({ user = null, isOpen = false, setIsOpen, onClose }) => {
    const [form] = Form.useForm()

    const handleSubmit = async (values) => {
        try {
            await fbUpdateUserPassword(user.id, values.oldPassword, values.newPassword)
            onClose();
            notification.success({
                message: 'Contraseña actualizada',
                description: 'La contraseña se actualizó correctamente',
            });
        } catch (error) {
            console.error(error)
            notification.error({
                message: 'Error',
                description: 'Hubo un problema al actualizar la contraseña.',
            });
        }
    }
    const handleCancel = () => {
        setIsOpen(false)
    }
    useEffect(() => {
        form.resetFields()
    }, [isOpen])

    return (
        <Modal
            open={isOpen}
            onCancel={handleCancel}
            footer={
                [
                    <Button
                        onClick={handleCancel}
                    >
                        Cancelar
                    </Button>,
                    <Button

                        key="submit" type="primary" onClick={() => form.submit()}
                    >
                        Guardar
                    </Button>
                ]
            }
        >
            <Container>
                <Header>
                    <div>
                        <h3>Cambiar contraseña de {user?.name}</h3>
                    </div>
                    <div>
                        <p>Para cambiar la contraseña, ingrese la contraseña antigua y la nueva contraseña.</p>
                    </div>
                </Header>
                <Body>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                    >
                        <Form.Item
                            name="oldPassword"
                            label="Contraseña antigua"
                            rules={[{ required: true, message: 'Por favor ingrese su contraseña antigua' }]}
                        >
                            <Input.Password />
                        </Form.Item>
                        <Form.Item
                            name="newPassword"
                            label="Nueva contraseña"
                            rules={[{ required: true, message: 'Por favor ingrese su nueva contraseña' }]}
                        >
                            <Input.Password />
                        </Form.Item>
                    </Form>
                </Body>
            </Container>
        </Modal>
    )
}

const Header = styled.div`
    display: grid;
    gap: 0.8em;
`
const Body = styled.div`
    display: grid;
    align-content: start;
    gap: 1em;
`
const Container = styled.div`  
    width: 100%;
    background-color: white;
    grid-template-rows: min-content  1fr min-content;
    display: grid;
    align-content: start;
    gap: 1.4em;
`
const Footer = styled.div`
    display: flex;
    justify-content: flex-end;
    padding: 0 1em;
`
