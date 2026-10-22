import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IRANIAN_BANKS, detectBankByCardNumber } from "../dist/core.js";
import { BankIdentity, BankLogo } from "../dist/react.js";

test("React renders bundled logos during SSR without Next.js or browser globals", () => {
  const markup = renderToStaticMarkup(
    createElement(BankIdentity, {
      cardNumber: "610433",
      size: 32,
      className: "bank-identity",
    }),
  );
  assert.ok(markup.includes("data:image/svg+xml;base64,"));
  assert.ok(markup.includes('alt="بانک ملت"'));
  assert.ok(markup.includes('width="32"'));
  assert.ok(markup.includes('class="bank-identity"'));
});

test("visible name avoids duplicate screen-reader text", () => {
  const markup = renderToStaticMarkup(
    createElement(BankIdentity, { ibanNumber: "IR43012", showName: true }),
  );
  assert.ok(markup.includes('alt=""'));
  assert.ok(markup.includes("<span>بانک ملت</span>"));
});

test("historical cards and Sheba render the current bank name and logo", () => {
  for (const [cardNumber, ibanNumber, key] of [
    ["636214", "IR00062", "melli"],
    ["627381", "IR00063", "sepah"],
    ["505801", "IR00073", "sepah"],
  ]) {
    const bank = IRANIAN_BANKS.find((item) => item.key === key);
    const expectedLogo = renderToStaticMarkup(createElement(BankLogo, { bank }));
    for (const input of [{ cardNumber }, { ibanNumber }]) {
      const markup = renderToStaticMarkup(createElement(BankIdentity, input));
      assert.ok(markup.includes(expectedLogo));
      const named = renderToStaticMarkup(
        createElement(BankIdentity, { ...input, showName: true }),
      );
      assert.ok(named.includes(`<span>${bank.name}</span>`));
    }
  }
});

test("unknown input renders nothing and image props remain customizable", () => {
  assert.equal(
    renderToStaticMarkup(createElement(BankIdentity, { cardNumber: "999999" })),
    "",
  );
  assert.equal(renderToStaticMarkup(createElement(BankLogo)), "");
  const markup = renderToStaticMarkup(
    createElement(BankLogo, {
      bank: detectBankByCardNumber("610433"),
      alt: "Mellat",
      height: 40,
      loading: "lazy",
    }),
  );
  assert.ok(markup.includes('alt="Mellat"'));
  assert.ok(markup.includes('height="40"'));
  assert.ok(markup.includes('loading="lazy"'));
});

test("new institutions can display their name without fabricating a logo", () => {
  const markup = renderToStaticMarkup(
    createElement(BankIdentity, { ibanNumber: "IR00010", showName: true }),
  );
  assert.ok(markup.includes("بانک مرکزی جمهوری اسلامی ایران"));
  assert.equal(markup.includes("<img"), false);
});
