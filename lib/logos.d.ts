import type { IranianBank } from "./banks.js";

/** Returns a bundled SVG data URI, or undefined when no sourced logo exists. */
export declare function getBankLogo(
  bank: Pick<IranianBank, "key">,
): string | undefined;
