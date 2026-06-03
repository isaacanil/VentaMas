import { Modal } from 'antd';
import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';

const useUnsavedChangesPrompt = (shouldBlock: boolean): void => {
  const blocker = useBlocker(shouldBlock);
  const confirmRef = useRef<ReturnType<typeof Modal.confirm> | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (shouldBlock) {
      return undefined;
    }

    if (confirmRef.current) {
      confirmRef.current.destroy();
      confirmRef.current = null;
    }

    if (blocker.state === 'blocked') {
      blocker.reset();
    }

    return undefined;
  }, [blocker, shouldBlock]);

  useEffect(() => {
    if (blocker.state !== 'blocked' || confirmRef.current) {
      return undefined;
    }

    confirmRef.current = Modal.confirm({
      title: 'Tienes cambios sin guardar',
      content:
        'Si sales ahora se perderan los cambios hechos en Datos de la Empresa.',
      okText: 'Salir sin guardar',
      okType: 'danger',
      cancelText: 'Permanecer aqui',
      centered: true,
      onOk: () => {
        handledRef.current = true;
        confirmRef.current = null;
        blocker.proceed();
      },
      onCancel: () => {
        handledRef.current = true;
        confirmRef.current = null;
        blocker.reset();
      },
      afterClose: () => {
        if (!handledRef.current && blocker.state === 'blocked') {
          blocker.reset();
        }
        handledRef.current = false;
        confirmRef.current = null;
      },
    });

    return undefined;
  }, [blocker]);

  useEffect(() => {
    return () => {
      if (confirmRef.current) {
        confirmRef.current.destroy();
        confirmRef.current = null;
      }
    };
  }, []);
};

export default useUnsavedChangesPrompt;
