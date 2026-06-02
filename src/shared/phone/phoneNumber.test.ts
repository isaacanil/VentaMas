import {
  formatPhoneForInput,
  getPhoneValidationMessage,
  isPhoneNumberValid,
  normalizePhoneToE164,
} from './phoneNumber';

describe('phoneNumber', () => {
  it('normaliza telefonos dominicanos locales a E.164', () => {
    expect(normalizePhoneToE164('809-123-4567')).toBe('+18091234567');
    expect(normalizePhoneToE164('(829) 222-3333')).toBe('+18292223333');
  });

  it('conserva telefonos internacionales validos en E.164', () => {
    expect(normalizePhoneToE164('+1 849 555 1212')).toBe('+18495551212');
  });

  it('formatea valores validos para entrada visible', () => {
    expect(formatPhoneForInput('+18091234567')).toContain('809');
  });

  it('no encierra en parentesis codigos de area parciales', () => {
    expect(formatPhoneForInput('849')).toBe('849');
    expect(formatPhoneForInput('(849)')).toBe('849');
    expect(formatPhoneForInput('8490')).toContain('(849)');
  });

  it('reporta errores solo para entradas no vacias invalidas', () => {
    expect(isPhoneNumberValid('809-123-4567')).toBe(true);
    expect(getPhoneValidationMessage('')).toBeNull();
    expect(getPhoneValidationMessage('123')).toBe('Telefono invalido.');
  });
});
