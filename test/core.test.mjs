import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  IRANIAN_BANKS,
  detectBank,
  detectBankByCardNumber,
  detectBankByIban,
  isValidIranianCardNumber,
  isValidIranianIban,
  normalizeBankNumber,
} from "../dist/core.js";
import { getBankLogo } from "../dist/logos.js";

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
    if (bank.ibanCode)
      assert.equal(detectBankByIban("IR00" + bank.ibanCode)?.key, bank.key);
    for (const prefix of bank.cardPrefixes) {
      assert.equal(detectBankByCardNumber(prefix)?.key, bank.key);
    }
  }
});

test("every catalog logo is a PNG matching its original bytes", () => {
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
    assert.ok(uri.startsWith("data:image/png;base64,"));
    const bytes = Buffer.from(uri.split(",")[1], "base64");
    assert.equal(bytes.subarray(1, 4).toString(), "PNG");
    assert.deepEqual(
      bytes,
      readFileSync(new URL(`../logos/${bank.key}.png`, import.meta.url)),
    );
  }
  assert.equal(getBankLogo({ key: "unknown" }), undefined);
  assert.equal(getBankLogo({ key: "toString" }), undefined);
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
