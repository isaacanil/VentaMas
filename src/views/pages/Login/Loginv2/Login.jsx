import styled from "styled-components"
import { Input, Button, notification, Form } from 'antd';
import { UserOutlined, LockOutlined, } from '@ant-design/icons';
import { LogoContainer } from "./components/Header/LogoContainer";
import { fbSignIn, updateAppState } from "../../../../firebase/Auth/fbAuthV2/fbSignIn/fbSignIn";
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom';
import ROUTES_PATH from "../../../../routes/routesName";

const Container = styled.div`
   padding: 0 1em;
   width: 100%;
   justify-content: center;
   align-items: center;
   height: 100%;
   display: flex;
`

const Wrapper = styled.div`
   max-width: 450px;
   width: 100%;
   background-color: #4d4d4d;
   border-radius: 1em;
   padding: 0 1em;
`

const Body = styled.div`
   margin: 0rem 0;
`

const StyledForm = styled(Form)`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: white;
    height: 100%;
    gap: 16;
   
    label {
        color: white !important;
        font-weight: 500;
    }
   
    .ant-btn {
        border-radius: 8px;
        height: 48px;
        margin-top: 1rem;
    }
`

export const Login = ({ setLoading = null }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const handleFinish = async ({ username, password }) => {
        setLoading(true);
        try {
            const user = await fbSignIn({ name: username, password });
            updateAppState(dispatch, user);
            navigate(ROUTES_PATH.BASIC_TERM.HOME);
            notification.success({
                message: 'Inicio de sesión exitoso',
                description: '¡Bienvenido!',
            });
        } catch (error) {
            notification.error({
                message: 'Error',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <Wrapper >
                <StyledForm
                    autoComplete="off"
                    form={form}
                    layout="vertical"
                    onFinish={handleFinish}
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

                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        style={{ width: '100%' }}
                    >
                        Iniciar sesión
                    </Button>

                </StyledForm>
            </Wrapper>
        </Container >
    )
}
