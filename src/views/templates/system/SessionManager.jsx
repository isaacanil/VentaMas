import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { getStoredSession } from '../../../firebase/Auth/fbAuthV2/sessionClient';

import VentamaxLoader from './loader/GenericLoader';

const STATUS_MESSAGES = {
  checking: 'Cargando aplicación...',
  idle: 'Cargando aplicación...',
};

export const SessionManager = ({ status, error }) => {
  const location = useLocation();
  const isPublicRoute = location.pathname === '/login' || location.pathname === '/';
  const [shouldRender, setShouldRender] = useState(false);
  const hasShownLoaderRef = useRef(false);
  const initialCheckRef = useRef(true);

  const isActive = status === 'checking';
  
  // Verificar si hay una sesión guardada (solo en el montaje inicial)
  const [hasStoredSession] = useState(() => {
    const { sessionToken } = getStoredSession();
    return !!sessionToken;
  });

  useEffect(() => {
    // Solo mostrar el loader en la PRIMERA carga si:
    // 1. Hay una sesión guardada
    // 2. No es una ruta pública
    // 3. Es la primera verificación
    if (initialCheckRef.current && hasStoredSession && !isPublicRoute) {
      setShouldRender(true);
      hasShownLoaderRef.current = true;
    }

    // Marcar que ya pasó la verificación inicial
    if (initialCheckRef.current && status === 'ready') {
      initialCheckRef.current = false;
    }

    // Ocultar el loader cuando el status cambia a 'ready'
    if (status === 'ready' && shouldRender) {
      // Pequeño delay para asegurar que se vea el loader
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [status, hasStoredSession, isPublicRoute, shouldRender]);

  const message = useMemo(() => {
    if (isPublicRoute) {
      return null;
    }

    if (error) {
      return error.message || 'No se pudo validar la sesión.';
    }
    if (!isActive && !shouldRender) {
      return null;
    }
    return STATUS_MESSAGES[status] ?? STATUS_MESSAGES.checking;
  }, [error, status, isActive, isPublicRoute, shouldRender]);

  const handleLoaderFinish = () => {
    setShouldRender(false);
  };

  // No renderizar en rutas públicas
  if (isPublicRoute) {
    return null;
  }

  // No renderizar si no hay sesión guardada
  if (!hasStoredSession) {
    return null;
  }

  // No renderizar si ya se mostró y no está activo
  if (hasShownLoaderRef.current && !shouldRender) {
    return null;
  }

  return (
    <VentamaxLoader
      active={shouldRender || isActive}
      message={message || undefined}
      onFinish={handleLoaderFinish}
      status={status}
    />
  );
};
