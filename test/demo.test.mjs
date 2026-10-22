import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createDemoServer } from '../demo/serve.mjs';
import { detectBankByCardNumber, isValidIranianIban } from '../demo-dist/lib/core.js';

test('built demo uses the library catalog and checksum validation', () => {
  assert.equal(detectBankByCardNumber('585947').key, 'khavarmianeh');
  assert.equal(detectBankByCardNumber('505809').key, 'khavarmianeh');
  assert.equal(detectBankByCardNumber('636214').key, 'melli');
  assert.equal(isValidIranianIban('IR۴۳۰۱۲۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۱'), true);
});

test('preview serves the static demo and keeps project files private', async () => {
  const server = createDemoServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const path of ['/', '/style.css', '/app.js', '/sitemap.xml', '/lib/core.js', '/lib/banks.js', '/lib/logos.js']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200, path);
      assert.ok((await response.text()).length > 0);
    }
    const html = await (await fetch(base)).text();
    assert.match(html, /lang="fa" dir="rtl"/);
    assert.match(html, /src="\.\/app.js"/);
    const font = await fetch(base + '/fonts/Vazir-Variable.woff2');
    assert.equal(font.headers.get('content-type'), 'font/woff2');
    assert.equal(Buffer.from(await font.arrayBuffer()).subarray(0, 4).toString(), 'wOF2');
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)[1];
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    assert.equal(schema.url, canonical);
    assert.equal(schema.author.url, 'https://github.com/amirhosein-rafeie');
    assert.match(html, /rel="author" href="https:\/\/github.com\/amirhosein-rafeie"/);
    assert.doesNotMatch(html, /class="brand-mark"/);
    const catalog = html.match(/<div id="bank-grid" class="bank-grid">([\s\S]*?)<\/div>/)[1];
    for (const bank of (await import('../demo-dist/lib/core.js')).IRANIAN_BANKS) {
      assert.ok(catalog.includes(bank.name), bank.key);
      for (const prefix of bank.cardPrefixes) assert.ok(catalog.includes(prefix), prefix);
      if (bank.ibanCode) assert.ok(catalog.includes(`>${bank.ibanCode}</code>`), bank.key);
    }
    assert.ok((await (await fetch(base + '/sitemap.xml')).text()).includes(`<loc>${canonical}</loc>`));
    for (const path of ['/package.json', '/.git/config', '/%2e%2e/package.json', '/lib/../../package.json']) {
      assert.equal((await fetch(base + path)).status, 404, path);
    }
    assert.equal((await fetch(base, { method: 'POST' })).status, 404);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
