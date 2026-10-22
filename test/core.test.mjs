import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import {
  IRANIAN_BANKS,
  detectBank,
  detectBankByCardNumber,
  detectBankByIban,
  isValidIranianCardNumber,
  isValidIranianIban,
  normalizeBankNumber,
  formatCardNumber,
  formatIban,
  maskCardNumber,
  maskIban,
  validateIranianCardNumber,
  validateIranianIban,
} from "../dist/core.js";
import { getBankLogo } from "../dist/logos.js";

test("formatters support typing and preserve invalid input without truncation", () => {
  assert.equal(formatCardNumber("۶۱۰۴-۳۳۰۰-۰۰۰۰-۰۰۱۱"), "6104 3300 0000 0011");
  assert.equal(formatCardNumber("61043"), "6104 3");
  assert.equal(formatIban("ir۴۳ ۰۱۲۰ ۰۰۰۰ ۰۰۰۰ ۰۰۰۰ ۰۰۰۰ ۰۱"), "IR43 0120 0000 0000 0000 0000 01");
  assert.equal(formatIban("43012"), "IR43 012");
  assert.equal(formatIban("ir"), "IR");
  assert.equal(formatIban(""), "");
  assert.equal(formatCardNumber(""), "");
  for (const value of ["610433x000000011", "61043300000000111", "1/2", "1.2"]) {
    assert.equal(formatCardNumber(value), value);
  }
  for (const value of ["DE430120000000000000000001", "IR4301200000000000000000010", "IR43!012"]) {
    assert.equal(formatIban(value), value);
  }
  for (let length = 0; length <= 16; length++) {
    const input = "6104330000000011".slice(0, length);
    assert.equal(normalizeBankNumber(formatCardNumber(input)), input);
    assert.equal(formatCardNumber(formatCardNumber(input)), formatCardNumber(input));
  }
  for (let length = 1; length <= 24; length++) {
    const input = "430120000000000000000001".slice(0, length);
    assert.equal(normalizeBankNumber(formatIban(input)), "IR" + input);
    assert.equal(formatIban(formatIban(input)), formatIban(input));
  }
});

test("masks hide middle digits and never return malformed input unmasked", () => {
  assert.equal(maskCardNumber("۶۱۰۴-۳۳۰۰-۰۰۰۰-۰۰۱۱"), "6104 **** **** 0011");
  const masked = maskIban("IR۴۳۰۱۲۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۱");
  assert.equal(masked, "IR43 **** **** **** **** **00 01");
  assert.equal(maskIban("430120000000000000000001"), masked);
  assert.equal(masked.replace(/\D/g, ""), "430001");
  for (const value of ["", "610433", "61043300000000111", "61043300000000x1"]) {
    assert.equal(maskCardNumber(value), undefined);
  }
  for (const value of ["", "IR43012", "DE430120000000000000000001", "IR43012000000000000000000x"]) {
    assert.equal(maskIban(value), undefined);
  }
});

test("detailed validation distinguishes input and checksum errors", () => {
  for (const [input, error] of [
    [" - ", "empty"], ["610433x000000011", "invalid_characters"],
    ["610433", "invalid_length"], ["8888888888888888", "repeated_digits"],
    ["6104330000000012", "invalid_checksum"],
  ]) {
    assert.deepEqual(validateIranianCardNumber(input), { valid: false, error });
    assert.equal(isValidIranianCardNumber(input), false);
  }
  for (const [input, error] of [
    ["", "empty"], ["DE430120000000000000000001", "invalid_country"],
    ["IR43x120000000000000000001", "invalid_characters"], ["IR", "invalid_length"],
    ["IR43012", "invalid_length"], ["IR000000000000000000000000", "zero_account"],
    ["IR990120000000000000000001", "invalid_check_digits"],
    ["IR440120000000000000000001", "invalid_checksum"],
  ]) {
    assert.deepEqual(validateIranianIban(input), { valid: false, error });
    assert.equal(isValidIranianIban(input), false);
  }
  assert.deepEqual(validateIranianCardNumber("6104330000000011"), { valid: true });
  assert.deepEqual(validateIranianIban("IR430120000000000000000001"), { valid: true });
});

test("raw logo exports provide SVGs including Pasargad without duplicate PNGs", () => {
  assert.deepEqual(
    readFileSync(new URL(import.meta.resolve("iran-bank-kit/logos/mellat.svg"))),
    readFileSync(new URL("../logos/mellat.svg", import.meta.url)),
  );
  assert.deepEqual(
    readFileSync(new URL(import.meta.resolve("iran-bank-kit/logos/pasargad.svg"))),
    readFileSync(new URL("../logos/pasargad.svg", import.meta.url)),
  );
  assert.deepEqual(readdirSync(new URL("../logos/", import.meta.url)).filter(name => name.endsWith(".png")), []);
  assert.throws(() => import.meta.resolve("iran-bank-kit/logos/mellat.png"), { code: "ERR_PACKAGE_PATH_NOT_EXPORTED" });
});

test("normalizes presentation without discarding invalid characters", () => {
  assert.equal(normalizeBankNumber("۶۱۰۴-٣٣ ۰۰"), "61043300");
  assert.equal(isValidIranianCardNumber("6104330000000011x"), false);
  assert.equal(detectBankByCardNumber("x610433"), undefined);
});

test("Luhn accepts formatted numbers and rejects repeated/incorrect digits", () => {
  for (const value of [
    "6104330000000011",
    "۶۱۰۴-۳۳۰۰-۰۰۰۰-۰۰۱۱",
    "6219861034529007",
  ]) {
    assert.equal(isValidIranianCardNumber(value), true, value);
  }
  for (const value of [
    "",
    "6104330000000012",
    "8888888888888888",
    "0000000000000000",
    "610433",
  ]) {
    assert.equal(isValidIranianCardNumber(value), false, value);
  }
});

test("Iranian IBAN validates both forms, all checksum mutations, and country", () => {
  const valid = "IR430120000000000000000001";
  for (const value of [
    valid,
    valid.slice(2),
    "ir43 0120 0000 0000 0000 0000 01",
    "IR۴۳۰۱۲۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۱",
  ]) {
    assert.equal(isValidIranianIban(value), true, value);
  }
  for (let index = 2; index < valid.length; index++) {
    const changed =
      valid.slice(0, index) +
      ((Number(valid[index]) + 1) % 10) +
      valid.slice(index + 1);
    assert.equal(isValidIranianIban(changed), false, changed);
  }
  for (const value of [
    "",
    "DE430120000000000000000001",
    "IR43012",
    "IR430120000000000000000001x",
    "IR000000000000000000000000",
  ]) {
    assert.equal(isValidIranianIban(value), false, value);
  }
});

test("detects while typing, returning undefined for invalid or ambiguous prefixes", () => {
  assert.equal(detectBankByCardNumber("۶۱۰۴-۳۳")?.key, "mellat");
  assert.equal(detectBankByCardNumber("585983")?.key, "tejarat");
  assert.equal(detectBankByCardNumber("505416")?.key, "gardeshgari");
  assert.equal(detectBankByIban("IR43012")?.key, "mellat");
  assert.equal(detectBankByIban("430120000000000000000001")?.key, "mellat");
  assert.equal(
    detectBank({ cardNumber: "603799", ibanNumber: "IR43012" })?.key,
    "melli",
  );
  for (const value of [
    undefined,
    null,
    "",
    "61043",
    "999999",
    "61043300000000000",
  ]) {
    assert.equal(detectBankByCardNumber(value), undefined);
  }
  for (const value of [undefined, null, "", "IR4301", "IR00999", "GB43012"]) {
    assert.equal(detectBankByIban(value), undefined);
  }
});

test("detects both Middle East Bank prefixes, including formatted Persian input", () => {
  for (const value of ["585947", "505809", "۵۰۵۸-۰۹۰۰-۰۰۰۰-۰۰۰۰"]) {
    assert.equal(detectBankByCardNumber(value)?.key, "khavarmianeh");
    assert.equal(detectBank({ cardNumber: value })?.key, "khavarmianeh");
  }
});

test("historical identifiers resolve to current service banks without remapping Melal", () => {
  for (const [card, iban, key] of [
    ["636214", "062", "melli"],
    ["627381", "063", "sepah"],
    ["505801", "073", "sepah"],
    ["606256", "075", "melal"],
    ["603799", "017", "melli"],
    ["589210", "015", "sepah"],
  ]) {
    const current = IRANIAN_BANKS.find((bank) => bank.key === key);
    assert.equal(detectBankByCardNumber(card), current);
    assert.equal(detectBankByIban("IR00" + iban), current);
    assert.equal(detectBank({ cardNumber: card }), current);
    assert.equal(detectBank({ ibanNumber: "00" + iban }), current);
  }
  assert.equal(detectBankByCardNumber("۶۳۶۲-۱۴۰۰-۰۰۰۰-۰۰۰۰")?.key, "melli");
  assert.equal(detectBankByIban("IR۰۰۰۶۳")?.key, "sepah");
});

test("catalog keys, IBAN codes and card prefixes are unique", () => {
  assert.equal(
    new Set(IRANIAN_BANKS.map((bank) => bank.key)).size,
    IRANIAN_BANKS.length,
  );
  assert.equal(
    new Set(IRANIAN_BANKS.map((bank) => bank.ibanCode)).size,
    IRANIAN_BANKS.length,
  );
  const prefixes = new Map();
  for (const bank of IRANIAN_BANKS) {
    if (bank.ibanCode) assert.match(bank.ibanCode, /^\d{3}$/);
    else assert.equal(bank.key, "iran-europe");
    for (const prefix of bank.cardPrefixes) {
      assert.match(prefix, /^\d{6}$/);
      prefixes.set(prefix, [...(prefixes.get(prefix) ?? []), bank.key]);
    }
  }
  assert.deepEqual(
    [...prefixes].filter(([, banks]) => banks.length > 1),
    [],
  );
  for (const bank of IRANIAN_BANKS) {
    if (bank.successorKey) {
      const successor = IRANIAN_BANKS.find((item) => item.key === bank.successorKey);
      assert.ok(successor, bank.key);
      assert.notEqual(successor.key, bank.key);
      assert.equal(successor.successorKey, undefined);
    }
    const expectedKey = bank.successorKey ?? bank.key;
    if (bank.ibanCode)
      assert.equal(detectBankByIban("IR00" + bank.ibanCode)?.key, expectedKey);
    for (const prefix of bank.cardPrefixes) {
      assert.equal(detectBankByCardNumber(prefix)?.key, expectedKey);
    }
  }
});

test("all available logos are SVGs matching their sourced artwork", () => {
  for (const bank of IRANIAN_BANKS) {
    const uri = getBankLogo(bank);
    if (["central-bank", "iran-venezuela", "iran-europe"].includes(bank.key)) {
      assert.equal(
        uri,
        undefined,
        "No logo should be fabricated for a newly added institution",
      );
      continue;
    }
    const bytes = Buffer.from(uri.split(",")[1], "base64");
    assert.ok(uri.startsWith("data:image/svg+xml;base64,"), bank.key);
    assert.match(bytes.toString(), /<svg\b/);
    assert.doesNotMatch(bytes.toString(), /<(?:script|image|foreignObject)\b/);
    assert.deepEqual(bytes, readFileSync(new URL(`../logos/${bank.key}.svg`, import.meta.url)));
  }
  assert.equal(getBankLogo({ key: "unknown" }), undefined);
  assert.equal(getBankLogo({ key: "toString" }), undefined);
  assert.equal(getBankLogo({ key: "__proto__" }), undefined);
});

test("audit covers every record, source and registry entry without overstating verification", () => {
  const audit = JSON.parse(
    readFileSync(new URL("../catalog-audit.json", import.meta.url), "utf8"),
  );
  assert.deepEqual(
    Object.keys(audit.records).sort(),
    IRANIAN_BANKS.map((bank) => bank.key).sort(),
  );
  assert.equal(audit.registrySnapshot.length, 30);
  const listed = IRANIAN_BANKS.filter(
    (bank) => audit.records[bank.key].registry.status === "listed",
  );
  assert.deepEqual(
    listed.map((bank) => audit.records[bank.key].registry.institutionId).sort(),
    audit.registrySnapshot.map((bank) => bank.id).sort(),
  );
  assert.deepEqual(
    IRANIAN_BANKS.filter(
      (bank) => audit.records[bank.key].registry.status === "not_listed",
    )
      .map((bank) => bank.key)
      .sort(),
    ["ansar", "ayandeh", "kosar"],
  );
  for (const bank of IRANIAN_BANKS) {
    const record = audit.records[bank.key];
    assert.equal(record.succession?.successorKey, bank.successorKey);
    if (record.succession) {
      assert.ok(record.succession.sources.length > 0);
      for (const source of record.succession.sources)
        assert.match(audit.sources[source].checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    }
    assert.equal(record.iban.code, bank.ibanCode ?? null);
    assert.deepEqual(
      record.cardPrefixes.map((item) => item.prefix),
      bank.cardPrefixes,
    );
    assert.ok(audit.sources[record.registry.source]);
    for (const evidence of [record.iban, ...record.cardPrefixes]) {
      assert.ok(
        ["pending", "provider_documented", "issuer_documented"].includes(
          evidence.status,
        ),
      );
      for (const source of evidence.sources)
        assert.match(audit.sources[source].checkedAt, /^\d{4}-\d{2}-\d{2}$/);
      if (evidence.status !== "pending") assert.ok(evidence.sources.length > 0);
    }
  }
  assert.equal(audit.records["iran-europe"].iban.status, "pending");
  assert.equal(
    detectBankByIban("IR00097"),
    undefined,
    "Unconfirmed institution IDs must not become IBAN mappings",
  );
  assert.equal(
    audit.records.tejarat.cardPrefixes.find((item) => item.prefix === "585983")
      .status,
    "issuer_documented",
  );
});
