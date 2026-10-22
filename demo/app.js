import { IRANIAN_BANKS, normalizeBankNumber, detectBankByCardNumber, detectBankByIban, isValidIranianCardNumber, isValidIranianIban } from './lib/core.js';
import { getBankLogo } from './lib/logos.js';

const $ = id => document.getElementById(id);
const digits = new Intl.NumberFormat('fa-IR');
let mode = 'card';
const values = { card: '', iban: '' };
const examples = {
  card: [['ملت · معتبر', '6104330000000011'], ['اعداد فارسی', '۶۱۰۴-۳۳۰۰-۰۰۰۰-۰۰۱۱'], ['خاورمیانه · ۵۸۵۹۴۷', '585947'], ['خاورمیانه · ۵۰۵۸۰۹', '505809'], ['آینده ← ملی', '636214'], ['شماره نامعتبر', '6104330000000012']],
  iban: [['ملت · معتبر', 'IR430120000000000000000001'], ['اعداد فارسی', 'IR۴۳۰۱۲۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۱'], ['آینده ← ملی', 'IR00062'], ['انصار ← سپه', 'IR00063'], ['شماره نامعتبر', 'IR440120000000000000000001']],
};

function logo(bank, className) {
  const source = bank && getBankLogo(bank);
  const element = document.createElement(source ? 'img' : 'span');
  element.className = className;
  if (source) { element.src = source; element.alt = ''; element.loading = 'lazy'; }
  else { element.textContent = '—'; element.setAttribute('aria-hidden', 'true'); }
  return element;
}

function updateResult() {
  const raw = $('number').value;
  values[mode] = raw;
  const normalized = normalizeBankNumber(raw);
  const body = normalized.replace(/^IR/i, '');
  const bank = mode === 'card' ? detectBankByCardNumber(raw) : detectBankByIban(raw);
  const valid = mode === 'card' ? isValidIranianCardNumber(raw) : isValidIranianIban(raw);
  const partial = mode === 'card' ? /^\d{1,15}$/.test(normalized) : /^(?:IR)?\d{0,23}$/i.test(normalized);
  $('result-name').textContent = bank?.name ?? (normalized ? 'بانک شناسایی نشد' : 'منتظر شمارهٔ شما');
  $('result-key').textContent = bank?.key ?? '—';
  $('result-logo').replaceChildren(logo(bank, ''));
  $('normalized').textContent = normalized || '—';
  $('validity').textContent = !normalized ? 'هنوز وارد نشده' : valid ? 'رقم کنترلی معتبر' : partial ? 'شماره هنوز کامل نیست' : 'ساختار یا رقم کنترلی نامعتبر';
  $('validity').className = `status ${!normalized || partial ? 'neutral' : valid ? 'valid' : 'invalid'}`;
  const historical = IRANIAN_BANKS.find(item => item.successorKey && (mode === 'card' ? item.cardPrefixes.includes(normalized.slice(0, 6)) : item.ibanCode === body.slice(2, 5)));
  $('result-note').textContent = bank && historical
    ? `این شناسه متعلق به ${historical.name} است؛ کتابخانه بانک جانشین، ${bank.name}، را برمی‌گرداند.`
    : bank && !getBankLogo(bank) ? 'بانک شناسایی شد؛ برای این بانک هنوز لوگویی در کتابخانه موجود نیست.'
    : valid && !bank ? 'رقم کنترلی معتبر است، اما شناسهٔ بانک در فهرست کتابخانه شناخته‌شده نیست.'
    : 'تشخیص بانک با پیش‌شماره انجام می‌شود و مستقل از اعتبار شماره است.';
}

function setMode(next) {
  mode = next;
  for (const button of document.querySelectorAll('[data-mode]')) button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  $('number-label').textContent = mode === 'card' ? 'شماره کارت' : 'شماره شبا';
  $('number').inputMode = mode === 'card' ? 'numeric' : 'text';
  $('number').placeholder = mode === 'card' ? '6104 3300 0000 0011' : 'IR43 0120 0000 0000 0000 0000 01';
  $('number').value = values[mode];
  $('examples').replaceChildren(...examples[mode].map(([name, value]) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = name;
    button.addEventListener('click', () => { $('number').value = value; updateResult(); });
    return button;
  }));
  updateResult();
}

function renderBanks() {
  const query = normalizeBankNumber($('search').value).toLocaleLowerCase('fa').replace(/ي/g, 'ی').replace(/ك/g, 'ک');
  const banks = IRANIAN_BANKS.filter(bank => normalizeBankNumber([bank.name, bank.key, ...bank.cardPrefixes, bank.ibanCode ?? ''].join(' ')).toLocaleLowerCase('fa').replace(/ي/g, 'ی').replace(/ك/g, 'ک').includes(query));
  $('no-results').hidden = banks.length !== 0;
  $('bank-grid').replaceChildren(...banks.map(bank => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'bank-tile';
    const name = document.createElement('strong'); name.textContent = bank.name;
    const identity = document.createElement('span'); identity.className = 'bank-name';
    identity.append(logo(bank, 'tile-logo'), name);
    const info = document.createElement('small');
    info.textContent = bank.successorKey ? `جانشین: ${IRANIAN_BANKS.find(item => item.key === bank.successorKey).name}` : getBankLogo(bank) ? '—' : 'بدون لوگو';
    if (bank.successorKey) info.className = 'historical';
    const prefix = document.createElement('code'); prefix.dir = 'ltr';
    prefix.textContent = bank.cardPrefixes.join(' · ') || '—';
    const iban = document.createElement('code'); iban.className = 'iban-code'; iban.dir = 'ltr';
    iban.textContent = bank.ibanCode ?? '—';
    iban.setAttribute('aria-label', `کد شبا: ${bank.ibanCode ?? 'ثبت نشده'}`);
    button.append(identity, prefix, iban, info);
    button.disabled = !bank.cardPrefixes.length && !bank.ibanCode;
    button.addEventListener('click', () => {
      setMode(bank.cardPrefixes.length ? 'card' : 'iban');
      $('number').value = bank.cardPrefixes[0] ?? `IR00${bank.ibanCode}`;
      updateResult();
      $('playground').scrollIntoView({ block: 'start' });
      $('number').focus({ preventScroll: true });
    });
    return button;
  }));
}

for (const button of document.querySelectorAll('[data-mode]')) button.addEventListener('click', () => setMode(button.dataset.mode));
$('number').addEventListener('input', updateResult);
$('search').addEventListener('input', renderBanks);
$('copy-code').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('usage-code').textContent); $('copy-code').textContent = 'کپی شد ✓'; }
  catch { $('copy-code').textContent = 'کد را دستی انتخاب کن'; }
  setTimeout(() => { $('copy-code').textContent = 'کپی کد'; }, 2500);
});
$('bank-count').textContent = digits.format(IRANIAN_BANKS.length);
$('prefix-count').textContent = digits.format(IRANIAN_BANKS.reduce((total, bank) => total + bank.cardPrefixes.length, 0));
$('logo-count').textContent = digits.format(IRANIAN_BANKS.filter(bank => getBankLogo(bank)).length);
setMode('card');
renderBanks();
