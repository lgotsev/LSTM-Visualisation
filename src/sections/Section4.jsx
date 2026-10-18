import React, { useMemo, useState } from 'react';
import { ExternalLink, Shuffle } from 'lucide-react';
import { COLORS, Card, Intro, Segmented, TaskCard, fp, fs } from '../components/ui.jsx';
import { LineChart } from '../components/LineChart.jsx';
import { WordStrip } from '../components/WordStrip.jsx';
import { ScoreChart } from '../components/ScoreChart.jsx';
import { SentencePicker } from '../components/SentencePicker.jsx';
import { SYMBOLS, SYN_NS, makeSequence, memoryUnit, params, rng, run, runSynthetic, synthAcc, tokenize } from '../model/forward.js';
import { FORMS_URL, WEAK } from '../model/sentences.js';

function Synthetic() {
  const [N, setN] = useState(30);
  const [seed, setSeed] = useState(1);
  const seq = useMemo(() => makeSequence(N, rng(seed * 1000 + N)), [N, seed]);
  const flipped = useMemo(() => [1 - seq[0], ...seq.slice(1)], [seq]);
  const unit = useMemo(() => memoryUnit(N), [N]);
  const res = (cell) => runSynthetic(cell, N, seq).at(-1).p;
  const cA = runSynthetic('lstm', N, seq[0] === 0 ? seq : flipped).map((s, k) => ({ x: k, y: s.c[unit] }));
  const cB = runSynthetic('lstm', N, seq[0] === 1 ? seq : flipped).map((s, k) => ({ x: k, y: s.c[unit] }));
  const all = [...cA, ...cB].map((p) => p.y);
  const lo = Math.min(...all, 0), hi = Math.max(...all, 0);
  const pad = (hi - lo) * 0.08 || 1;
  const yt = [lo, 0, hi].map((v) => Number(v.toFixed(1)));
  const truth = SYMBOLS[seq[0]];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[15px]">Разстояние N:</span>
        <Segmented value={N} onChange={setN} options={SYN_NS.map((n) => ({ value: n, label: String(n) }))} />
        <button onClick={() => setSeed(seed + 1)} className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5">
          <Shuffle size={16} /> Нова последователност
        </button>
      </div>
      <div className="hscroll border rounded p-2">
        <div className="flex gap-1 min-w-max" data-heavy="">
          {seq.map((s, k) => (
            <span
              key={k}
              className={`num w-7 h-8 shrink-0 flex items-center justify-center rounded text-[14px] ${k === 0 ? 'bg-amber-400 text-amber-950 font-bold' : 'bg-gray-100 text-gray-500'}`}
            >
              {SYMBOLS[s]}
            </span>
          ))}
        </div>
      </div>
      <p className="text-sm text-gray-600">Първият символ ({truth}) е отговорът; следват {N} случайни символа, които не помагат.</p>
      <div className="grid lg:grid-cols-3 gap-4">
        {['rnn', 'lstm'].map((cell) => {
          const p = res(cell);
          const ans = p > 0.5 ? 'B' : 'A';
          const ok = ans === truth;
          const acc = synthAcc(cell, N);
          return (
            <div key={cell} className="rounded-lg border p-3">
              <p className="font-semibold text-lg" style={{ color: cell === 'rnn' ? '#475569' : COLORS.lstm.hex }}>{cell.toUpperCase()}-4</p>
              <p className="text-[15px]">
                Отговор: <b>{ans}</b> <span className="num text-gray-500">(p(B) = {fp(p)})</span>{' '}
                {Math.abs(p - 0.5) < 0.05 ? (
                  <span className="text-amber-700">не знае — гадае</span>
                ) : (
                  <span className={ok ? 'text-green-700' : 'text-red-700'}>{ok ? '✓ вярно' : '✗ грешно'}</span>
                )}
              </p>
              <p className="text-[15px] mt-2">Точност върху 2 000 примера:</p>
              <div className="h-5 bg-gray-100 rounded overflow-hidden mt-1">
                <div className="h-full" style={{ width: `${acc * 100}%`, background: acc > 0.9 ? '#22c55e' : '#f59e0b' }} />
              </div>
              <p className="num text-right text-sm mt-0.5">{(acc * 100).toFixed(1)}%{acc < 0.6 ? ' — колкото хвърляне на монета' : ''}</p>
            </div>
          );
        })}
        <div className="rounded-lg border p-3 text-[15px] text-gray-700">
          <p className="font-semibold text-gray-900 mb-1">Защо LSTM успява</p>
          LSTM се обучава с bias на forget gate = 3 (f ≈ 0.95): по подразбиране лентата <i>не</i> забравя. Със стандартния bias 1 (f ≈ 0.73) и LSTM се
          проваля още при N = 50.
        </div>
      </div>
      <LineChart
        title={`Паметта на LSTM: cₜ на единица ${unit + 1} за последователност с A и със B`}
        series={[
          { key: 'A', label: 'A', color: '#f59e0b', points: cA, width: 3 },
          { key: 'B', label: 'B', color: '#4f46e5', points: cB, width: 3 },
        ]}
        x={{ min: 0, max: N, ticks: [0, Math.round(N / 4), Math.round(N / 2), Math.round((3 * N) / 4), N], title: 'стъпка' }}
        y={{ min: lo - pad, max: hi + pad, ticks: [...new Set(yt)], fmt: (v) => fs(v, 1) }}
        refY={[0]}
        height={240}
      />
      <p className="text-sm text-gray-600">Двете линии се разделят още на първата стъпка и не се срещат до края — паметта пренася отговора през всички {N} стъпки.</p>
    </div>
  );
}

function OwnSentence() {
  const [text, setText] = useState(WEAK[0]);
  const words = useMemo(() => tokenize(text), [text]);
  const lstm = useMemo(() => run('lstm', words), [words]);
  const rnn = useMemo(() => run('rnn', words), [words]);
  const t = words.length - 1;
  const verdict = (p) => (p > 0.5 ? <span className="text-green-700">положително</span> : <span className="text-red-700">отрицателно</span>);
  return (
    <div className="space-y-3">
      <SentencePicker value={text} onChange={setText} presets={WEAK.map((w) => ({ text: w, note: 'слаб случай' }))} />
      {words.length > 0 && (
        <>
          <WordStrip steps={lstm} t={t} />
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 min-w-0">
              <ScoreChart series={[{ key: 'rnn', steps: rnn }, { key: 'lstm', steps: lstm }]} t={t} words={words} />
            </div>
            <div className="text-[15px] space-y-1">
              <p>LSTM: <span className="num font-semibold" data-num="">{fp(lstm.at(-1).p)}</span> — {verdict(lstm.at(-1).p)}</p>
              <p>RNN: <span className="num font-semibold" data-num="">{fp(rnn.at(-1).p)}</span> — {verdict(rnn.at(-1).p)}</p>
              <p className="text-sm text-gray-600 mt-2">Моделите са малки (4 единици) и грешат. Думи със „?“ ги няма в речника.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ParamCalc() {
  const [x, setX] = useState(8);
  const [h, setH] = useState(4);
  const [show, setShow] = useState(false);
  const p = params(x, h);
  const one = h * (h + x) + h;
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="space-y-3">
        <div>
          <label className="block text-[15px]">Размер на входа x: <span className="num font-semibold" data-num="">{x}</span></label>
          <input type="range" min="1" max="300" value={x} onChange={(e) => setX(Number(e.target.value))} className="w-full" />
        </div>
        <div>
          <label className="block text-[15px]">Скрити единици h: <span className="num font-semibold" data-num="">{h}</span></label>
          <input type="range" min="1" max="256" value={h} onChange={(e) => setH(Number(e.target.value))} className="w-full" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setX(8); setH(4); }} className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-sm">нашите: x = 8, h = 4</button>
          <button onClick={() => { setX(100); setH(64); }} className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-sm">x = 100, h = 64</button>
        </div>
        <p className="text-sm text-gray-600">Сметнете първо на ръка, после натиснете „Покажи“.</p>
        <button onClick={() => setShow(!show)} className="px-3 py-1.5 rounded bg-yellow-200 hover:bg-yellow-300">{show ? 'Скрий' : 'Покажи'}</button>
      </div>
      <div className="font-mono text-[15px] space-y-2">
        <div className="bg-slate-50 rounded p-3">
          RNN: h·(h + x) + h = {h}·{h + x} + {h} = <b className="num" data-num="">{show ? p.rnn.toLocaleString('en-US') : '?'}</b>
        </div>
        <div className="bg-indigo-50 rounded p-3">
          LSTM: 4·[h·(h + x) + h] = 4·{show ? one.toLocaleString('en-US') : '?'} = <b className="num" data-num="">{show ? p.lstm.toLocaleString('en-US') : '?'}</b>
        </div>
        <div className="bg-teal-50 rounded p-3">
          GRU: 3·[h·(h + x) + h] = <b className="num" data-num="">{show ? p.gru.toLocaleString('en-US') : '?'}</b>
        </div>
        <p className="font-sans text-sm text-gray-600">
          Плюс изходен неврон (h + 1) и embedding (5 002 × 8 = 40 016). PyTorch пази два bias вектора на гейт, затова отчита 229 и 61 вместо 208 и 52.
        </p>
      </div>
    </div>
  );
}

export default function Section4() {
  return (
    <>
      <Intro title="4. Сравнение" lead="Работи ли наистина? Упражнение: проверете сами.">
        <p>
          С еднакъв бюджет на обучение RNN се научава да помни до около 20 стъпки, а LSTM — и до 100. Проверете го на задача, в която единственият начин
          да се отговори е да се помни, после потърсете изречения, които объркват мрежите.
        </p>
      </Intro>
      <Card title="4.1 „Запомни първия символ“"><Synthetic /></Card>
      <Card title="4.2 Собствени изречения"><OwnSentence /></Card>
      <Card title="4.3 Брой параметри"><ParamCalc /></Card>
      <Card title="4.4 GRU — по-проста роднина">
        <p className="text-[16px]">
          GRU (Cho и др., 2014) слива forget и input gate в един <b>update gate</b> и няма отделно cₜ — паметта е самото hₜ. Има три блока вместо четири:
          при x = 8, h = 4 това са 3 · 52 = 156 параметъра срещу 208 за LSTM. На практика двете често се представят сходно.
        </p>
      </Card>

      <TaskCard n={6} title="Къде е границата?" answer="Около 20: при N = 20 RNN е 100%, при N = 30 — 51%. 50% = случайно угадване при два класа.">
        В 4.1 намерете най-голямото N, при което RNN още се справя. Защо при по-голямо N точността е около 50%?
      </TaskCard>
      <TaskCard
        n={7}
        title="Затихване или забравяне?"
        answer="Затихващият градиент е проблем на обучението, не на паметта: способността да пазиш не е същото като да се научиш да пазиш."
      >
        При нашите опити RNN с 8 единици помнеше „wonderful“ и след 150 думи (на IMDB), а в 4.1 RNN-4 не може да се научи дори на N = 30. Как е възможно?
      </TaskCard>
      <TaskCard n={8} title="Брой параметри на ръка" answer="x = 8, h = 4: 52 и 208. x = 100, h = 64: 10 560 и 42 240. LSTM е винаги 4 пъти по-голяма.">
        Сметнете за RNN и LSTM при x = 8, h = 4, после при x = 100, h = 64. Колко пъти е по-голяма LSTM?
      </TaskCard>
      <TaskCard n={9} title="Самопроверка">
        {FORMS_URL ? (
          <a href={FORMS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700">
            Отвори въпросите <ExternalLink size={16} />
          </a>
        ) : (
          <span className="text-gray-600">10 въпроса в Google Forms — линкът ще бъде добавен от преподавателя.</span>
        )}
      </TaskCard>
    </>
  );
}
