export const MESSAGES = {
  ERROR_TITLE: '¡Ups! Algo salió mal',
  ERROR_DESCRIPTION:
    'Un error inesperado ha ocurrido. Por favor, intenta de nuevo más tarde.',
  REPORT_ERROR: 'Reportar error',
  REPORT_DESCRIPTION:
    'Si marcas esta casilla, el error será registrado para su posterior revisión',
  GO_BACK: 'Volver Atrás',
  GO_HOME: 'Ir a Inicio',
  CANT_GO_BACK: 'No se puede retroceder',
  CANT_GO_BACK_DESC:
    'No hay páginas anteriores disponibles. Serás redirigido al inicio.',
  ERROR_REPORTED: 'Error reportado',
  ERROR_REPORTED_DESC:
    'El error ha sido reportado con éxito. Gracias por tu colaboración.',
};

export const ANIMATIONS = {
  container: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  logo: {
    hidden: { scale: 0 },
    visible: { scale: 1, transition: { delay: 0.2 } },
  },
  errorDetails: {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto', transition: { delay: 0.5 } },
  },
};
