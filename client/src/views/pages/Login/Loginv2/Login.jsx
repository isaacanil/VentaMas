
import { useEffect, useState } from "react";
import { fbLogin } from "../../../../firebase/Auth/fbLogin";
import ROUTES_NAME from "../../../../routes/routesName";
import findRouteByName from "../../../templates/MenuApp/findRouteByName";
import { InputV4 } from "../../../templates/system/Inputs/GeneralInput/InputV4";
import styled from "styled-components"
import { Logo } from "../../../../assets/logo/Logo";
import { LogoContainer } from "./components/Header/LogoContainer";
import * as ant from 'antd';
const { Input, Button, Checkbox, Card, Layout, Spin, notification } = ant;
import { UserOutlined, LockOutlined, LoadingOutlined } from '@ant-design/icons';
import { fbSignIn } from "../../../../firebase/Auth/fbAuthV2/fbSignIn/fbSignIn";
import { selectUser } from "../../../../features/auth/userSlice";
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom';

export const Login = ({setLoading = null}) => {
    const [form] = Form.useForm();
    const user = useSelector(selectUser)
  //  const [loading, setLoading] = useState(false);
    const [loadingTip, setLoadingTip] = useState('Cargando...');
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const homePath = '/home';
    const onFinish = async () => {
        setLoading(true); // Iniciar la animación de carga
        setTimeout(async () => {
            try {
                const values = await form.validateFields();
                const { username, password } = values;
                const user = {
                    name: username,
                    password
                };
                // Llamar a la función de inicio de sesión
                await fbSignIn(user, dispatch, navigate, homePath);
                notification.success({
                    message: 'Inicio de sesión exitoso',
                    description: '¡Bienvenido!',
                });
                // Código restante...
            } catch (error) {
                notification.error({
                    message: 'Error',
                    description: error.message,
                });
                // Manejar errores si es necesario
            } finally {
                setLoading(false); // Detener la animación de carga
            }
        }, 2000); // 2000 milisegundos = 2 segundos de retraso

    };
    return (
        <Container>
                <Wrapper >
                    <Form
                        autoComplete="off"
                        form={form}
                        layout="vertical"
                        name="normal_login"
                        style={{
                            display: 'grid',
                            gridTemplateRows: "1fr min-content",
                            gap: 16
                        }}
                        className="login-form"
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                    >
                        <LogoContainer />
                        <Body>
                            <Form.Item
                                name="username"
                                label="Usuario"
                                autoComplete="off"
                                rules={[{ required: true, message: 'Por favor ingresa tu nombre de usuario!' }]}
                            >
                                <Input
                                    size="large"
                                    prefix={<UserOutlined className="site-form-item-icon" />}
                                    placeholder="Usuario"
                                    autoComplete="off"

                                />
                            </Form.Item>
                            <br />
                            <Form.Item
                                name="password"
                                label="Contraseña"
                                rules={[{ required: true, message: 'Por favor ingresa tu contraseña!' }]}
                            >
                                <Input.Password
                                    size="large"
                                    prefix={<LockOutlined />}
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Contraseña"
                                />
                            </Form.Item>
                        </Body>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                style={{ width: '100%' }}
                            >
                                Iniciar sesión
                            </Button>
                        </Form.Item>
                    </Form>
                </Wrapper>
        </Container >
    )
}

const Container = styled.div`
   padding: 1em;
   width: 100%;
   justify-content: center;
   height: 100vh;
   max-height: 800px;
   display: flex;

`
const Wrapper = styled.div`
     max-width: 600px;
    width: 100%;
    background-color: white;
    background-color: #4d4d4d;
  

    border-radius: 1em;
    padding: 0 2em 2em;

    display: grid;
    grid-template-rows: 1fr;
    
`
const Body = styled.div`
    
`
const Form = styled(ant.Form)`
    display: grid;
   
    grid-template-rows: min-content 1fr min-content !important;
    color: white;
    label{

        color: white !important;
    }
    
`