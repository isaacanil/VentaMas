

import React, { useState } from 'react';
import styled from 'styled-components';
import { FaBug } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import ROUTES_NAME from '../../../routes/routesName';
import * as antd from 'antd';
import { fbRecordError } from '../../../firebase/errors/fbRecordError';
import { selectUser } from '../../../features/auth/userSlice';
import { useSelector } from 'react-redux';
import { selectBusinessData } from '../../../features/auth/businessSlice';
import { Logo } from '../../../assets/logo/Logo';
const { Button, Spin, Typography } = antd;



export const ErrorElement = ({ errorInfo, errorStackTrace }) => {
    const user = useSelector(selectUser)
    const [loading, setLoading] = useState(false)
    const [reportError, setReportError] = useState(false)
    const { HOME } = ROUTES_NAME.BASIC_TERM
    const handleBack = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)
            if (reportError) {

                await fbRecordError(user, errorInfo, errorStackTrace)
                antd.notification.success({
                    message: 'Error reportado',
                    description: 'El error ha sido reportado con éxito. Gracias por tu colaboración.'
                })

            }

            setLoading(false)
            window.location.href = HOME

        } catch (error) {
            setLoading(false)
            console.log('error', error)
        }
    }
    return (
        <Spin
            spinning={loading}
        >

            <Container>
                <Logo />
                <br />
                <Title color='danger'>Ups, algo salió mal</Title>
                <br />
                <Paragraph>
                    Un error inesperado ha ocurrido. Por favor, intenta de nuevo más tarde.
                </Paragraph>

                <br />
                <br />
              
                <antd.Checkbox onChange={(e) => setReportError(e.target.checked)}>Reportar error</antd.Checkbox>
                <Paragraph>Si marcas esta casilla, el error sera registrado para su posterior revisión</Paragraph>

                <br />
                <Button onClick={handleBack}>Volver a Inicio</Button>
                <br />
               
                {
                    user?.role === 'dev' && (
                        <div>
                            <Subtitle>Detalles del error:</Subtitle>
                         
                            <Paragraph code copyable>
                                {errorStackTrace}
                            </Paragraph>
                        </div>
                    )
                }

            </Container>
        </Spin>
    );
};

const Container = styled.div`
    display: grid;
    justify-items: center;

  overflow-y: auto;
  padding: 1em;
  height: 100vh;
  background-color: #f8f8f8;
`;

const Icon = styled(FaBug)`
  font-size: 6rem;
  color: #E53E3E; // Rojo para indicar error
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: #333;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  margin: 1rem 0 3rem;
  color: #555;
  text-align: center;
`;

// const Button = styled(Link)`
//   font-size: 1.2rem;
//   background-color: #3182ce; // Color de tu elección
//   color: #fff;
//   border: none;
//   padding: 0.5em 1.5em;
//   border-radius: 0.25em;
//   cursor: pointer;
//   text-decoration: none; // Remover subrayado del enlace
//   transition: background-color 0.2s;

//   &:hover {
//     background-color: #63b3ed; // Oscurecer al pasar el ratón
//   }
// `;
const Paragraph = styled(Typography.Paragraph)`
    font-size: 1rem;
    `;