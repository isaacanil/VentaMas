// Definimos una función personalizada para mostrar mensajes en la consola
export function print(message, type = 'info') {
    // Verificamos si estamos en modo desarrollo
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString(); // Obtenemos la fecha y hora actuales
      switch (type) {
        case 'info':
          console.log(`[DEV LOG] [INFO] [${timestamp}]: ${message}`);
          break;
        case 'warning':
          console.warn(`[DEV LOG] [WARNING] [${timestamp}]: ${message}`);
          break;
        case 'error':
          console.error(`[DEV LOG] [ERROR] [${timestamp}]: ${message}`);
          break;
        default:
          console.log(`[DEV LOG] [${timestamp}]: ${message}`);
      }
    }
  }