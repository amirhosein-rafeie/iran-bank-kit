import {
  createElement,
  type ImgHTMLAttributes,
  type ReactElement,
} from "react";
import { detectBank, type IranianBank } from "./core.js";
import { getBankLogo } from "./logos.js";

export type BankLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  bank?: IranianBank;
};

export function BankLogo({
  bank,
  alt,
  width = 24,
  height = 24,
  ...props
}: BankLogoProps): ReactElement | null {
  if (!bank) return null;
  const src = getBankLogo(bank);
  if (!src) return null;
  return createElement("img", {
    ...props,
    src,
    alt: alt ?? bank.name,
    width,
    height,
  });
}

export type BankIdentityProps = {
  cardNumber?: string | null;
  ibanNumber?: string | null;
  showName?: boolean;
  className?: string;
  size?: number;
};

export function BankIdentity({
  cardNumber,
  ibanNumber,
  showName = false,
  className,
  size = 24,
}: BankIdentityProps): ReactElement | null {
  const bank = detectBank({ cardNumber, ibanNumber });
  if (!bank) return null;
  return createElement(
    "span",
    {
      className,
      style: { display: "inline-flex", alignItems: "center", gap: 6 },
    },
    createElement(BankLogo, {
      bank,
      width: size,
      height: size,
      alt: showName ? "" : bank.name,
    }),
    showName ? createElement("span", null, bank.name) : null,
  );
}
