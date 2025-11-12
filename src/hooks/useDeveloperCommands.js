import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '../features/auth/userSlice';
import { toggleDeveloperModal } from '../features/modals/modalSlice';

/**
 * Hook para manejar comandos globales de desarrollador
 * Permite abrir el modal de desarrollador con secuencias de teclas específicas
 */
export const useDeveloperCommands = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const isDeveloper = user?.role === 'dev';

  useEffect(() => {
    if (!isDeveloper) return;

    let sequence = '';
    let sequenceTimer = null;

    const handleKeyDown = (event) => {
      // Ignorar si el usuario está escribiendo en un input o textarea
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.contentEditable === 'true')
      ) {
        return;
      }

      // Limpiar el timer anterior
      if (sequenceTimer) {
        clearTimeout(sequenceTimer);
      }

      // Añadir la tecla a la secuencia
      sequence += event.key.toLowerCase();

      // Comandos disponibles:
      // "dev" - abre el modal de desarrollador
      // "devconsole" - abre el modal en la pestaña de consola
      // "devdebug" - abre el modal en la pestaña de debug
      // "devinfo" - abre el modal en la pestaña de info

      // Verificar comandos
      if (sequence.includes('dev')) {
        event.preventDefault();

        if (sequence.includes('devconsole')) {
          dispatch(toggleDeveloperModal({ activeTab: 'console' }));
          sequence = '';
          return;
        } else if (sequence.includes('devdebug')) {
          dispatch(toggleDeveloperModal({ activeTab: 'debug' }));
          sequence = '';
          return;
        } else if (sequence.includes('devinfo')) {
          dispatch(toggleDeveloperModal({ activeTab: 'info' }));
          sequence = '';
          return;
        } else if (sequence.endsWith('dev')) {
          dispatch(toggleDeveloperModal());
          sequence = '';
          return;
        }
      }

      // Comando alternativo con Ctrl+Shift+D
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        dispatch(toggleDeveloperModal());
        sequence = '';
        return;
      }

      // Comando alternativo con triple click en Escape
      if (event.key === 'Escape') {
        if (sequence.includes('escape')) {
          const escapeCount = (sequence.match(/escape/g) || []).length;
          if (escapeCount >= 2) {
            dispatch(toggleDeveloperModal());
            sequence = '';
            return;
          }
        }
      }

      // Limpiar la secuencia después de 2 segundos de inactividad
      sequenceTimer = setTimeout(() => {
        sequence = '';
      }, 2000);

      // Limitar la longitud de la secuencia para evitar memoria excesiva
      if (sequence.length > 20) {
        sequence = sequence.slice(-20);
      }
    };

    // Añadir el listener
    document.addEventListener('keydown', handleKeyDown);

    // Limpiar el listener al desmontar
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (sequenceTimer) {
        clearTimeout(sequenceTimer);
      }
    };
  }, [isDeveloper, dispatch]);

  // Función para abrir el modal programáticamente
  const openDeveloperModal = (activeTab = 'console') => {
    if (isDeveloper) {
      dispatch(toggleDeveloperModal({ activeTab }));
    }
  };

  return {
    openDeveloperModal,
    isDeveloper,
  };
};

export default useDeveloperCommands;
