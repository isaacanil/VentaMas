import { nanoid } from "nanoid";

export function generateEmail() {
    const dominio = 'ventamax.com'; // Dominio de correo electrónico que deseas utilizar
    const longitud = 16; // Longitud del identificador generado por nanoid
    const identificador = nanoid(longitud);
    const correoElectronico = `${identificador}@${dominio}`;
    return correoElectronico;
  }