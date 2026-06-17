import { Button, Result, Typography } from 'antd';
import { isRouteErrorResponse, useRouteError } from 'react-router';

import {
  DetailsTitle,
  ErrorContainer,
  StackTrace,
} from './RouteErrorFallback.styles';

const { Paragraph } = Typography;

export const RouteErrorFallback = () => {
  const error = useRouteError();
  console.error(error);

  let title = 'Ocurrio un error inesperado';
  let subTitle =
    'Lo sentimos, algo salio mal. Por favor, intenta recargar la pagina.';
  let status = '500';
  let stack = null;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      status = '404';
      title = '404 - Pagina no encontrada';
      subTitle = 'La pagina que buscas no existe o ha sido movida.';
    } else if (error.status === 401) {
      status = '403';
      title = '401 - No autorizado';
      subTitle = 'No tienes permiso para acceder a esta seccion.';
    }
  } else if (error instanceof Error) {
    subTitle = error.message;
    stack = error.stack;
  }

  return (
    <ErrorContainer>
      <Result
        status={status === '404' ? '404' : status === '403' ? '403' : 'error'}
        title={title}
        subTitle={subTitle}
        extra={[
          <Button
            type="primary"
            key="home"
            onClick={() => (window.location.href = '/')}
          >
            Ir al Inicio
          </Button>,
          <Button key="retry" onClick={() => window.location.reload()}>
            Recargar Pagina
          </Button>,
        ]}
      >
        {stack && (
          <div className="desc">
            <Paragraph>
              <DetailsTitle strong>Detalles del error:</DetailsTitle>
            </Paragraph>
            <StackTrace>{stack}</StackTrace>
          </div>
        )}
      </Result>
    </ErrorContainer>
  );
};
