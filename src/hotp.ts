// https://www.ietf.org/rfc/rfc4226.txt
import * as crypto from 'crypto';

export function generateHotp(secret: Uint8Array, counterValue: number): string {
  const counter = getCounterBuffer(counterValue);
  // 5.3 Generating an HOTP Value
  // Step 1: Generate an HMAC-SHA-1 value
  const hs = generateHmacSha1(secret, counter);
  // Step 2: Generate a 4-byte string (Dynamic Truncation) - as described in 5.4.
  const offset = hs[19] & 0xf;
  const p =
    ((hs[offset] & 0x7f) << 24) + (hs[offset + 1] << 16) + (hs[offset + 2] << 8) + hs[offset + 3];
  // Step 3: Compute an HOTP value
  const codeNumber = p % 1_000_000;
  return codeNumber.toString(10).padStart(6, '0');
}

function getCounterBuffer(counterValue: number): Buffer {
  // Allocate an 8 byte buffer (5.1)
  const counterBuffer = Buffer.allocUnsafe(8);

  // Go through all 8 bytes in the number, starting at the end
  let currentValue = counterValue;
  for (let i = 7; i >= 0; i--) {
    // Write the last byte into the buffer
    counterBuffer[i] = currentValue & 0xff;
    // And then shift it 8 bit to the right, so that we get the next byte
    currentValue >>= 8;
  }

  return counterBuffer;
}

function generateHmacSha1(key: Uint8Array, data: Buffer): Buffer {
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(data);
  return hmac.digest();
}
