// Проверка на оформлението при 1280×720 (изискване от спецификацията).
// 1) Никои две числови клетки ([data-num]) не се застъпват.
// 2) Текстът в числова клетка не прелива (scrollWidth ≤ clientWidth).
// 3) Текстове в една SVG графика не се застъпват.
// 4) Страницата няма хоризонтален скрол — скрол имат само обвивките на тежките таблици.
// Пуска се с: npm run build && npm run check:layout   (скрийншотите отиват в tests/screens/)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const PORT = 4174;
const OUT = new URL('./screens/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
await new Promise((res) => server.stdout.on('data', (d) => String(d).includes(String(PORT)) && res()));

const LONG = 'the first half was boring and slow but the ending was absolutely brilliant and i really loved the music the actors and the story even though my friend thought it was a total waste of time and money honestly';

const exe = process.env.PW_CHROMIUM || undefined;
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

async function audit(label) {
  const r = await page.evaluate(() => {
    const vis = (el) => {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) return null;
      // невидимо, ако е изрязано от скрол-контейнер
      let p = el.parentElement;
      while (p) {
        const s = getComputedStyle(p);
        if (/(auto|scroll|hidden)/.test(s.overflowX + s.overflowY)) {
          const pb = p.getBoundingClientRect();
          if (b.right <= pb.left + 1 || b.left >= pb.right - 1 || b.bottom <= pb.top + 1 || b.top >= pb.bottom - 1) return null;
        }
        p = p.parentElement;
      }
      return b;
    };
    const hit = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
    const nums = [...document.querySelectorAll('[data-num]')].map((el) => ({ el, b: vis(el) })).filter((x) => x.b);
    const overlaps = [];
    for (let i = 0; i < nums.length; i++)
      for (let j = i + 1; j < nums.length; j++)
        if (!nums[i].el.contains(nums[j].el) && !nums[j].el.contains(nums[i].el) && hit(nums[i].b, nums[j].b))
          overlaps.push(`${nums[i].el.textContent} × ${nums[j].el.textContent}`);
    const overflow = nums
      .filter(({ el }) => getComputedStyle(el).display !== 'inline' && el.scrollWidth > el.clientWidth + 1)
      .map(({ el }) => `${el.textContent} (${el.scrollWidth}>${el.clientWidth})`);
    const svgOverlaps = [];
    for (const svg of document.querySelectorAll('svg')) {
      // Завъртените надписи (data-rot) имат наклонени правоъгълници; проверяват се аналитично по-долу.
      const ts = [...svg.querySelectorAll('text:not([data-rot])')].map((el) => ({ el, b: vis(el) })).filter((x) => x.b && x.el.textContent.trim());
      for (let i = 0; i < ts.length; i++)
        for (let j = i + 1; j < ts.length; j++)
          if (hit(ts[i].b, ts[j].b)) svgOverlaps.push(`${ts[i].el.textContent} × ${ts[j].el.textContent}`);
    }
    // Успоредни завъртени надписи не се застъпват, ако разстоянието между тях
    // перпендикулярно на текста (step·sin ъгъл) е по-голямо от височината на шрифта.
    for (const el of document.querySelectorAll('text[data-rot]')) {
      const a = (Number(el.dataset.rot) * Math.PI) / 180, step = Number(el.dataset.step);
      const fsz = parseFloat(getComputedStyle(el).fontSize);
      if (step > 0 && step * Math.sin(a) < fsz + 2) svgOverlaps.push(`наклонен надпис „${el.textContent}“: ${(step * Math.sin(a)).toFixed(1)} < ${fsz + 2}`);
    }
    return {
      n: nums.length,
      overlaps,
      overflow,
      svgOverlaps,
      pageScroll: document.documentElement.scrollWidth > window.innerWidth + 1 ? `${document.documentElement.scrollWidth}px` : null,
    };
  });
  const bad = r.overlaps.length + r.overflow.length + r.svgOverlaps.length + (r.pageScroll ? 1 : 0);
  console.log(`${bad ? '✗' : '✓'} ${label}: ${r.n} числа; застъпени ${r.overlaps.length}, преливащи ${r.overflow.length}, SVG ${r.svgOverlaps.length}, скрол на страницата ${r.pageScroll || 'няма'}`);
  [...r.overlaps, ...r.overflow, ...r.svgOverlaps].slice(0, 8).forEach((s) => console.log('    ', s));
  await page.screenshot({ path: `${OUT}${label}.png`, fullPage: true });
  await page.screenshot({ path: `${OUT}${label}-viewport.png` });
  return bad;
}

let fails = 0;
const base = `http://localhost:${PORT}/`;
for (const s of ['s1', 's2', 's3', 's4']) {
  await page.goto(base + '#' + s);
  await page.waitForTimeout(600);
  fails += await audit(s);
}

// Секция 3: крайна стъпка и всяка топлинна карта.
await page.goto(base + '#s3');
await page.waitForTimeout(400);
for (let k = 0; k < 11; k++) await page.keyboard.press('ArrowRight');
for (const k of ['fₜ', 'iₜ', 'gₜ', 'oₜ', 'hₜ', 'cₜ']) {
  await page.getByRole('button', { name: k, exact: true }).first().click();
  await page.waitForTimeout(150);
  fails += await audit(`s3-heat-${k.replace('ₜ', '')}`);
}
for (const g of ['f · σ', 'i · σ', 'g · tanh', 'o · σ']) {
  await page.locator('svg text', { hasText: g }).first().click();
  await page.waitForTimeout(100);
}
fails += await audit('s3-gates');

// Секция 3 и 4 с изречение от 40 думи.
await page.goto(base + '#s3');
await page.waitForTimeout(300);
await page.getByPlaceholder('Собствено изречение на английски…').first().fill(LONG);
await page.getByRole('button', { name: 'Пусни' }).first().click();
for (let k = 0; k < 39; k++) await page.keyboard.press('ArrowRight');
await page.waitForTimeout(500);
fails += await audit('s3-long');
await page.goto(base + '#s4');
await page.waitForTimeout(300);
await page.getByPlaceholder('Собствено изречение на английски…').first().fill(LONG);
await page.getByRole('button', { name: 'Пусни' }).first().click();
await page.getByRole('button', { name: '100', exact: true }).first().click();
await page.waitForTimeout(500);
fails += await audit('s4-long-N100');

await browser.close();
server.kill();
console.log(fails ? `НЕУСПЕХ: ${fails} проблема` : 'ОФОРМЛЕНИЕТО Е НАРЕД');
process.exit(fails ? 1 : 0);
