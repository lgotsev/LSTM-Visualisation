import React, { useMemo, useState } from 'react';
import { Bridge, COLORS, Card, Intro, fp } from '../components/ui.jsx';
import { LineChart } from '../components/LineChart.jsx';
import { run } from '../model/forward.js';
import { INFLUENCE, filler } from '../model/sentences.js';

const SUP = { '-': '\u207b', 0: '\u2070', 1: '\u00b9', 2: '\u00b2', 3: '\u00b3', 4: '\u2074', 5: '\u2075', 6: '\u2076', 7: '\u2077', 8: '\u2078', 9: '\u2079' };
const sup = (n) => String(n).split('').map((ch) => SUP[ch]).join('');
const sci = (v) => {
  if (v === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(v)));
  if (e >= -3 && e <= 3) return v.toFixed(Math.max(0, 3 - e));
  const m = v / 10 ** e;
  return `${m.toFixed(2)} × 10${sup(e)}`;
};

function Multiplier() {
  const [m, setM] = useState(0.9);
  const [T, setT] = useState(50);
  const pts = Array.from({ length: 101 }, (_, k) => ({ x: k, y: m ** k }));
  const v = m ** T;
  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="space-y-4">
        <div>
          <label className="block text-[15px] mb-1">Множител wₕ·γ: <span className="num font-semibold" data-num="">{m.toFixed(2)}</span></label>
          <input type="range" min="0.5" max="1.5" step="0.01" value={m} onChange={(e) => setM(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <label className="block text-[15px] mb-1">Стъпки назад T: <span className="num font-semibold" data-num="">{T}</span></label>
          <input type="range" min="1" max="100" step="1" value={T} onChange={(e) => setT(Number(e.target.value))} className="w-full" />
        </div>
        <div className={`rounded p-3 font-mono text-[16px] ${m < 1 ? 'bg-sky-50 text-sky-900' : m > 1 ? 'bg-red-50 text-red-900' : 'bg-gray-50'}`}>
          ({m.toFixed(2)})<sup>{T}</sup> = <b>{sci(v)}</b>
          <div className="text-sm font-sans mt-1">{m < 1 ? 'Градиентът затихва.' : m > 1 ? 'Градиентът експлодира.' : 'Граничният случай.'}</div>
        </div>
        <p className="text-sm text-gray-600">Примери: 0.9⁵⁰ ≈ 0.005; 1.1⁵⁰ ≈ 117.</p>
        <div className="flex gap-2">
          {[0.9, 1.0, 1.1].map((q) => (
            <button key={q} onClick={() => { setM(q); setT(50); }} className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-sm num">{q.toFixed(1)}⁵⁰</button>
          ))}
        </div>
      </div>
      <div className="lg:col-span-2">
        <LineChart
          title="Големина на градиента след T стъпки назад (логаритмична скала)"
          series={[{ key: 'g', color: '#4f46e5', points: pts, width: 3 }]}
          x={{ min: 0, max: 100, ticks: [0, 20, 40, 60, 80, 100], title: 'стъпки назад T' }}
          y={{ min: 1e-12, max: 1e12, log: true, ticks: [1e-12, 1e-6, 1, 1e6, 1e12], fmt: (t) => (t === 1 ? '1' : `10${sup(Math.round(Math.log10(t)))}`) }}
          bands={[
            { from: 1e-12, to: 1, color: '#0ea5e9', label: 'затихва', text: '#0369a1' },
            { from: 1, to: 1e12, color: '#ef4444', label: 'експлодира', text: '#b91c1c' },
          ]}
          refY={[1]}
          marker={T}
        />
      </div>
    </div>
  );
}

function Influence() {
  const pts = (k) => INFLUENCE.d.map((d, i) => ({ x: d, y: INFLUENCE[k][i] }));
  return (
    <>
      <LineChart
        title="Сто думи назад RNN практически не усеща думата, LSTM я усеща с 22%"
        series={[
          { key: 'rnn', label: 'RNN', color: COLORS.rnn.hex, points: pts('rnn'), dots: true },
          { key: 'lstm', label: 'LSTM', color: COLORS.lstm.hex, points: pts('lstm'), dots: true, width: 3 },
        ]}
        x={{ min: 0, max: 150, ticks: [0, 25, 50, 75, 100, 125, 150], title: 'разстояние до края на ревюто, думи' }}
        y={{ min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1], fmt: (t) => `${Math.round(t * 100)}%` }}
        marker={100}
      />
      <p className="text-sm text-gray-600">
        Средна големина на градиента спрямо думата на d думи от края; 400 тестови ревюта по 200 думи; последната дума = 100%. При d = 100: RNN 0.1%, LSTM 21.9%.
      </p>
    </>
  );
}

function FillerExperiment() {
  const [n, setN] = useState(50);
  const curve = useMemo(() => {
    const out = { rnn: [], lstm: [] };
    for (let k = 0; k <= 150; k += 5) {
      for (const cell of ['rnn', 'lstm']) {
        const pos = run(cell, ['the', 'movie', 'was', 'wonderful', ...filler(k)]).at(-1).p;
        const neg = run(cell, ['the', 'movie', 'was', 'terrible', ...filler(k)]).at(-1).p;
        out[cell].push({ x: k, y: pos - neg, pos, neg });
      }
    }
    return out;
  }, []);
  const at = (cell) => curve[cell][n / 5];
  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="space-y-3">
        <p className="text-[15px]">
          <i>the movie was <b className="text-green-700">wonderful</b> …</i> срещу <i>the movie was <b className="text-red-700">terrible</b> …</i>, следвани от неутрални думи.
        </p>
        <label className="block text-[15px]">Неутрални думи след ключовата: <span className="num font-semibold" data-num="">{n}</span></label>
        <input type="range" min="0" max="150" step="5" value={n} onChange={(e) => setN(Number(e.target.value))} className="w-full" />
        <p className="text-xs text-gray-500 break-words">Пълнеж: „{filler(Math.min(n, 12)).join(' ')}{n > 12 ? ' …' : ''}“</p>
        {['rnn', 'lstm'].map((cell) => (
          <div key={cell} className="rounded border p-2">
            <p className="font-semibold" style={{ color: COLORS[cell].hex === '#94a3b8' ? '#475569' : COLORS[cell].hex }}>{cell.toUpperCase()}</p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span>wonderful: <span className="num" data-num="">{fp(at(cell).pos)}</span></span>
              <span>terrible: <span className="num" data-num="">{fp(at(cell).neg)}</span></span>
              <span className="font-semibold">разлика: <span className="num" data-num="">{fp(at(cell).y)}</span></span>
            </div>
          </div>
        ))}
      </div>
      <div className="lg:col-span-2">
        <LineChart
          title="Колко моделът още помни ключовата дума (разлика в оценката)"
          series={[
            { key: 'rnn', label: 'RNN', color: COLORS.rnn.hex, points: curve.rnn },
            { key: 'lstm', label: 'LSTM', color: COLORS.lstm.hex, points: curve.lstm, width: 3 },
          ]}
          x={{ min: 0, max: 150, ticks: [0, 25, 50, 75, 100, 125, 150], title: 'неутрални думи след ключовата' }}
          y={{ min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1], fmt: (t) => t.toFixed(2) }}
          marker={n}
        />
      </div>
    </div>
  );
}

export default function Section2() {
  return (
    <>
      <Intro
        title="2. Затихващ градиент"
        lead="Защо обикновената RNN не се научава да помни далеч?"
        formula={<>∂h_T/∂h₀ = Π wₕ·tanh′(zₜ) ≈ (wₕ·γ)<sup>T</sup></>}
      >
        <p>
          Мрежата се обучава, като грешката се връща назад във времето, стъпка по стъпка (backpropagation through time). На всяка стъпка назад
          градиентът се умножава по приблизително едно и също число. Ако то е под 1, след няколко десетки стъпки градиентът практически изчезва; ако е
          над 1, експлодира. Затова RNN трудно се учи да свързва дума от началото на текста с отговора накрая: сигналът, който трябва да ѝ го покаже,
          не стига до нея.
        </p>
      </Intro>
      <Card title="Умножаваме по едно и също число"><Multiplier /></Card>
      <Card title="Реалното влияние на думите в нашите модели"><Influence /></Card>
      <Card title="„Wonderful“ или „terrible“ плюс неутрален пълнеж"><FillerExperiment /></Card>
      <Bridge>Ако умноженията убиват сигнала — да дадем на паметта път, по който тя тече със събиране.</Bridge>
    </>
  );
}
