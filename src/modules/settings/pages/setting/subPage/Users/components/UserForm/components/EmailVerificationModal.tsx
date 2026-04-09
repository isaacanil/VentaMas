import { Alert, Button, Input, Modal, Space, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import type { EmailVerifyState } from '../hooks/useEmailVerification';

type Props = {
  open: boolean;
  email: string | null;
  state: EmailVerifyState;
  expiresAtMillis: number | null;
  code: string;
  onCodeChange: (next: string) => void;
  onSend: () => void | Promise<void>;
  onVerify: () => void | Promise<void>;
  onCancel: () => void;
};

const formatTimeLeft = (msLeft: number) => {
  const totalSeconds = Math.max(0, Math.floor(msLeft / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

export const EmailVerificationModal = ({
  open,
  email,
  state,
  expiresAtMillis,
  code,
  onCodeChange,
  onSend,
  onVerify,
  onCancel,
}: Props) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open]);

  const msLeft = useMemo(() => {
    if (!expiresAtMillis) return null;
    return expiresAtMillis - now;
  }, [expiresAtMillis, now]);

  const expired = typeof msLeft === 'number' && msLeft <= 0;

  return (
    <Modal
      open={open}
      title="Verificar correo"
      onCancel={onCancel}
      footer={null}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Typography.Text>
          Correo a verificar:{' '}
          <Typography.Text strong>{email || 'Sin correo'}</Typography.Text>
        </Typography.Text>

        {state === 'idle' && (
          <Alert
            type="info"
            showIcon
            message="Envía un código a este correo y luego ingrésalo aquí para confirmar."
          />
        )}

        {(state === 'sending' || state === 'codeSent' || state === 'verifying') && (
          <Alert
            type="warning"
            showIcon
            message={
              expired
                ? 'El código expiró. Envía uno nuevo.'
                : msLeft
                  ? `Código activo. Expira en ${formatTimeLeft(msLeft)}.`
                  : 'Código enviado. Revisa tu correo.'
            }
          />
        )}

        {state === 'idle' || state === 'sending' ? (
          <Button
            type="primary"
            loading={state === 'sending'}
            disabled={!email}
            onClick={onSend}
          >
            Enviar código
          </Button>
        ) : (
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="Código de 6 dígitos"
              maxLength={6}
              value={code}
              onChange={(e) => onCodeChange(e.target.value.replace(/\\D/g, ''))}
              onPressEnter={() => {
                if (code.length === 6 && !expired) onVerify();
              }}
              style={{ maxWidth: 220 }}
            />
            <Button
              type="primary"
              loading={state === 'verifying'}
              disabled={code.length !== 6 || expired}
              onClick={onVerify}
            >
              Verificar
            </Button>
            <Button onClick={onSend} disabled={state === 'sending'}>
              Reenviar
            </Button>
          </Space.Compact>
        )}
      </Space>
    </Modal>
  );
};

