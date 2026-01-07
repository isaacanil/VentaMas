import { App as AntApp, Button } from 'antd';
import { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const OFFLINE_READY_KEY = 'pwa-offline-ready';
const NEED_REFRESH_KEY = 'pwa-need-refresh';

const PwaUpdatePrompt = () => {
  const { notification } = AntApp.useApp();
  const updateNotificationOpenRef = useRef(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  useEffect(() => {
    if (!import.meta.env.PROD || !offlineReady) return;

    notification.success({
      key: OFFLINE_READY_KEY,
      message: 'Ventamax listo sin conexión',
      description: 'Los recursos principales ya están guardados en tu dispositivo.',
      duration: 4,
      onClose: () => setOfflineReady(false),
    });
  }, [offlineReady, notification, setOfflineReady]);

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    if (needRefresh && !updateNotificationOpenRef.current) {
      updateNotificationOpenRef.current = true;
      notification.open({
        key: NEED_REFRESH_KEY,
        type: 'warning',
        message: 'Nueva versión disponible',
        description: 'Recarga para usar la última versión de Ventamax.',
        duration: 0,
        btn: (
          <Button
            type="primary"
            size="small"
            onClick={() => updateServiceWorker(true)}
          >
            Recargar
          </Button>
        ),
        onClose: () => {
          updateNotificationOpenRef.current = false;
          setNeedRefresh(false);
        },
      });
    }
  }, [needRefresh, notification, setNeedRefresh, updateServiceWorker]);

  return null;
};

export default PwaUpdatePrompt;

