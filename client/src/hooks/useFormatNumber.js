export function useFormatNumber(numero, type = "string", round = false) {
  if (isNaN(numero)) {
    return null;
  }

  if (type === "number") {
    return round ? parseFloat(numero.toFixed(2)) : numero;
  }

  const signo = Math.sign(numero) === -1 ? "-" : "";
  const numeroAbsoluto = Math.abs(numero);
  const esDecimal = !Number.isInteger(numeroAbsoluto);
  const numeroFormateado = new Intl.NumberFormat("en-US", {
    minimumIntegerDigits: 1,
    minimumFractionDigits: esDecimal ? 1 : 0,
    maximumFractionDigits: esDecimal ? 2 : 0,
  }).format(numeroAbsoluto);

  return signo + (numeroAbsoluto < 10 && numeroAbsoluto > 0 ? "" : "") + numeroFormateado;
}
