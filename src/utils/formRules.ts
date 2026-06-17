import type { FormRule } from 'antd';

export const PASSWORD_STRENGTH_RULE: FormRule[] = [
  { required: true, message: 'Por favor ingresa la contraseña.' },
  { min: 8, message: 'Debe tener al menos 8 caracteres.' },
  {
    pattern: /(?=.*[A-Z])/,
    message: 'Incluye al menos una letra mayúscula.',
  },
  {
    pattern: /(?=.*[a-z])/,
    message: 'Incluye al menos una letra minúscula.',
  },
  {
    pattern: /(?=.*\d)/,
    message: 'Incluye al menos un número.',
  },
];
