// Проверява, че forward pass в JS съвпада с Python (reference.json) до 3-тия знак
// и че синтетичните модели дават записаната точност.
// Пуска се с: npm test
import { readFileSync } from 'node:fs';

const W = JSON.parse(readFileSync(new URL('../src/model/weights.json', import.meta.url)));
const REF = JSON.parse(readFileSync(new URL('./reference.json', import.meta.url)));

// forward.js импортира JSON модул; в Node зареждаме кода с подменен импорт.
const src = readFileSync(new URL('../src/model/forward.js', import.meta.url), 'utf8')
  .replace("import W from './weights.json';", 'const W = globalThis.__W;');
globalThis.__W = W;
const F = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));

let fails = 0, checks = 0;
const close = (a, b, tol = 1e-3) => Math.abs(a - b) <= tol;

for (const [sentence, byCell] of Object.entries(REF)) {
  for (const cell of ['rnn', 'lstm']) {
    const steps = F.run(cell, F.tokenize(sentence));
    const ref = byCell[cell];
    if (steps.length !== ref.length) { fails++; console.log('LEN', cell, sentence, steps.length, ref.length); continue; }
    steps.forEach((s, t) => {
      checks++;
      if (!close(s.p, ref[t].p)) { fails++; console.log('P', cell, sentence, t, s.p, ref[t].p); }
      for (let j = 0; j < F.H; j++) {
        checks++;
        if (!close(s.h[j], ref[t].h[j])) { fails++; console.log('H', cell, sentence, t, j); }
        if (cell === 'lstm') {
          for (const g of ['i', 'f', 'g', 'o']) {
            checks++;
            if (!close(s.gates[g][j], ref[t][g][j])) { fails++; console.log('G', g, sentence, t, j); }
          }
          checks++;
          if (!close(s.c[j], ref[t].c[j])) { fails++; console.log('C', sentence, t, j); }
        }
      }
    });
  }
}
console.log(`IMDB: ${checks} проверки, ${fails} разлики`);

// Синтетични: собствени 2000 примера; точността трябва да е в ±3% от записаната.
let synFails = 0;
for (const N of F.SYN_NS) {
  for (const cell of ['rnn', 'lstm']) {
    const rand = F.rng(123 + N);
    let ok = 0;
    for (let t = 0; t < 2000; t++) {
      const seq = F.makeSequence(N, rand);
      const p = F.runSynthetic(cell, N, seq).at(-1).p;
      if ((p > 0.5 ? 1 : 0) === seq[0]) ok++;
    }
    const acc = ok / 2000, stored = F.synthAcc(cell, N);
    const good = Math.abs(acc - stored) <= 0.03;
    if (!good) synFails++;
    console.log(`N=${String(N).padStart(3)} ${cell.padEnd(4)} JS=${acc.toFixed(3)} Python=${stored.toFixed(3)} ${good ? 'OK' : 'РАЗЛИКА'}`);
  }
}
for (const N of F.SYN_NS) console.log(`N=${N}: единица на паметта = ${F.memoryUnit(N) + 1}`);
console.log('Най-близки до waste:', F.nearest('waste').map((x) => x.w).join(', '));
console.log('Токенизация:', JSON.stringify(F.tokenize('I didn’t enjoy it, honestly.')));

if (fails || synFails) { console.log('НЕУСПЕХ'); process.exit(1); }
console.log('ВСИЧКО Е НАРЕД');
