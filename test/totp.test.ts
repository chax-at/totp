import { base32 } from 'rfc4648';
import { TotpManager } from '../src';
import { generateHotp } from '../src/hotp';

const totpManager = new TotpManager({
  issuer: 'Test',
  verifyWindow: 0,
});

// ASCII 12345678901234567890 base32 encoded
const secretBase32 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});
// https://datatracker.ietf.org/doc/html/rfc6238#appendix-B
test('RFC 6238, Appendix B. Test Vectors 59', () => {
  jest.setSystemTime(new Date(59 * 1000));
  // Cut off the first 2 digits because we have 6-digit-codes compared to the 8 digits in the RFC
  expect(totpManager.verify(secretBase32, '287082')).toEqual(true);
  expect(totpManager.verify(secretBase32, '157458')).toEqual(false);
});

test('RFC 6238, Appendix B. Test Vectors 62 (Verify Window)', () => {
  // This test should still work because of the default verify window
  const totpWithDefaultWindow = new TotpManager({
    issuer: 'Test2',
  });
  jest.setSystemTime(new Date(62 * 1000));
  // Cut off the first 2 digits because we have 6-digit-codes compared to the 8 digits in the RFC
  expect(totpWithDefaultWindow.verify(secretBase32, '287082')).toEqual(true);
  expect(totpWithDefaultWindow.verify(secretBase32, '157458')).toEqual(false);
});

test('RFC 6238, Appendix B. Test Vectors 62 (Invalid verify Window)', () => {
  // This test should NOT work because of the 0 verification window
  jest.setSystemTime(new Date(62 * 1000));
  // Cut off the first 2 digits because we have 6-digit-codes compared to the 8 digits in the RFC
  expect(totpManager.verify(secretBase32, '287082')).toEqual(false);
});

test('RFC 6238, Appendix B. Test Vectors 1111111109', () => {
  jest.setSystemTime(new Date(1111111109 * 1000));
  // Cut off the first 2 digits because we have 6-digit-codes compared to the 8 digits in the RFC
  expect(totpManager.verify(secretBase32, '081804')).toEqual(true);
  expect(totpManager.verify(secretBase32, '157458')).toEqual(false);
});

test('RFC 6238, Appendix B. Test Vectors 1111111111', () => {
  jest.setSystemTime(new Date(1111111111 * 1000));
  // Cut off the first 2 digits because we have 6-digit-codes compared to the 8 digits in the RFC
  expect(totpManager.verify(secretBase32, '050471')).toEqual(true);
  expect(totpManager.verify(secretBase32, '157458')).toEqual(false);
});

test('RFC 6238, Appendix B. Test Vectors 1234567890', () => {
  jest.setSystemTime(new Date(1234567890 * 1000));
  // Cut off the first 2 digits because we have 6-digit-codes compared to the 8 digits in the RFC
  expect(totpManager.verify(secretBase32, '005924')).toEqual(true);
  expect(totpManager.verify(secretBase32, '157459')).toEqual(false);
});

test('RFC 6238, Appendix B. Test Vectors 2000000000', () => {
  jest.setSystemTime(new Date(2000000000 * 1000));
  // Cut off the first 2 digits because we have 6-digit-codes compared to the 8 digits in the RFC
  expect(totpManager.verify(secretBase32, '279037')).toEqual(true);
  expect(totpManager.verify(secretBase32, '157458')).toEqual(false);
});

test('RFC 6238, Appendix B. Test Vectors 20000000000', () => {
  jest.setSystemTime(new Date(20000000000 * 1000));
  // Cut off the first 2 digits because we have 6-digit-codes compared to the 8 digits in the RFC
  expect(totpManager.verify(secretBase32, '353130')).toEqual(true);
  expect(totpManager.verify(secretBase32, '157458')).toEqual(false);
});

test('Otpauth URL', () => {
  const { secret, otpauthUri } = totpManager.generateSecret('AccountName');
  expect(otpauthUri.startsWith('otpauth://totp/Test:AccountName?')).toEqual(true);
  expect(otpauthUri).toContain('secret=');
  expect(otpauthUri).toContain('issuer=Test');
  expect(otpauthUri).toContain(`secret=${secret}`);
});

test('Complete OTP generation', () => {
  const { secret } = totpManager.generateSecret('AccountName');
  const secretParsed = base32.parse(secret);
  // Generate TOTP (simulating the TOTP app)
  const currentCounterValue = Math.floor(Date.now() / 30_000);
  const totpCode = generateHotp(secretParsed, currentCounterValue);

  expect(totpManager.verify(secret, totpCode)).toEqual(true);
});
