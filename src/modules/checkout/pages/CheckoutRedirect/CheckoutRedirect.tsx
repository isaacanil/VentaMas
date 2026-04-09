import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { Spin, Typography } from 'antd';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  gap: 24px;
  background-color: #f0f2f5;
`;

type CheckoutProvider = 'cardnet' | null;

const resolveProviderCopy = (provider: CheckoutProvider) => {
  if (provider === 'cardnet') {
    return {
      title: 'Redirigiendo a CardNET...',
      description:
        'Por favor espera un momento, serás transferido a CardNET para completar el pago.',
    };
  }

  return {
    title: 'Solicitud de pago no válida',
    description: 'Solo CardNET está habilitado en este entorno.',
  };
};

export default function CheckoutRedirect() {
  const [searchParams] = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  const provider = (searchParams.get('provider') as CheckoutProvider) || null;
  const orderNumber = searchParams.get('OrderNumber') || searchParams.get('orderNumber') || '';
  const cardnetSession = searchParams.get('SESSION') || searchParams.get('session') || '';
  const cardnetAuthorizeUrl = searchParams.get('authorizeUrl') || '';

  const isCardnetRequest = provider === 'cardnet';
  const actionUrl = cardnetAuthorizeUrl;

  const providerCopy = useMemo(() => resolveProviderCopy(provider), [provider]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return undefined;

    const shouldSubmit =
      isCardnetRequest && Boolean(cardnetSession) && Boolean(cardnetAuthorizeUrl);

    if (!shouldSubmit) return undefined;

    const timer = window.setTimeout(() => {
      form.submit();
    }, 1000);
    return () => clearTimeout(timer);
  }, [
    cardnetAuthorizeUrl,
    cardnetSession,
    isCardnetRequest,
  ]);

  if (!isCardnetRequest) {
    return (
      <Container>
        <Typography.Title level={4}>Solicitud de pago no válida</Typography.Title>
        <Typography.Text>Solo CardNET está disponible por ahora.</Typography.Text>
      </Container>
    );
  }

  if (isCardnetRequest && (!cardnetSession || !cardnetAuthorizeUrl || !orderNumber)) {
    return (
      <Container>
        <Typography.Title level={4}>Error de Seguridad</Typography.Title>
        <Typography.Text>
          Faltan parámetros requeridos para enviar el pago a CardNET.
        </Typography.Text>
      </Container>
    );
  }

  return (
    <Container>
      <Spin size="large" />
      <Typography.Title level={3}>{providerCopy.title}</Typography.Title>
      <Typography.Text type="secondary">
        {providerCopy.description}
      </Typography.Text>

      <form
        ref={formRef}
        action={actionUrl}
        method="POST"
        style={{ display: 'none' }}
      >
        {isCardnetRequest ? (
          <input type="hidden" name="SESSION" value={cardnetSession} />
        ) : null}
      </form>
    </Container>
  );
}
