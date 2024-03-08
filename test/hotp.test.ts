import { Base32 } from '../src/base32';
import { generateHotp } from '../src/hotp';

test('RFC 4226, Appendix D Test values', () => {
  // ASCII 12345678901234567890 base32 encoded
  const secretBase32 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  const expectedCodes = [
    '755224',
    '287082',
    '359152',
    '969429',
    '338314',
    '254676',
    '287922',
    '162583',
    '399871',
    '520489',
  ];
  const secretParsed = Base32.decode(secretBase32);
  for (let count = 0; count < 10; count++) {
    const code = generateHotp(secretParsed, count);
    expect(code).toEqual(expectedCodes[count]);
  }
});
