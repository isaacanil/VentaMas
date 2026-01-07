import { Button, Result, Typography } from 'antd';
import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router';
import styled from 'styled-components';

const { Paragraph, Text } = Typography;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 24px;
  background: var(--color-bg-container, #fff);
`;

const StackTrace = styled.pre`
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  max-height: 300px;
  overflow: auto;
  font-size: 12px;
  text-align: left;
  margin-top: 16px;
`;

export const RouteErrorFallback = () => {
    const error = useRouteError();
    console.error(error);

    let title = "Ocurrió un error inesperado";
    let subTitle = "Lo sentimos, algo salió mal. Por favor, intenta recargar la página.";
    let status = "500";
    let stack = null;

    if (isRouteErrorResponse(error)) {
        if (error.status === 404) {
            status = "404";
            title = "404 - Página no encontrada";
            subTitle = "La página que buscas no existe o ha sido movida.";
        } else if (error.status === 401) {
            status = "403";
            title = "401 - No autorizado";
            subTitle = "No tienes permiso para acceder a esta sección.";
        }
    } else if (error instanceof Error) {
        subTitle = error.message;
        stack = error.stack;
    }

    return (
        <ErrorContainer>
            <Result
                status={status === "404" ? "404" : status === "403" ? "403" : "error"}
                title={title}
                subTitle={subTitle}
                extra={[
                    <Button type="primary" key="home" onClick={() => window.location.href = '/'}>
                        Ir al Inicio
                    </Button>,
                    <Button key="retry" onClick={() => window.location.reload()}>
                        Recargar Página
                    </Button>,
                ]}
            >
                {stack && (
                    <div className="desc">
                        <Paragraph>
                            <Text strong style={{ fontSize: 16 }}>
                                Detalles del error:
                            </Text>
                        </Paragraph>
                        <StackTrace>
                            {stack}
                        </StackTrace>
                    </div>
                )}
            </Result>
        </ErrorContainer>
    );
};
