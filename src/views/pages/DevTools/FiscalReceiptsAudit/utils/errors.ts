// @ts-nocheck
export const toFriendlyFirestoreError = (err) => {
  const code = err?.code;
  switch (code) {
    case 'permission-denied':
      return 'Permisos insuficientes para leer datos de este negocio.';
    case 'unauthenticated':
      return 'Sesión no autenticada. Por favor, vuelve a iniciar sesión.';
    case 'unavailable':
      return 'Servicio no disponible o sin conexión. Intenta de nuevo más tarde.';
    case 'deadline-exceeded':
      return 'La consulta tardó demasiado en responder.';
    case 'not-found':
      return 'Recurso no encontrado.';
    case 'aborted':
      return 'Operación cancelada o en conflicto. Intenta de nuevo.';
    default:
      return err?.message || 'Fallo desconocido';
  }
};
