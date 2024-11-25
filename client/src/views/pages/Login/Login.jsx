import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Layout, Spin, notification } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { fbSignIn } from '../../../firebase/Auth/fbAuthV2/fbSignIn/fbSignIn';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;

export const Login = () => {
   const dispatch = useDispatch()
   const navigate = useNavigate();
   const [form] = Form.useForm();
   const [loading, setLoading] = useState(false);
   const [loadingTip, setLoadingTip] = useState('Cargando...');
   const homePath = '/home';

   useEffect(() => {
      console.log('loading', loading)
   }, [loading])
   const onFinish = async () => {
      setLoading(true); // Iniciar la animación de carga
      // Agregar un retraso
      setTimeout(async () => {
         try {
            const values = await form.validateFields();
            const { username, password } = values;
            const user = {
               name: username,
               password
            };
            await fbSignIn(user, dispatch, navigate, homePath);
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
      }, 2000); 

   };

   return (
      <Layout className="layout">
         <Spin
            spinning={loading}
            size="large"
            tip={loadingTip}
         >
            <Header style={headerStyle} >
               <h1 style={{ color: 'white' }}>VentaMax</h1>
            </Header>
            <Content
               style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '89vh'
               }}>
               <Card
                  title="Inicio de Sesión"
                  bordered={false}
                  style={{
                     width: 600,
                     height: "80vh",
                     display: 'grid',
                     gridTemplateRows: "min-content 1fr",
                  }}>
                  <Form
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
                           rules={[{ required: true, message: 'Por favor ingresa tu nombre de usuario!' }]}
                        >
                           <Input
                              prefix={<UserOutlined className="site-form-item-icon" />}
                              placeholder="Usuario"
                           />
                        </Form.Item>
                        <Form.Item
                           name="password"
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
               </Card>
            </Content>
         </Spin>
      </Layout>
   );
};

export default Login;

const headerStyle = {
   textAlign: 'center',
   display: 'flex',
   alignItems: 'center',
   color: '#fff',
   height: 50,
   paddingInline: 48,
   lineHeight: '64px',
   backgroundColor: '#4096ff',
};