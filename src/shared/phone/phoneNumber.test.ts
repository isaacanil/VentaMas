import {
  buildWhatsAppUrl,
  formatDominicanPhoneForLegacyDisplay,
  formatPhoneForInternationalDisplay,
  formatPhoneForInput,
  formatPhoneForLegacyDisplay,
  getPhoneCountryCallingCode,
  getPhoneValidationMessage,
  getSupportedPhoneCountries,
  isPhoneInputValid,
  isPhoneNumberValid,
  normalizePhoneToE164,
  unformatPhoneForStorage,
} from './phoneNumber';

describe('phoneNumber', () => {
  it('normaliza telefonos dominicanos locales a E.164', () => {
    expect(normalizePhoneToE164('809-123-4567')).toBe('+18091234567');
    expect(normalizePhoneToE164('(829) 222-3333')).toBe('+18292223333');
  });

  it('conserva telefonos internacionales validos en E.164', () => {
    expect(normalizePhoneToE164('+1 849 555 1212')).toBe('+18495551212');
  });

  it('expone paises y prefijos telefonicos para formularios', () => {
    expect(getSupportedPhoneCountries()).toContain('DO');
    expect(getPhoneCountryCallingCode('DO')).toBe('1');
    expect(getPhoneCountryCallingCode('us')).toBe('1');
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

  it('mantiene el display internacional usado por wrappers legacy', () => {
    expect(formatPhoneForInternationalDisplay('8091234567')).toBe(
      '+1 809 123 4567',
    );
    expect(formatPhoneForInternationalDisplay('18091234567')).toBe(
      '+1 809 123 4567',
    );
    expect(formatPhoneForInternationalDisplay('abc')).toBe('abc');
  });

  it('mantiene el unformat de storage usado por wrappers legacy', () => {
    expect(unformatPhoneForStorage('(809) 123-4567')).toBe('+18091234567');
    expect(unformatPhoneForStorage('abc')).toBe('');
  });

  it('mantiene la validacion de input usada por wrappers legacy', () => {
    expect(isPhoneInputValid('8091234567')).toBe(true);
    expect(isPhoneInputValid('+18091234567')).toBe(true);
    expect(isPhoneInputValid('123')).toBe(false);
  });

  it('mantiene el display simple usado por pantallas legacy', () => {
    expect(formatPhoneForLegacyDisplay('8091234567')).toBe('(809) 123-4567');
    expect(formatPhoneForLegacyDisplay('18091234567')).toBe(
      '+1 (809) 123-4567',
    );
    expect(formatPhoneForLegacyDisplay('+18091234567')).toBe(
      '+1 (809) 123-4567',
    );
    expect(formatPhoneForLegacyDisplay('8091234567 8292223333')).toBe(
      '(809) 123-4567 / (829) 222-3333',
    );
    expect(formatPhoneForLegacyDisplay('sin telefono')).toBe('sin telefono');
  });

  it('formatea telefonos dominicanos locales con codigo de pais para detalles de contacto', () => {
    expect(formatDominicanPhoneForLegacyDisplay('8091234567')).toBe(
      '+1 (809) 123-4567',
    );
    expect(formatDominicanPhoneForLegacyDisplay('(809) 123-4567')).toBe(
      '+1 (809) 123-4567',
    );
    expect(formatDominicanPhoneForLegacyDisplay('+18091234567')).toBe(
      '+1 (809) 123-4567',
    );
    expect(formatDominicanPhoneForLegacyDisplay('sin telefono')).toBe(
      'sin telefono',
    );
  });

  it('construye URLs de WhatsApp con los mismos digitos visibles actuales', () => {
    expect(buildWhatsAppUrl('(809) 123-4567', 'Hola Juan')).toBe(
      'https://wa.me/8091234567?text=Hola%20Juan',
    );
    expect(buildWhatsAppUrl('', 'Hola')).toBeNull();
  });
});
