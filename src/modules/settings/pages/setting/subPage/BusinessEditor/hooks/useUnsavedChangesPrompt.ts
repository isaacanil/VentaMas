import { Modal } from 'antd';
import { useContext, useEffect, useRef } from 'react';
import { UNSAFE_NavigationContext } from 'react-router-dom';

type Transition = {
  retry: () => void;
};

type NavigatorWithBlock = {
  block: (tx: Transition) => () => void;
};

const isNavigatorWithBlock = (
  navigator: unknown,
): navigator is NavigatorWithBlock =>
  typeof navigator === 'object' &&
  navigator !== null &&
  'block' in navigator &&
  typeof (navigator as { block?: unknown }).block === 'function';

const useUnsavedChangesPrompt = (shouldBlock: boolean): void => {
  const navigationContext = useContext(UNSAFE_NavigationContext);
  const confirmRef = useRef<ReturnType<typeof Modal.confirm> | null>(null);

  useEffect(() => {
    if (!shouldBlock) {
      if (confirmRef.current) {
        confirmRef.current.destroy();
        confirmRef.current = null;
      }
      return undefined;
    }

    const navigator = navigationContext?.navigator;
    if (!isNavigatorWithBlock(navigator)) {
      return undefined;
    }

    const unblock = navigator.block((tx) => {
      if (confirmRef.current) {
        return;
      }

      confirmRef.current = Modal.confirm({
        title: 'Tienes cambios sin guardar',
        content:
          'Si sales ahora se perderán los cambios hechos en Datos de la Empresa.',
        okText: 'Salir sin guardar',
        okType: 'danger',
        cancelText: 'Permanecer aquí',
        centered: true,
        onOk: () => {
          confirmRef.current = null;
          tx.retry();
        },
        onCancel: () => {
          confirmRef.current = null;
        },
        afterClose: () => {
          confirmRef.current = null;
        },
      });
    });

    return () => {
      unblock();
      if (confirmRef.current) {
        confirmRef.current.destroy();
        confirmRef.current = null;
      }
    };
  }, [navigationContext, shouldBlock]);
};

export default useUnsavedChangesPrompt;
