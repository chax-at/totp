// https://datatracker.ietf.org/doc/html/rfc4648#section-6 but without padding because it's not needed for TOTP
export class Base32 {
  // 5-bit mask
  private static readonly mask = 0b11111;
  private static readonly alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  private static readonly inverseAlphabet = new Map<string, number>();

  static {
    for (let i = 0; i < this.alphabet.length; i++) {
      this.inverseAlphabet.set(this.alphabet[i], i);
    }
  }

  /**
   * Encodes the given buffer to a base32 string according to RFC4648 but without `=` padding characters
   */
  public static encode(buffer: Buffer): string {
    let encodedString = '';

    // The offset in bits we currently have at the current byte. Increases by 5 each iteration.
    let currentBitOffset = 0;
    // The current starting byte
    let currentByteIndex = 0;

    while (currentByteIndex < buffer.length) {
      // We take [8 - currentBitOffset] bits from the first byte - how many additional bits do we need from the 2nd byte to fill 5?
      const bitsNeededFromSecondByte = 5 - (8 - currentBitOffset);
      // If the number above is positive, shift to the left to make room for the additional bits
      // Otherwise (i.e. we have too many bits in the first byte) shift to the right to remove unnecessary bits
      let value = this.shiftLeft(buffer[currentByteIndex], bitsNeededFromSecondByte);

      // If we need a 2nd byte, add it. If we reached the end of the buffer, then we treat all bits as 0 and are done with the shift left above.
      if (bitsNeededFromSecondByte > 0 && currentByteIndex + 1 < buffer.length) {
        // Taking [bitsNeededFromSecondByte] means removing the last [8 - bitsNeededFromSecondByte] bits
        value += buffer[currentByteIndex + 1] >> (8 - bitsNeededFromSecondByte);
      }

      // Add the new character from the alphabet
      encodedString += this.alphabet[value & this.mask];

      // The bit offset is always increased by 5 because we used 5 bits
      currentBitOffset += 5;

      // Go to the next byte if the offset is big enough to reach the next byte
      if (currentBitOffset >= 8) {
        currentByteIndex++;
        currentBitOffset -= 8;
      }
    }

    return encodedString;
  }

  /**
   * Decodes the given base32 string into a new buffer according to RFC4648. Ignores padding characters `=`.
   */
  public static decode(input: string): Buffer {
    // Alloc buffer and initializes it to 0
    const buffer = Buffer.alloc(Math.floor((input.length * 5) / 8));
    // Alphabet is uppercase only, and we ignore padding characters
    const uppercase = input.toUpperCase().replace(/=/g, '');
    // How many bits have we already added to the current byte? Each byte takes 8 bits
    let bitsAddedToCurrentByte = 0;
    // Where in the buffer do we write the next bits?
    let currentBufferOffset = 0;

    for (let i = 0; i < uppercase.length; i++) {
      // How many bits of the current character should we write into the next byte (because the current one is full)
      // If negative, we still need [-bitsToSecondByte] additional bits in the current byte and shift to the left to make room for it.
      const bitsToSecondByte = 5 - (8 - bitsAddedToCurrentByte);
      // Translate value from alphabet
      const currentValue = this.getValueFromChar(uppercase[i]);
      // Write to the current buffer, cutting of the last [bitsToSecondByte] bit by shifting right.
      // If negative, then we shift left instead (as described above)
      buffer[currentBufferOffset] += this.shiftRight(currentValue, bitsToSecondByte);

      if (bitsToSecondByte > 0 && currentBufferOffset + 1 < buffer.length) {
        // Create a mask that only takes the last [bitsToSecondByte] bits which we will add to the left of the next byte
        const mask = (1 << bitsToSecondByte) - 1;
        buffer[currentBufferOffset + 1] += (currentValue & mask) << (8 - bitsToSecondByte);
      }

      // We just added 5 bits
      bitsAddedToCurrentByte += 5;
      if (bitsAddedToCurrentByte >= 8) {
        // Current byte is full, go to next byte
        currentBufferOffset++;
        bitsAddedToCurrentByte -= 8;
      }
    }
    return buffer;
  }

  private static getValueFromChar(char: string): number {
    const value = this.inverseAlphabet.get(char);
    if (value == null) {
      throw new Error(`base32 decode: Invalid char: ${char}`);
    }
    return value;
  }

  /**
   * Shift left that will shift right instead when the shiftAmount is negative
   */
  private static shiftLeft(value: number, shiftAmount: number): number {
    if (shiftAmount >= 0) {
      return value << shiftAmount;
    }

    return value >> -shiftAmount;
  }

  /**
   * Shift right that will shift left instead when the shiftAmount is negative
   */
  private static shiftRight(value: number, shiftAmount: number): number {
    return this.shiftLeft(value, -shiftAmount);
  }
}
