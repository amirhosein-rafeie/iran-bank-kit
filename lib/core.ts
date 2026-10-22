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

/** Luhn validates structure only, including unknown issuers; never ownership. */
export function isValidIranianCardNumber(value: string): boolean {
  const number = normalizeBankNumber(value);
  if (!/^\d{16}$/.test(number) || /^(\d)\1{15}$/.test(number)) return false;
  const checksum = [...number].reduce((sum, digit, index) => {
    const weighted = Number(digit) * (index % 2 === 0 ? 2 : 1);
    return sum + (weighted > 9 ? weighted - 9 : weighted);
  }, 0);
  return checksum % 10 === 0;
}

/** Checks Iran's 26-character IBAN structure and ISO 13616 MOD-97 checksum. */
export function isValidIranianIban(value: string): boolean {
  const body = normalizeBankNumber(value).replace(/^IR/i, "");
  if (!/^\d{24}$/.test(body) || /^0+$/.test(body.slice(2))) return false;
  const checkDigits = Number(body.slice(0, 2));
  if (checkDigits < 2 || checkDigits > 98) return false;
  const rearranged = body.slice(2) + "1827" + body.slice(0, 2);
  let remainder = 0;
  for (const digit of rearranged)
    remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
}
