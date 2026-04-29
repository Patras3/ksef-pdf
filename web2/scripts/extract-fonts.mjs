// Extracts Roboto fonts from pdfmake's vfs_fonts.js (legacy `var vfs = {...}`
// format) and rewrites them as a real ES module so Vite can bundle them
// without relying on pdfmake's idiosyncratic non-export shape.
//
// Run automatically via `postinstall` hook + `predev` / `prebuild`.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const vfsPath = resolve(here, "../node_modules/pdfmake/build/vfs_fonts.js");
const outPath = resolve(here, "../src/fonts.generated.ts");

const src = readFileSync(vfsPath, "utf8");
// vfs_fonts.js at top level: `var vfs = { ... };`
const vfs = new Function(`${src}\nreturn vfs;`)();

const fonts = ["Roboto-Regular.ttf", "Roboto-Medium.ttf", "Roboto-Italic.ttf", "Roboto-MediumItalic.ttf"];
for (const f of fonts) {
  if (!vfs[f]) {
    console.error(`Missing ${f} in pdfmake vfs (got: ${Object.keys(vfs).slice(0, 6).join(", ")})`);
    process.exit(1);
  }
}

const lines = [
  "// AUTO-GENERATED from node_modules/pdfmake/build/vfs_fonts.js",
  "// Do not edit by hand. Re-run `npm run build:fonts` after upgrading pdfmake.",
  "",
  "export const vfs: Record<string, string> = {",
  ...fonts.map((f) => `  ${JSON.stringify(f)}: ${JSON.stringify(vfs[f])},`),
  "};",
  "",
];

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, lines.join("\n"), "utf8");
const totalKb = Math.round(lines.join("\n").length / 1024);
console.log(`Wrote ${outPath} (${totalKb} kB, ${fonts.length} fonts)`);
