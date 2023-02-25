export function useFormatNumber(numero) {
  let numeroAbsoluto = Math.abs(numero);
  let numeroFormateado = numeroAbsoluto.toString().padStart(2, "0");
  if (numero >= -10 && numero < 0) {
    return "-" + numeroFormateado;
  } 
  if(numero === 0 ){
    return "0"
  }
  if (numero >= 0 && numero < 10) {
    return numeroFormateado;
  } 
  return numero.toString();
  
}