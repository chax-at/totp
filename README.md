# @chax-at/totp

A simple package which can be used to implement TOTP two-factor codes.
Implements the default use case (6-digit codes, 30s time steps, 20-byte/160-bit base32-encoded secret, using SHA1) but doesn't provide much customization.

These default values are most commonly supported in authenticator apps and should therefore work without problems.
If you're wondering why may want to use this package instead of others, check the section [Why yet another TOTP package](#why-yet-another-totp-package) at the bottom.

## Usage
Install the package by running
```
npm i @chax-at/totp
```


### TotpManager
Then, you can create a `TotpManager` to generate secrets and verify codes. You can create a `TotpManager` like this: 

```ts
import { TotpManager } from '@chax-at/totp';

const totpManager = new TotpManager({
  // This issuer will be shown in the user's authenticator app and should be something like your company/service name
  issuer: 'ExampleWebsite',
  // You can also specify `verifyWindow` here. Defaults to 2 which means that the TOTP code at current time is valid as well as the previous 2 and next 2
});
```

### Creating a secret
Assuming user `user@example.com` wants to enable two factor using their TOTP app. You now can generate a secret for this user:
```ts
// Include the user's account name/email here which is shown in their authenticator app when scanning the QR code
const { secret, otpauthUri } = totpManager.generateSecret('user@example.com');
```
* Save the returned `secret` for the user in your database. It is recommended to encrypt this secret (note that you can't hash it because you need it in plaintext to verify codes).
 > We also RECOMMEND storing the keys securely in the validation system,
       and, more specifically, encrypting them using tamper-resistant
       hardware encryption and exposing them only when required: for
       example, the key is decrypted when needed to verify an OTP value, and
       re-encrypted immediately to limit exposure in the RAM to a short
       period of time.
[RFC 6238, 5.1](https://datatracker.ietf.org/doc/html/rfc6238#section-5.1)
* Generate a QR code containing the returned `otpauthUri` and show it to your user. They can then scan it with their authenticator app.
* You may also show the `secret` so they can manually register your application in case the QR code doesn't work.
* You should require a user to enter one valid code before actually enabling two-factor authentication.

### Verifying a TOTP code
Assuming the user entered the code `123456`, then you can verify it like this:
```ts
// Returns whether the code is valid at the current time. Also returns true if it matches the previous/next [verifyWindow] codes as defined above
const isValid = totpManager.verify(secret, '123456');
```
* You should rate limit the TOTP verification so that attackers can't brute-force TOTP codes (there are only 1 000 000 possible codes)
* You should save (and deny) "used" correct tokens per user for at least `30s + 30s * verifyWindow [default 2]` so that your one-time password (the "OTP" part of TOTP) can actually only be used one time
>    Note that a prover may send the same OTP inside a given time-step
window multiple times to a verifier.  The verifier MUST NOT accept
the second attempt of the OTP after the successful validation has
been issued for the first OTP, which ensures one-time only use of an
OTP.
[RFC 6238, 5.2](https://datatracker.ietf.org/doc/html/rfc6238#section-5.2)

## Why yet another TOTP package?
There are some widely used node TOTP/2FA packages available. However, when I researched them, all of them seemed to be unmaintained and have some areas that could be improved.
Obviously, the TOTP specification is 10 years old and didn't change since then - but I was still unhappy with the packages available.

Your use-case might vary (e.g. if you need more customization than this package can offer), but here are the reasons why I didn't use other packages and decided to write my own:

* speakeasy seems to be the most recommended package in tutorials. However, it doesn't generate secure secrets.
  * speakeasy forgot that the letter "j" exists, therefore it doesn't appear in the secret at all \[[source](https://github.com/speakeasyjs/speakeasy/blob/cff2bb42cde5e74c43493a8f26b20e52960df531/index.js#L563)\]
  * speakeasy introduces a bias in the secret which doesn't make it completey random. There is a [PR](https://github.com/speakeasyjs/speakeasy/pull/92) attempting to fix it - but the package is not maintained.
* otplib has even more weekly downloads and doesn't have a bias in their secret generation. However, their generated secrets are way too short (unless you specify a length) and don't even meet the minimum defined in the TOTP specification.
  * RFC 4226 states that "The length of the shared secret MUST be at least 128 bits. This document RECOMMENDs a shared secret length of 160 bits."
  * This means that a secret must be at least 16 bytes long, and is recommended to be 20 bytes long (which this @chax-at/totp uses)
  * However, otplib changed their default (in a [20k lines changed commit](https://github.com/yeojz/otplib/commit/b088efe9da45e102e59b5cd2c0df5bddf80c5a92)) in 12.0.0 from a secure 20 bytes to just 10 bytes (80 bits) \[[source](https://github.com/yeojz/otplib/blob/v12.0.0/packages/otplib-core/src/authenticator.ts#L265-L267)]
    * This was not mentioned in the upgrade guide
    * The [issue mentioning this](https://github.com/yeojz/otplib/issues/671) from 2022 has no response from the maintainer 
  * I can't say much about the rest of the library because the code is split up in 12 packages (compared to the 2 files with 40/70 lines each in @chax-at/totp) and I couldn't track all those abstraction layers by clicking through files in GitHub
* node-2fa seems to be the best out of all the packages mentioned so far
  * `generateSecret` also returns a helpful QR code link - that immediately sends your secret to Google. You should really generate your own QR codes instead of sending your secrets to Google.
  * It depends on `notp` for key generation
    * `notp` contains code that has been deprecated in node, e.g. `new Buffer(...)`. This is not a security issue - but will show a deprecation warning for everyone using their package. There is a [PR](https://github.com/guyht/notp/pull/59) from 2021 which has not been merged yet.
    * It also has a default verification window of `50` \[[source](https://github.com/guyht/notp/blob/bbdf82a34e5cb1534c411aaa63185bfab29feba0/index.js#L112)\] for some reason which is _really_ high (The RFC recommends 1, @chax-at/totp uses 2). That's not a problem because node-2fa has their own default set to 4 - but still a weird thing to do...
  * This package doesn't have a changelog (or at least I couldn't find it)
* No other package uses constant-time comparisons for checking the code. I don't think that timing attacks are very likely, but using it is super easy and prevents these attacks.

### Why does @chax-at/totp have no customization options?
In short: because I want to keep it simple. Currently, this package has 1 dependency and ~100 lines of code (with explanation and links to the RFCs) that you can read and understand.
That's pretty cool for something as security-critical as TOTP.

I have never encountered a use-case for more options - does anyone actually use e.g. 8 digit-codes, or sha256, any time step other than 30s, ...?
And does each authenticator app support these use-cases? If so, and you would really want me to add support for this use-case, then please explain your use-case by creating a GitHub issue.
