import * as crypto from 'crypto';
import { base32 } from 'rfc4648';
import { generateHotp } from './hotp';

export class TotpManager {
  constructor(
    private readonly options: {
      /**
       * Issuer is included in the otpauth URI
       */
      issuer: string;
      /**
       * Verify window in each direction, defaults to 2 (meaning +/- 2)
       */
      verifyWindow?: number;
    },
  ) {}

  /**
   * Generates a new base32 encoded secret which can be used for TOTP generation.
   * Also returns an OtpAuth URI which can be converted into a QR code for authenticators
   *
   * @param accountName - Account name (i.e. user's email address) that is included in the OtpAuth URI
   */
  public generateSecret(accountName: string): { secret: string; otpauthUri: string } {
    // Length 20 bytes = 160 bits, according to https://www.ietf.org/rfc/rfc4226.txt recommendation
    const length = 20;
    const randomBytesBuffer = crypto.randomBytes(length);
    const secret = base32.stringify(randomBytesBuffer, { pad: false });
    // otpauth URI according to https://github.com/google/google-authenticator/wiki/Key-Uri-Format
    const encodedIssuer = encodeURIComponent(this.options.issuer);
    const encodedAccountName = encodeURIComponent(accountName);
    // Issuer is in the prefix as well as query parameter, as recommended by Google (check link above)
    const otpauthUri = `otpauth://totp/${encodedIssuer}:${encodedAccountName}?secret=${secret}&issuer=${encodedIssuer}`;
    return {
      secret,
      otpauthUri,
    };
  }

  /**
   * Verifies whether the given TOTP code is correct with the given secret at the current time.
   * Also includes a verify window as described in the options
   *
   * @param secret
   * @param code
   */
  public verify(secret: string, code: string): boolean {
    const verifyWindow = this.options.verifyWindow ?? 2;
    if (verifyWindow < 0) throw new Error('verifyWindow must be >= 0');

    const secretParsed = base32.parse(secret);
    // https://datatracker.ietf.org/doc/html/rfc6238#section-4.2
    const currentCounterValue = Math.floor(Date.now() / 30_000);
    for (let offset = -verifyWindow; offset <= verifyWindow; offset++) {
      const expectedCode = generateHotp(secretParsed, currentCounterValue + offset);
      if (crypto.timingSafeEqual(Buffer.from(code), Buffer.from(expectedCode))) {
        // We can early return here because timing attacks are not relevant when the value is correct
        return true;
      }
    }

    return false;
  }
}
