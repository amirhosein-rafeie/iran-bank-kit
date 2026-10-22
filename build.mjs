import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const directory = dirname(fileURLToPath(import.meta.url));
const configPath = join(directory, "tsconfig.json");
const config = ts.readConfigFile(configPath, ts.sys.readFile);
if (config.error)
  throw new Error(
    ts.flattenDiagnosticMessageText(config.error.messageText, "\n"),
  );
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, directory);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
if (diagnostics.length) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => directory,
      getCanonicalFileName: (file) => file,
      getNewLine: () => "\n",
    }),
  );
  process.exit(1);
}
if (program.emit().emitSkipped) throw new Error("TypeScript emit failed");
const logos = {};
const { IRANIAN_BANKS } = await import("./dist/banks.js");
for (const bank of IRANIAN_BANKS) {
  const path = join(directory, "logos", `${bank.key}.svg`);
  if (!existsSync(path)) continue;
  logos[bank.key] = "data:image/svg+xml;base64," +
    readFileSync(path).toString("base64");
}
mkdirSync(join(directory, "dist"), { recursive: true });
writeFileSync(
  join(directory, "dist/logos.js"),
  `const logos = ${JSON.stringify(logos)};\nexport function getBankLogo(bank) { return Object.hasOwn(logos, bank.key) ? logos[bank.key] : undefined; }\n`,
);
copyFileSync(
  join(directory, "lib/logos.d.ts"),
  join(directory, "dist/logos.d.ts"),
);
