import { IRANIAN_BANKS, type IranianBank } from "./banks.js";

export { IRANIAN_BANKS, type IranianBank } from "./banks.js";

/** Converts Persian/Arabic digits and removes display spaces and hyphens only. */
export function normalizeBankNumber(value: string): string {
  return value
    .replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (digit) =>
      String(digit.charCodeAt(0) & 0xf),
    )
    .replace(/[\s-]/g, "");
}

function resolveCurrentBank(bank?: IranianBank): IranianBank | undefined {
  return bank?.successorKey
    ? IRANIAN_BANKS.find((candidate) => candidate.key === bank.successorKey)
    : bank;
}

/** Detects the current service bank while typing; does not validate a card. */
export function detectBankByCardNumber(
  value?: string | null,
): IranianBank | undefined {
  if (!value) return undefined;
  const number = normalizeBankNumber(value);
  if (!/^\d{6,16}$/.test(number)) return undefined;
  const matches = IRANIAN_BANKS.filter((bank) =>
    bank.cardPrefixes.includes(number.slice(0, 6)),
  );
  // Conflicting inherited prefixes must not silently select the wrong bank.
  return matches.length === 1 ? resolveCurrentBank(matches[0]) : undefined;
}

/** Detects the current service bank from full or partial Sheba; no conversion. */
export function detectBankByIban(
  value?: string | null,
): IranianBank | undefined {
  if (!value) return undefined;
  const number = normalizeBankNumber(value).replace(/^IR/i, "");
  if (!/^\d{5,24}$/.test(number)) return undefined;
  return resolveCurrentBank(
    IRANIAN_BANKS.find((bank) => bank.ibanCode === number.slice(2, 5)),
  );
}

export function detectBank(input: {
  cardNumber?: string | null;
  ibanNumber?: string | null;
}): IranianBank | undefined {
  return (
    detectBankByCardNumber(input.cardNumber) ??
    detectBankByIban(input.ibanNumber)
  );
}

/** Formats full or partial input; invalid input is returned unchanged, never truncated. */
export function formatCardNumber(value: string): string {
  const number = normalizeBankNumber(value);
  return /^\d{0,16}$/.test(number)
    ? number.replace(/(\d{4})(?=\d)/g, "$1 ")
    : value;
}

/** Formats optional-IR input in four-character groups, adding the country prefix. */
export function formatIban(value: string): string {
  const normalized = normalizeBankNumber(value);
  const body = normalized.replace(/^IR/i, "");
  if (!/^\d{0,24}$/.test(body)) return value;
  if (!normalized) return "";
  return (`IR${body}`).replace(/(.{4})(?=.)/g, "$1 ");
}

/** Masks the middle eight digits; malformed/incomplete input returns undefined. */
export function maskCardNumber(value: string): string | undefined {
  const number = normalizeBankNumber(value);
  if (!/^\d{16}$/.test(number)) return undefined;
  return `${number.slice(0, 4)} **** **** ${number.slice(-4)}`;
}

/** Reveals only country/check digits and the last four digits; no checksum validation. */
export function maskIban(value: string): string | undefined {
  const body = normalizeBankNumber(value).replace(/^IR/i, "");
  if (!/^\d{24}$/.test(body)) return undefined;
  return (`IR${body.slice(0, 2)}${"*".repeat(18)}${body.slice(-4)}`)
    .replace(/(.{4})(?=.)/g, "$1 ");
}

export type BankNumberValidationError =
  | "empty"
  | "invalid_characters"
  | "invalid_length"
  | "invalid_country"
  | "repeated_digits"
  | "zero_account"
  | "invalid_check_digits"
  | "invalid_checksum";

export type BankNumberValidationResult =
  | { valid: true }
  | { valid: false; error: BankNumberValidationError };

/** Returns the first structural/checksum error; does not verify accounts or issuers. */
export function validateIranianCardNumber(value: string): BankNumberValidationResult {
  const number = normalizeBankNumber(value);
  if (!number) return { valid: false, error: "empty" };
  if (!/^\d+$/.test(number)) return { valid: false, error: "invalid_characters" };
  if (number.length !== 16) return { valid: false, error: "invalid_length" };
  if (/^(\d)\1{15}$/.test(number)) return { valid: false, error: "repeated_digits" };
  const checksum = [...number].reduce((sum, digit, index) => {
    const weighted = Number(digit) * (index % 2 === 0 ? 2 : 1);
    return sum + (weighted > 9 ? weighted - 9 : weighted);
  }, 0);
  return checksum % 10 === 0
    ? { valid: true }
    : { valid: false, error: "invalid_checksum" };
}

/** Returns the first error for Iran's IBAN, accepting IR or a numeric body. */
export function validateIranianIban(value: string): BankNumberValidationResult {
  const normalized = normalizeBankNumber(value);
  if (!normalized) return { valid: false, error: "empty" };
  if (/^[a-z]{2}/i.test(normalized) && !/^IR/i.test(normalized))
    return { valid: false, error: "invalid_country" };
  const body = normalized.replace(/^IR/i, "");
  if (!/^\d*$/.test(body)) return { valid: false, error: "invalid_characters" };
  if (body.length !== 24) return { valid: false, error: "invalid_length" };
  if (/^0+$/.test(body.slice(2))) return { valid: false, error: "zero_account" };
  const checkDigits = Number(body.slice(0, 2));
  if (checkDigits < 2 || checkDigits > 98)
    return { valid: false, error: "invalid_check_digits" };
  const rearranged = body.slice(2) + "1827" + body.slice(0, 2);
  let remainder = 0;
  for (const digit of rearranged)
    remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1
    ? { valid: true }
    : { valid: false, error: "invalid_checksum" };
}

/** Luhn validates structure only, including unknown issuers; never ownership. */
export function isValidIranianCardNumber(value: string): boolean {
  return validateIranianCardNumber(value).valid;
}

/** Checks Iran's 26-character IBAN structure and ISO 13616 MOD-97 checksum. */
export function isValidIranianIban(value: string): boolean {
  return validateIranianIban(value).valid;
}
