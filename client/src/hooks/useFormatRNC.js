export function useFormatRNC(rnc) {
    //Verificar si tiene el formato correcto (9 digitos)
    if (!/^\d{9}$/.test(rnc)) {
        return "9 dígitos";
      }
      return 'listo';
    
  }