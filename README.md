# iran-bank-kit

Iranian bank detection, card and Sheba validation, formatting, masking, SVG logos and React components.
TypeScript types are included. Core utilities have no runtime dependencies;
React is only required when importing `iran-bank-kit/react`.

See [NOTICE.md](NOTICE.md) for catalog coverage, evidence confidence and
third-party logo information. Code is licensed under [MIT](LICENSE).

## Interactive demo

Run `npm ci` followed by `npm run demo`, then open http://127.0.0.1:4173.
The Persian RTL demo includes card/Sheba validation, live bank detection and a
searchable logo gallery. All input is processed locally in the browser.
`npm run demo:test` builds and checks the preview; `npm run demo:build` writes a
static website to `demo-dist/`, suitable for GitHub Pages. No server is needed
after deployment. Demo files are excluded from the npm package.

To publish on GitHub Pages, select **Settings → Pages → Source → GitHub Actions**
and run the **Deploy demo** workflow. It deploys only `demo-dist/`.
The build includes a static bank catalog, search metadata, structured source-code
data and `sitemap.xml`. The canonical URL targets
`https://amirhosein-rafeie.github.io/iran-bank-kit/`; update the canonical,
Open Graph URL and structured-data URL in `demo/index.html` if hosting changes.
After deployment, submit the sitemap in Google Search Console to monitor indexing.

## Core

```ts
import {
  detectBankByCardNumber,
  detectBankByIban,
  isValidIranianCardNumber,
  isValidIranianIban,
} from "iran-bank-kit";

detectBankByCardNumber("610433")?.key; // mellat
detectBankByIban("IR430120000000000000000001")?.key; // mellat
isValidIranianCardNumber("6104-3300-0000-0011"); // true
isValidIranianIban("IR430120000000000000000001"); // true
```

These full numbers are synthetic checksum fixtures, not accounts to transfer to.
Validation checks format and checksum, not existence, activity or ownership.
Detection accepts partial prefixes and does not imply checksum validity.
Unknown or conflicting bank prefixes return `undefined`. Prefix `585983` now
identifies Tejarat based on issuer documentation.

Numbers must be strings to preserve leading zeros and precision. Persian and
Arabic digits, whitespace and hyphens are supported. Other nonnumeric characters
are rejected. Sheba accepts the full `IR` form or its 24-digit numeric body.
`detectBank({ cardNumber, ibanNumber })` prefers a recognized card over the IBAN.
`IRANIAN_BANKS` and the `IranianBank` type are also exported.

Detection returns the current service bank for historical identifiers:
Ayandeh card prefix `636214` and Sheba code `062` return Melli; Ansar `627381` /
`063` and Kosar `505801` / `073` return Sepah. `BankIdentity` therefore renders
the current bank's name and logo. Melal remains a separate institution.

Historical entries stay in `IRANIAN_BANKS` with an optional `successorKey`
(`ayandeh` → `melli`, `ansar` / `kosar` → `sepah`). To exclude these entries from
a bank picker, use `IRANIAN_BANKS.filter(bank => !bank.successorKey)`.
This only excludes the documented predecessors; it does not certify that every
remaining institution is operational. Original logo assets remain available
when explicitly selecting a historical record.

This changes the detection result for those historical identifiers. The returned
bank's `ibanCode` and `cardPrefixes` describe the current bank, not necessarily
the input's original issuer. Input numbers are never rewritten; resolving a bank
does not convert a Sheba number or establish that the account is active.

## Formatting and masking

```ts
import { formatCardNumber, formatIban, maskCardNumber, maskIban } from "iran-bank-kit";

formatCardNumber("۶۱۰۴-۳۳۰۰-۰۰۰۰-۰۰۱۱"); // '6104 3300 0000 0011'
formatIban("430120000000000000000001"); // 'IR43 0120 0000 0000 0000 0000 01'
maskCardNumber("6104330000000011"); // '6104 **** **** 0011'
maskIban("IR430120000000000000000001"); // 'IR43 **** **** **** **** **00 01'
```

Formatters accept partial input, normalize Persian/Arabic digits and group every
four characters. `formatIban` adds `IR` when a numeric body is provided. Empty input
stays empty. Invalid characters or excessive length return the original input
unchanged: these functions never silently discard characters or truncate numbers.

Masks require a full, structurally numeric number; malformed or partial input
returns `undefined`, never the original unmasked value. Card masks reveal the first
and last four digits. IBAN masks reveal the country/check digits and last four digits.
Formatting and masking do not validate checksums or establish account validity.

## Detailed validation

```ts
import { validateIranianCardNumber, validateIranianIban } from "iran-bank-kit";

validateIranianCardNumber("6104330000000011"); // { valid: true }
validateIranianCardNumber("6104330000000012");
// { valid: false, error: 'invalid_checksum' }
validateIranianIban("DE430120000000000000000001");
// { valid: false, error: 'invalid_country' }
```

Both return the `BankNumberValidationResult` union: `{ valid: true }` or
`{ valid: false, error: BankNumberValidationError }`. They report the first error:

| Error | Meaning |
| --- | --- |
| `empty` | No input after normalization |
| `invalid_country` | A two-letter country prefix other than `IR` (IBAN only) |
| `invalid_characters` | Characters other than digits after removing optional `IR` |
| `invalid_length` | Not 16 card digits or 24 numeric IBAN digits |
| `repeated_digits` | All card digits are identical |
| `zero_account` | The IBAN account/bank portion is entirely zero |
| `invalid_check_digits` | IBAN check digits are outside 02–98 |
| `invalid_checksum` | Luhn or MOD-97 check failed |

The boolean `isValidIranianCardNumber` and `isValidIranianIban` APIs retain their
existing behavior and use these same validators. Unknown issuers can still have
structurally valid numbers; validation is independent of bank detection.

## Catalog coverage

There are 33 entries: all 30 names in the CBI registry snapshot retrieved on
2026-10-19 plus three inherited identifiers absent from that snapshot. Registry
presence does not establish whether every historical card prefix still works.
Pending mappings remain usable for compatibility; consult their confidence in
[catalog-audit.json](catalog-audit.json) before relying on them.

Central Bank, Iran–Venezuela and Iran–Europe were added with empty card-prefix
lists and no logo assets. No unknown card prefixes or brand colors were invented.
The optional `color` field is retained where already supplied. `ibanCode` is
optional: Iran–Europe has no confirmed IBAN mapping, so detection does not treat
CBI institution ID 097 as a confirmed bank code. See
[NOTICE.md](NOTICE.md) for source scope and remaining verification.

## React

```tsx
import { BankIdentity, BankLogo } from "iran-bank-kit/react";
import { detectBankByCardNumber } from "iran-bank-kit";

<BankIdentity cardNumber={cardNumber} />;
<BankIdentity ibanNumber={ibanNumber} showName size={24} />;
<BankLogo bank={detectBankByCardNumber(cardNumber)} width={32} height={32} />;
```

Components return `null` for unknown banks. `BankLogo` also returns `null` when
a recognized institution has no bundled logo; use `showName` on `BankIdentity`
to display its name in that case. They use native elements and inherit
the surrounding font; they require neither Next.js, Tailwind nor a design system.
`BankIdentity` supports `className`; `BankLogo` accepts native image props except
`src`. The default logo alternative text is the bank's Persian name.

## Logos

```ts
import { getBankLogo } from "iran-bank-kit/logos";
const src = bank && getBankLogo(bank); // SVG data URI, or undefined if missing
```

`getBankLogo`, `BankLogo`, `BankIdentity` and the demo share the same 30 SVG logos,
including Pasargad. Central Bank, Iran–Venezuela and Iran–Europe have
no logo; no placeholder is fabricated. The former duplicate PNGs are removed.

The logos/React entrypoints bundle image data for portable rendering, including
SSR. Core imports do not load logos or React. A strict CSP must allow `data:` in
`img-src`. For asset bundlers, individual files are exported as
`iran-bank-kit/logos/mellat.svg` and `iran-bank-kit/logos/pasargad.svg`.
PNG paths and the separate `iran-bank-kit/svg` entrypoint are not provided.
Asset sources and licenses are recorded in [logos/SOURCES.md](logos/SOURCES.md).

## Develop and test

This is an independent package. From this directory, with Node 20.9+:

```sh
npm install
npm run build
npm test
npm pack
```

Install the resulting tarball in a consumer to test it locally:

```sh
npm install /path/to/iran-bank-kit-0.1.0.tgz
```

## Publish

The package name for npm publication is `iran-bank-kit`. From this project directory:

```sh
npm ci
npm pack --dry-run
npm login --registry=https://registry.npmjs.org
npm publish --access public
```

The prepack script builds the package and runs its tests. No files from another
application are needed to build or publish this project. The source repository is
[GitHub](https://github.com/amirhosein-rafeie/iran-bank-kit); report problems through
[issues](https://github.com/amirhosein-rafeie/iran-bank-kit/issues).

The package targets ESM and React 18/19. CommonJS is not provided.
