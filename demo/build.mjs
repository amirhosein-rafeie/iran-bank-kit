import { mkdir, copyFile, readFile, writeFile, cp } from "node:fs/promises";
import { IRANIAN_BANKS } from "../dist/core.js";

const output = new URL("../demo-dist/", import.meta.url);
await mkdir(new URL("lib/", output), { recursive: true });
await cp(new URL("fonts/", import.meta.url), new URL("fonts/", output), { recursive: true });
for (const file of ["style.css", "app.js"]) {
  await copyFile(new URL(file, import.meta.url), new URL(file, output));
}
const escapeHtml = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const catalog = IRANIAN_BANKS.map(bank => {
  const successor = IRANIAN_BANKS.find(item => item.key === bank.successorKey);
  return `<article class="bank-tile"><span class="bank-name"><strong>${escapeHtml(bank.name)}</strong></span><code dir="ltr">${escapeHtml(bank.cardPrefixes.join(' · ')) || '—'}</code><code class="iban-code" dir="ltr" aria-label="کد شبا">${bank.ibanCode ?? '—'}</code><small>${successor ? `جانشین: ${escapeHtml(successor.name)}` : '—'}</small></article>`;
}).join('\n');
const html = (await readFile(new URL("index.html", import.meta.url), "utf8"))
  .replace('<div id="bank-grid" class="bank-grid"></div>', `<div id="bank-grid" class="bank-grid">${catalog}</div>`);
await writeFile(new URL("index.html", output), html);
const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)[1];
await writeFile(new URL("sitemap.xml", output), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escapeHtml(canonical)}</loc></url></urlset>\n`);
for (const file of ["core.js", "banks.js", "logos.js"]) {
  await copyFile(new URL(`../dist/${file}`, import.meta.url), new URL(`lib/${file}`, output));
}
console.log("Demo built in demo-dist/");
