// Forward pass на RNN и LSTM в браузъра. Същата математика като training/probe.py.
// Ред на гейтовете в теглата (PyTorch): i, f, g, o — по H реда всеки.
import W from './weights.json';

export const H = W.meta.hidden; // 4
export const EMB = W.meta.emb; // 8
export const VOCAB = W.vocab;
export const MODELS = W.models; // { rnn, lstm }
export const SYNTH = W.synthetic; // { models: { 'lstm_30': {...} } }
export const ACC = W.meta.acc;

const STOI = new Map(VOCAB.map((w, i) => [w, i]));
const TOKEN_RE = /[a-z]+(?:'[a-z]+)?/g;
export const MAX_WORDS = 40;

export const sigmoid = (z) => 1 / (1 + Math.exp(-z));

/** Текст → думи (същият регулярен израз като при обучението). */
export function tokenize(text) {
  const norm = text.replace(/[‘’ʼ]/g, "'").toLowerCase();
  return norm.match(TOKEN_RE) || [];
}

/** Индекс в речника; 1 = <unk>. */
export const wordId = (w) => (STOI.has(w) ? STOI.get(w) : 1);
export const isKnown = (w) => STOI.has(w);

const dot = (a, b) => {
  let s = 0;
  for (let k = 0; k < a.length; k++) s += a[k] * b[k];
  return s;
};

/**
 * Пресмята z за ред r: Wx[r]·x + Wh[r]·h + b[r], с разбивка по членове
 * (за картата „формален неврон“).
 */
export function preact(m, r, x, h) {
  const wx = m.Wx[r];
  const wh = m.Wh[r];
  const terms = [];
  for (let k = 0; k < x.length; k++) terms.push({ src: 'x', k, in: x[k], w: wx[k], prod: x[k] * wx[k] });
  for (let k = 0; k < h.length; k++) terms.push({ src: 'h', k, in: h[k], w: wh[k], prod: h[k] * wh[k] });
  const sum = terms.reduce((s, t) => s + t.prod, 0);
  return { terms, bias: m.b[r], z: sum + m.b[r] };
}

const zeros = (n) => new Array(n).fill(0);

/**
 * Пуска модела по списък с думи.
 * cell: 'rnn' | 'lstm'
 * opts (само LSTM): lockF, lockI — число 0..1 или null; fBiasDelta — масив от H числа (добавка към bias на forget gate).
 * Връща масив от стъпки: { w, id, known, x, hPrev, cPrev, z, gates, c, h, p }
 */
export function run(cell, words, opts = {}, m = MODELS[cell]) {
  const steps = [];
  let h = zeros(H);
  let c = zeros(H);
  for (const w of words) {
    const id = typeof w === 'number' ? w : wordId(w);
    const x = m.emb[id];
    const hPrev = h;
    const cPrev = c;
    if (cell === 'rnn') {
      const z = [];
      const hn = [];
      for (let j = 0; j < H; j++) {
        const zz = dot(m.Wx[j], x) + dot(m.Wh[j], h) + m.b[j];
        z.push(zz);
        hn.push(Math.tanh(zz));
      }
      h = hn;
      steps.push({ w, id, known: id !== 1, x, hPrev, cPrev: null, z, gates: null, c: null, h, p: sigmoid(dot(m.wo, h) + m.bo) });
    } else {
      const zi = [], zf = [], zg = [], zo = [];
      const gi = [], gf = [], gg = [], go = [];
      const cn = [], hn = [];
      for (let j = 0; j < H; j++) {
        const fb = opts.fBiasDelta ? opts.fBiasDelta[j] : 0;
        zi.push(dot(m.Wx[j], x) + dot(m.Wh[j], h) + m.b[j]);
        zf.push(dot(m.Wx[H + j], x) + dot(m.Wh[H + j], h) + m.b[H + j] + fb);
        zg.push(dot(m.Wx[2 * H + j], x) + dot(m.Wh[2 * H + j], h) + m.b[2 * H + j]);
        zo.push(dot(m.Wx[3 * H + j], x) + dot(m.Wh[3 * H + j], h) + m.b[3 * H + j]);
        const i = opts.lockI != null ? opts.lockI : sigmoid(zi[j]);
        const f = opts.lockF != null ? opts.lockF : sigmoid(zf[j]);
        const g = Math.tanh(zg[j]);
        const o = sigmoid(zo[j]);
        gi.push(i); gf.push(f); gg.push(g); go.push(o);
        cn.push(f * c[j] + i * g);
        hn.push(o * Math.tanh(cn[j]));
      }
      c = cn;
      h = hn;
      steps.push({
        w, id, known: id !== 1, x, hPrev, cPrev,
        z: { i: zi, f: zf, g: zg, o: zo },
        gates: { i: gi, f: gf, g: gg, o: go },
        c, h,
        p: sigmoid(dot(m.wo, h) + m.bo),
      });
    }
  }
  return steps;
}

/** Ред в Wx/Wh за гейт и единица (LSTM). */
export const gateRow = (gate, j) => ({ i: 0, f: 1, g: 2, o: 3 })[gate] * H + j;

/** Най-близки думи по косинусово сходство, само сред първите K най-чести думи. */
export function nearest(word, K = 500, n = 6, cell = 'lstm') {
  const E = MODELS[cell].emb;
  const id = wordId(word);
  if (id === 1) return [];
  const v = E[id];
  const nv = Math.hypot(...v);
  const out = [];
  for (let k = 2; k < Math.min(K + 2, E.length); k++) {
    if (k === id) continue;
    const u = E[k];
    out.push({ w: VOCAB[k], s: dot(u, v) / (Math.hypot(...u) * nv) });
  }
  out.sort((a, b) => b.s - a.s);
  return out.slice(0, n);
}

/** Брой параметри (обединени bias-и, както в приложението). */
export const params = (x, h) => ({
  rnn: h * (h + x) + h,
  lstm: 4 * (h * (h + x) + h),
  gru: 3 * (h * (h + x) + h),
});

// ---------- Синтетична задача ----------
export const SYN_NS = [10, 20, 30, 50, 100];

/** Детерминиран генератор (mulberry32), за да се повтарят примерите. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Последователност: първи символ 0 (A) или 1 (B), после N символа от 2..9. */
export function makeSequence(N, rand) {
  const first = rand() < 0.5 ? 0 : 1;
  const seq = [first];
  for (let k = 0; k < N; k++) seq.push(2 + Math.floor(rand() * 8));
  return seq;
}

export const SYMBOLS = ['A', 'B', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

/** Пуска синтетичен модел; p = вероятност отговорът да е B. */
export function runSynthetic(cell, N, seq) {
  const m = SYNTH.models[`${cell}_${N}`];
  return run(cell, seq, {}, m);
}

export const synthAcc = (cell, N) => SYNTH.models[`${cell}_${N}`].acc;

/** Единицата на LSTM, която най-силно разделя A от B при дадено N (по c в края). */
export function memoryUnit(N) {
  const rand = rng(7);
  const sumA = zeros(H), sumB = zeros(H);
  let nA = 0, nB = 0;
  for (let t = 0; t < 40; t++) {
    const seq = makeSequence(N, rand);
    const last = runSynthetic('lstm', N, seq).at(-1).c;
    if (seq[0] === 0) { nA++; last.forEach((v, j) => (sumA[j] += v)); }
    else { nB++; last.forEach((v, j) => (sumB[j] += v)); }
  }
  let best = 0, bestD = -1;
  for (let j = 0; j < H; j++) {
    const d = Math.abs(sumA[j] / Math.max(nA, 1) - sumB[j] / Math.max(nB, 1));
    if (d > bestD) { bestD = d; best = j; }
  }
  return best;
}
