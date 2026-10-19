import type { IranianBank } from "./banks.js";

/** Returns a bundled PNG data URI; no CDN or public-folder setup is required. */
export declare function getBankLogo(
  bank: Pick<IranianBank, "key">,
): string | undefined;
