import { Base32 } from '../src/base32';
// based on https://datatracker.ietf.org/doc/html/rfc4648#section-10 but without padding

// Encode tests
test('encode BASE32("") = ""', () => {
  const input = '';
  const base32Encoded = Base32.encode(Buffer.from(input));
  expect(base32Encoded).toEqual('');
});

test('encode BASE32("f") = "MY"', () => {
  const input = 'f';
  const base32Encoded = Base32.encode(Buffer.from(input));
  expect(base32Encoded).toEqual('MY');
});

test('encode BASE32("fo") = "MZXQ"', () => {
  const input = 'fo';
  const base32Encoded = Base32.encode(Buffer.from(input));
  expect(base32Encoded).toEqual('MZXQ');
});

test('encode BASE32("foo") = "MZXW6"', () => {
  const input = 'foo';
  const base32Encoded = Base32.encode(Buffer.from(input));
  expect(base32Encoded).toEqual('MZXW6');
});

test('encode BASE32("foob") = "MZXW6YQ"', () => {
  const input = 'foob';
  const base32Encoded = Base32.encode(Buffer.from(input));
  expect(base32Encoded).toEqual('MZXW6YQ');
});

test('encode BASE32("fooba") = "MZXW6YTB"', () => {
  const input = 'fooba';
  const base32Encoded = Base32.encode(Buffer.from(input));
  expect(base32Encoded).toEqual('MZXW6YTB');
});

test('encode BASE32("foobar") = "MZXW6YTBOI"', () => {
  const input = 'foobar';
  const base32Encoded = Base32.encode(Buffer.from(input));
  expect(base32Encoded).toEqual('MZXW6YTBOI');
});

// Decode tests
test('decode BASE32("") = ""', () => {
  const input = '';
  const base32Decoded = Base32.decode(input);
  expect(base32Decoded.equals(Buffer.from(''))).toBeTruthy();
});

test('decode BASE32("f") = "MY"', () => {
  const input = 'MY';
  const base32Decoded = Base32.decode(input);
  expect(base32Decoded.equals(Buffer.from('f'))).toBeTruthy();
});

test('decode BASE32("fo") = "MZXQ"', () => {
  const input = 'MZXQ';
  const base32Decoded = Base32.decode(input);
  expect(base32Decoded.equals(Buffer.from('fo'))).toBeTruthy();
});

test('decode BASE32("foo") = "MZXW6"', () => {
  const input = 'MZXW6';
  const base32Decoded = Base32.decode(input);
  expect(base32Decoded.equals(Buffer.from('foo'))).toBeTruthy();
});

test('decode BASE32("foob") = "MZXW6YQ"', () => {
  const input = 'MZXW6YQ';
  const base32Decoded = Base32.decode(input);
  expect(base32Decoded.equals(Buffer.from('foob'))).toBeTruthy();
});

test('decode BASE32("fooba") = "MZXW6YTB"', () => {
  const input = 'MZXW6YTB';
  const base32Decoded = Base32.decode(input);
  expect(base32Decoded.equals(Buffer.from('fooba'))).toBeTruthy();
});

test('decode BASE32("foobar") = "MZXW6YTBOI"', () => {
  const input = 'MZXW6YTBOI';
  const base32Decoded = Base32.decode(input);
  expect(base32Decoded.equals(Buffer.from('foobar'))).toBeTruthy();
});
