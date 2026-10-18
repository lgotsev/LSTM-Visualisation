import React, { useMemo, useState } from 'react';
import { Bridge, Card, Intro, Segmented, StepControls, TaskCard, VectorStrip, useArrowKeys, useStepper } from '../components/ui.jsx';
import { WordStrip } from '../components/WordStrip.jsx';
import { ScoreChart } from '../components/ScoreChart.jsx';
import { NeuronCard } from '../components/NeuronCard.jsx';
import { SentencePicker } from '../components/SentencePicker.jsx';
import { ChainVsTree, RnnFoldDiagram } from '../components/Diagrams.jsx';
import { MODELS, VOCAB, isKnown, nearest, preact, run, tokenize, wordId } from '../model/forward.js';
import { MAIN, PRESETS } from '../model/sentences.js';

function EmbeddingExplorer() {
  const [word, setWord] = useState('waste');
  const [pair, setPair] = useState(['great', 'terrible']);
  const w = tokenize(word)[0] || '';
  const known = w && isKnown(w);
  const vec = known ? MODELS.lstm.emb[wordId(w)] : null;
  const near = known ? nearest(w) : [];
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <div>
        <ol className="list-decimal ml-5 space-y-1 text-[16px] text-gray-800 mb-3">
          <li>Речникът номерира думите: 5 000 най-чести думи в ревютата.</li>
          <li>Номерът сам не носи смисъл — дума №5 не е „по-голяма“ от дума №3.</li>
          <li>Затова всяка дума получава <b>вектор от 8 числа</b>, който мрежата настройва при обучението.</li>
        </ol>
        <label className="text-sm text-gray-600">Дума:</label>
        <input value={word} onChange={(e) => setWord(e.target.value)} className="ml-2 px-2 py-1 border rounded w-44 text-[15px]" />
        {w && !known && <p className="text-amber-700 text-sm mt-2">„{w}“ я няма в речника — мрежата я вижда като &lt;unk&gt; (номер 1).</p>}
        {known && (
          <div className="mt-3 space-y-2">
            <p className="text-[15px]">„<b>{w}</b>“ → номер <span className="num font-semibold" data-num="">{wordId(w)}</span> → вектор:</p>
            <VectorStrip values={vec} kind="x" />
            <p className="text-sm text-gray-700 mt-2">
              Най-близки думи (косинусово сходство, сред 500-те най-чести):{' '}
              {near.map((n) => (
                <button key={n.w} onClick={() => setWord(n.w)} className="mr-1.5 mb-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200">
                  {n.w} <span className="num text-gray-500">{n.s.toFixed(2)}</span>
                </button>
              ))}
            </p>
            <p className="text-xs text-gray-500">8 числа са малко и мрежата е научила само това, което ѝ трябва за задачата — тона, не значението. Затова съседите понякога са изненадващи.</p>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-2">Две думи една до друга:</p>
        {pair.map((p, k) => {
          const id = wordId(p);
          return (
            <div key={k} className="mb-3">
              <input
                value={p}
                onChange={(e) => setPair(k === 0 ? [e.target.value.toLowerCase(), pair[1]] : [pair[0], e.target.value.toLowerCase()])}
                className="px-2 py-1 border rounded w-40 text-[15px] mb-1"
              />
              {id !== 1 ? <VectorStrip values={MODELS.lstm.emb[id]} kind="x" /> : <p className="text-sm text-amber-700">няма я в речника</p>}
            </div>
          );
        })}
        <p className="text-[15px] text-indigo-900 bg-indigo-50 rounded p-2">Векторите не са зададени от човек — научени са заедно с останалите тегла.</p>
        <p className="text-xs text-gray-500 mt-2">Речник: {VOCAB.length - 2} думи + &lt;pad&gt; и &lt;unk&gt;.</p>
      </div>
    </div>
  );
}

export default function Section1({ active }) {
  const [text, setText] = useState(MAIN);
  const [unit, setUnit] = useState(0);
  const [unfolded, setUnfolded] = useState(true);
  const words = useMemo(() => tokenize(text), [text]);
  const steps = useMemo(() => run('rnn', words), [words]);
  const st = useStepper(steps.length);
  useArrowKeys(st, active);
  const cur = steps[st.t];
  const pre = cur ? preact(MODELS.rnn, unit, cur.x, cur.hPrev) : null;

  return (
    <>
      <Intro
        title="1. Рекурентни невронни мрежи"
        lead="Как мрежа да помни? Рекурентната мрежа чете дума по дума и носи памет hₜ."
        formula={<>hₜ = tanh(Wₓ·xₜ + Wₕ·hₜ₋₁ + b) &nbsp;&nbsp;&nbsp; p = σ(wₒ·h_T + bₒ)</>}
      >
        <p>
          Многослойният перцептрон получава вход с фиксиран размер и го обработва наведнъж. Текстът обаче е последователност: думите идват една
          след друга, броят им варира, а смисълът зависи от реда. Рекурентната мрежа (RNN) добавя памет: на всяка стъпка t тя чете една дума xₜ и
          обновява скритото си състояние hₜ от новата дума и от предишното състояние hₜ₋₁. Едни и същи тегла се прилагат на всяка стъпка, затова
          мрежата чете текст с произволна дължина. Последното състояние обобщава целия текст и от него се прави прогнозата.
        </p>
      </Intro>

      <Card title="MLP срещу RNN">
        <div className="hscroll">
          <table className="w-full text-[16px] min-w-[640px]">
            <thead>
              <tr className="text-left text-indigo-800 border-b">
                <th className="py-1.5 pr-4 font-semibold"></th>
                <th className="py-1.5 pr-4 font-semibold">MLP</th>
                <th className="py-1.5 font-semibold">RNN</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Вход', 'фиксиран вектор, наведнъж', 'последователност, по един елемент'],
                ['Дължина', 'една и съща', 'произволна'],
                ['Памет', 'няма', 'скрито състояние hₜ'],
                ['Тегла', 'свои за всеки слой', 'едни и същи на всяка стъпка'],
                ['Редът на елементите', 'не се вижда', 'е част от изчислението'],
              ].map((r) => (
                <tr key={r[0]} className="border-b last:border-0">
                  <td className="py-1.5 pr-4 font-medium text-gray-700">{r[0]}</td>
                  <td className="py-1.5 pr-4">{r[1]}</td>
                  <td className="py-1.5 text-indigo-900">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Дума → индекс → вектор (embedding)">
        <EmbeddingExplorer />
      </Card>

      <Card
        title="Сгъната и разгъната RNN"
        right={<Segmented value={unfolded} onChange={setUnfolded} options={[{ value: false, label: 'Сгъната' }, { value: true, label: 'Разгъната' }]} size="sm" />}
      >
        <RnnFoldDiagram unfolded={unfolded} words={tokenize(MAIN)} />
      </Card>

      <Card title="Клетката на RNN, дума по дума">
        <div className="mb-3"><StepControls stepper={st} n={steps.length} label={cur ? `„${cur.w}“` : ''} /></div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="min-w-0">
            <h4 className="font-semibold mb-2">Изречение</h4>
            <WordStrip steps={steps} t={st.t} onPick={st.setT} />
            <div className="mt-3"><SentencePicker value={text} onChange={(v) => { setText(v); st.reset(); }} presets={PRESETS} /></div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-2 gap-2">
              <h4 className="font-semibold">Единица на hₜ</h4>
              <Segmented value={unit} onChange={setUnit} options={[0, 1, 2, 3].map((j) => ({ value: j, label: String(j + 1) }))} size="sm" />
            </div>
            {pre && <NeuronCard kind="h" title={`h[${unit + 1}] = tanh(Σ Wₓ·xₜ + Σ Wₕ·hₜ₋₁ + b)`} pre={pre} act="tanh" out={cur.h[unit]} />}
            {cur && <div className="mt-2"><VectorStrip values={cur.h} kind="h" label="hₜ" highlight={unit} onPick={setUnit} /></div>}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold mb-2">Оценка след всяка дума</h4>
            <ScoreChart series={[{ key: 'rnn', steps }]} t={st.t} words={words} />
          </div>
        </div>
      </Card>

      <Card title="Рекурентна или рекурсивна?">
        <ChainVsTree />
        <p className="mt-2 text-[16px] text-gray-800">Рекурсивните мрежи изискват дървото наготово (синтактичен анализ), затова днес са рядко в употреба. LSTM е рекурентна мрежа.</p>
      </Card>

      <TaskCard n={1} title="Проследете RNN" answer="При „waste“: оценката пада от 0.77 на 0.08.">
        Минете стъпка по стъпка през централното изречение до „waste“. При коя дума оценката пада най-рязко и колко?
      </TaskCard>

      <Bridge>RNN вижда началото на изречението само чрез h. Колко далеч стига тази памет?</Bridge>
    </>
  );
}
