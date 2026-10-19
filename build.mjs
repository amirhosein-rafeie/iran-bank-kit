import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
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
for (const filename of readdirSync(join(directory, "logos")).sort()) {
  if (!filename.endsWith(".png")) continue;
  logos[filename.slice(0, -4)] =
    "data:image/png;base64," +
    readFileSync(join(directory, "logos", filename)).toString("base64");
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
