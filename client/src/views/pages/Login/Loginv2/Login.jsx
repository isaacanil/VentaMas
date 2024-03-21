
import { useEffect, useState } from "react";
import { fbLogin } from "../../../../firebase/Auth/fbLogin";
import ROUTES_NAME from "../../../../routes/routesName";
import findRouteByName from "../../../templates/MenuApp/findRouteByName";
import { InputV4 } from "../../../templates/system/Inputs/GeneralInput/InputV4";
import styled from "styled-components"
import { Logo } from "../../../../assets/logo/Logo";
import { LogoContainer } from "./components/Header/LogoContainer";
import * as ant from 'antd';
const { Form, Input, Button, Checkbox, Card, Layout, Spin, notification } = ant;
import { UserOutlined, LockOutlined, LoadingOutlined } from '@ant-design/icons';
export const Login = () => {
    const [form] = Form.useForm();
    const [user, setUser] = useState({
        email: "",
        password: "",
    })
    const handleSubmit = (e) => {
        e.preventDefault()
        fbLogin(user, homePath, navigate, dispatch)
    }
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
            {/* <form onSubmit={handleSubmit}>
                <Body>


                    <Group>
                        <InputV4
                            type="text"
                            placeholder="Email"
                            label="Email"
                            value={user.email}
                            onChange={(e) => setUser({ ...user, email: e.target.value })}
                        />
                    </Group>
                    < Group>
                        <InputV4
                            type="password"
                            placeholder="Password"
                            label="Password"
                            value={user.password}
                            onChange={(e) => setUser({ ...user, password: e.target.value })}
                        />
                    </Group>
                </Body>
                <Footer>
                    <Group>
                        <Button>Login</Button>
                    </Group>
                </Footer>
            </form> */}
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
                <Form.Item
                    style={
                        {
                            padding: " 2em 0em 2.5em"
                        }
                    }
                >
                    <Form.Item
                        name="username"
                        label="Usuario"
                        autoComplete="off"
                        rules={[{ required: true, message: 'Por favor ingresa tu nombre de usuario!' }]}
                    >
                        <Input
                            prefix={<UserOutlined className="site-form-item-icon" />}
                            placeholder="Usuario"
                        />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        autoComplete={false}
                        label="Contraseña"
                        rules={[{ required: true, message: 'Por favor ingresa tu contraseña!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            type="password"
                            placeholder="Contraseña"
                        />
                    </Form.Item>

                </Form.Item>
                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        style={{ width: '100%' }}
                    >
                        Iniciar sesión
                    </Button>
                </Form.Item>
            </Form>
        </Container>
    )
}





const Container = styled.div`
    max-width: 600px;
    width: 100%;
    background-color: white;
    border-radius: var(--border-radius);
    padding: 2em;
    display: grid;
    grid-template-rows: min-content 1fr;
     form{
    width: 100%;
    height: 400px;
    display: grid;
    grid-template-rows: 1fr min-content;
  }
`
const Titulo = styled.h2`

`
const Head = styled.div``
const Body = styled.div``

const Footer = styled.div``
const Group = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 1.5rem;
    width: 100%;
`;

// const Button = styled.button`
//   padding: 4px;
//   height: 2em;
//   margin-top: 4px;
//   background-color: var(--color);
//   border-radius: var(--border-radius-light);
//   border: var(--border-primary);
// `;

