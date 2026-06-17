import { formatPhoneNumber as formatSimplePhoneNumber } from './formatPhoneNumber';
import {
  formatPhoneNumber as formatInternationalPhoneNumber,
  isValidPhoneNumber,
  unformatPhoneNumber,
} from './index';

describe('legacy phone format wrappers', () => {
  it('mantiene el formateo simple visible', () => {
    expect(formatSimplePhoneNumber('8091234567')).toBe('(809) 123-4567');
    expect(formatSimplePhoneNumber('18091234567')).toBe(
      '+1 (809) 123-4567',
    );
    expect(formatSimplePhoneNumber('+18091234567')).toBe(
      '+1 (809) 123-4567',
    );
    expect(formatSimplePhoneNumber('8091234567 8292223333')).toBe(
      '(809) 123-4567 / (829) 222-3333',
    );
    expect(formatSimplePhoneNumber('sin telefono')).toBe('sin telefono');
  });

  it('mantiene el wrapper internacional de index', () => {
    expect(formatInternationalPhoneNumber('8091234567')).toBe(
      '+1 809 123 4567',
    );
    expect(formatInternationalPhoneNumber('18091234567')).toBe(
      '+1 809 123 4567',
    );
    expect(formatInternationalPhoneNumber('abc')).toBe('abc');
  });

  it('mantiene unformatPhoneNumber e isValidPhoneNumber de index', () => {
    expect(unformatPhoneNumber('(809) 123-4567')).toBe('+18091234567');
    expect(unformatPhoneNumber('abc')).toBe('');
    expect(isValidPhoneNumber('8091234567')).toBe(true);
    expect(isValidPhoneNumber('123')).toBe(false);
  });
});
