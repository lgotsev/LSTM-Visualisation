import React, { useMemo, useState } from 'react';
import { Bridge, COLORS, Card, GATE_NAMES, Intro, Segmented, StepControls, TINT, TaskCard, fp, fs, useArrowKeys, useStepper } from '../components/ui.jsx';
import { WordStrip } from '../components/WordStrip.jsx';
import { ScoreChart } from '../components/ScoreChart.jsx';
import { NeuronCard } from '../components/NeuronCard.jsx';
import { Heatmap } from '../components/Heatmap.jsx';
import { SentencePicker } from '../components/SentencePicker.jsx';
import { Conveyor, LstmCell } from '../components/Diagrams.jsx';
import { H, MODELS, gateRow, preact, run, tokenize } from '../model/forward.js';
import { MAIN, PRESETS } from '../model/sentences.js';

const fmtCell = (v, signed) => (signed ? fs(v) : fp(v));

function whatHappens(f, i) {
  if (f < 0.7 && i > 0.6) return 'забравя и записва ново';
  if (i > 0.5) return 'записва';
  if (f > 0.85 && i < 0.3) return 'държи паметта';
  return 'смесва старо и ново';
}

export default function Section3({ active }) {
  const [text, setText] = useState(MAIN);
  const [unit, setUnit] = useState(1); // единица 2 — централният пример
  const [gate, setGate] = useState('f');
  const [heat, setHeat] = useState('c');
  const [lockF, setLockF] = useState(null);
  const [lockI, setLockI] = useState(null);
  const [fDelta, setFDelta] = useState(() => new Array(H).fill(0));

  const words = useMemo(() => tokenize(text), [text]);
  const opts = { lockF, lockI, fBiasDelta: fDelta };
  const experimenting = lockF != null || lockI != null || fDelta.some((d) => d !== 0);
  const steps = useMemo(() => run('lstm', words, opts), [words, lockF, lockI, fDelta]); // eslint-disable-line react-hooks/exhaustive-deps
  const rnnSteps = useMemo(() => run('rnn', words), [words]);
  const st = useStepper(steps.length);
  useArrowKeys(st, active);
  const cur = steps[st.t];

  const m = MODELS.lstm;
  const row = gateRow(gate, unit);
  const pre = cur ? preact(m, row, cur.x, cur.hPrev) : null;
  const vals = cur && {
    cPrev: cur.cPrev[unit], c: cur.c[unit], hPrev: cur.hPrev[unit], h: cur.h[unit],
    f: cur.gates.f[unit], i: cur.gates.i[unit], g: cur.gates.g[unit], o: cur.gates.o[unit],
  };
  const trainedFBias = m.b[gateRow('f', unit)];
  const lockedVal = gate === 'f' ? lockF : gate === 'i' ? lockI : null;

  const heatValues = steps.map((s) => (heat === 'c' ? s.c : heat === 'h' ? s.h : s.gates[heat]));
  const resetExperiments = () => { setLockF(null); setLockI(null); setFDelta(new Array(H).fill(0)); };

  return (
    <>
      <Intro
        title="3. LSTM"
        lead="Как да помни дълго? Втора памет cₜ и три гейта, които решават какво да остане."
        formula={
          <div className="space-y-0.5">
            <div>fₜ = σ(W_f·[hₜ₋₁, xₜ] + b_f) &nbsp;&nbsp; iₜ = σ(W_i·[hₜ₋₁, xₜ] + b_i)</div>
            <div>gₜ = tanh(W_g·[hₜ₋₁, xₜ] + b_g) &nbsp;&nbsp; oₜ = σ(W_o·[hₜ₋₁, xₜ] + b_o)</div>
            <div className="font-bold">cₜ = fₜ ⊙ cₜ₋₁ + iₜ ⊙ gₜ &nbsp;&nbsp; hₜ = oₜ ⊙ tanh(cₜ)</div>
          </div>
        }
      >
        <p>
          LSTM (Long Short-Term Memory, Hochreiter & Schmidhuber, 1997) добавя втора памет — клетъчното състояние cₜ. То е като конвейерна лента:
          тече през всички стъпки и се променя само чрез умножение по число между 0 и 1 и добавяне. Три гейта решават какво да се случи на всяка
          стъпка: forget gate — колко от старата памет да остане, input gate — колко от новата информация да влезе, output gate — колко от паметта да
          се покаже навън. Всеки гейт е обикновен формален неврон със sigmoid. Когато forget gate е близо до 1, паметта — и градиентът — преминават
          през стъпката почти непроменени.
        </p>
      </Intro>

      <div className="sticky top-[52px] z-20 bg-indigo-50/95 backdrop-blur rounded-lg px-3 py-2 mb-4 shadow">
        <div className="flex items-center gap-3 flex-wrap">
          <StepControls stepper={st} n={steps.length} label={cur ? `„${cur.w}“` : ''} />
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-sm text-gray-700">Единица:</span>
          <Segmented value={unit} onChange={setUnit} options={[0, 1, 2, 3].map((j) => ({ value: j, label: String(j + 1) }))} size="sm" />
          {experimenting && (
            <span className="text-sm text-amber-800 bg-amber-100 rounded px-2 py-0.5">Експеримент: теглата са променени —
              <button onClick={resetExperiments} className="underline ml-1">върни обучените</button>
            </span>
          )}
        </div>
      </div>

      <Card title="Конвейерната лента: само cₜ на избраната единица">
        {cur && (
          <Conveyor
            words={words}
            cs={steps.map((s) => s.c[unit])}
            fs={steps.map((s) => s.gates.f[unit])}
            adds={steps.map((s) => s.gates.i[unit] * s.gates.g[unit])}
            t={st.t}
            fmt={fmtCell}
          />
        )}
        <p className="text-[15px] text-gray-700 mt-1">
          На всяка стъпка паметта само се умножава по f и към нея се добавя i·g. В RNN, обратно, h минава през пълна матрица и tanh на всяка стъпка.
        </p>
      </Card>

      <Card title="Схема на клетката">
        <div className="grid lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2 min-w-0">
            <LstmCell active={gate} onPick={setGate} vals={vals} fmt={fmtCell} />
            <div className="flex gap-2 flex-wrap mt-1">
              {['f', 'i', 'g', 'o'].map((k) => (
                <button key={k} onClick={() => setGate(k)} className={`text-sm px-2 py-1 rounded border ${gate === k ? TINT[k] + ' font-semibold' : 'bg-white border-gray-200'}`}>
                  {GATE_NAMES[k]}
                </button>
              ))}
            </div>
          </div>
          <div className="min-w-0">
            {pre && (
              <NeuronCard
                kind={gate}
                title={`${gate}[${unit + 1}] = ${gate === 'g' ? 'tanh' : 'σ'}(Σ W·[hₜ₋₁, xₜ] + b)`}
                pre={pre}
                act={gate === 'g' ? 'tanh' : 'sigmoid'}
                out={vals[gate]}
                extraBias={gate === 'f' ? fDelta[unit] : 0}
                locked={lockedVal}
              />
            )}
            {vals && (
              <div className={`mt-2 rounded border p-2 font-mono text-[14px] ${TINT.c}`}>
                cₜ = f·cₜ₋₁ + i·g = <span className="num" data-num="">{fp(vals.f)}</span>·<span className="num" data-num="">{fs(vals.cPrev)}</span> + <span className="num" data-num="">{fp(vals.i)}</span>·<span className="num" data-num="">{fs(vals.g)}</span> = <b className="num" data-num="">{fs(vals.c)}</b>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card title="Разходка по изречението">
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="min-w-0">
            <h4 className="font-semibold mb-2">Изречение</h4>
            <WordStrip steps={steps} t={st.t} onPick={st.setT} />
            <div className="mt-3"><SentencePicker value={text} onChange={(v) => { setText(v); st.reset(); }} presets={PRESETS} /></div>
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold mb-2">Единица {unit + 1} при „{cur?.w}“</h4>
            {vals && (
              <table className="text-[15px] w-full">
                <tbody>
                  {[
                    ['f', 'forget', vals.f, false], ['i', 'input', vals.i, false], ['g', 'кандидат', vals.g, true],
                    ['o', 'output', vals.o, false], ['c', 'памет cₜ', vals.c, true], ['h', 'изход hₜ', vals.h, true],
                  ].map(([k, name, v, signed]) => (
                    <tr key={k} className="border-b last:border-0">
                      <td className="py-1 pr-2"><span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ background: COLORS[k].hex }} />{name}</td>
                      <td className="py-1 text-right num font-semibold" data-num="">{signed ? fs(v) : fp(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {vals && <p className="mt-2 text-indigo-900 bg-indigo-50 rounded px-2 py-1">Какво става: <b>{whatHappens(vals.f, vals.i)}</b></p>}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold mb-2">Оценка: LSTM{experimenting ? ' (експеримент)' : ''} и RNN</h4>
            <ScoreChart series={[{ key: 'rnn', steps: rnnSteps }, { key: 'lstm', steps }]} t={st.t} words={words} />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h4 className="font-semibold">Топлинна карта: 4 единици × {words.length} думи</h4>
            <Segmented
              value={heat}
              onChange={setHeat}
              size="sm"
              options={['f', 'i', 'g', 'o', 'c', 'h'].map((k) => ({ value: k, label: COLORS[k].label }))}
            />
          </div>
          <Heatmap
            words={words}
            values={heatValues}
            kind={heat}
            t={st.t}
            unit={unit}
            onPickUnit={setUnit}
            onPickStep={st.setT}
            signed={['g', 'c', 'h'].includes(heat)}
          />
        </div>
      </Card>

      <Card title="Експерименти на живо">
        <div className="grid lg:grid-cols-3 gap-5">
          <div>
            <p className="font-semibold mb-1" style={{ color: COLORS.f.hex }}>Заключи forget gate</p>
            <Segmented value={lockF} onChange={setLockF} options={[{ value: null, label: 'обучен' }, { value: 0, label: '0' }, { value: 1, label: '1' }]} />
            <p className="text-sm text-gray-600 mt-1">При 0 мрежата помни само текущата дума; при 1 не може да забрави.</p>
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: COLORS.i.hex }}>Заключи input gate</p>
            <Segmented value={lockI} onChange={setLockI} options={[{ value: null, label: 'обучен' }, { value: 0, label: '0' }]} />
            <p className="text-sm text-gray-600 mt-1">При 0 нищо ново не влиза в паметта.</p>
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: COLORS.f.hex }}>Bias на forget gate, единица {unit + 1}</p>
            <input
              type="range" min="-3" max="5" step="0.1"
              value={trainedFBias + fDelta[unit]}
              onChange={(e) => { const d = [...fDelta]; d[unit] = Number(e.target.value) - trainedFBias; setFDelta(d); }}
              className="w-full"
            />
            <p className="text-sm text-gray-700">
              сега <span className="num font-semibold" data-num="">{fs(trainedFBias + fDelta[unit])}</span> · обучен <span className="num" data-num="">{fs(trainedFBias)}</span>
            </p>
          </div>
        </div>
        <button onClick={resetExperiments} className="mt-3 px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300">Върни обучените тегла</button>
      </Card>

      <Card title="Защо работи">
        <p className="text-[16px]">
          Спомнете си графиката от секция 2: линията на LSTM не пада до нула. Причината е лентата — по нея градиентът назад се умножава по f ≈ 0.9, а не по
          пълна матрица и tanh′. Когато мрежата иска да помни, тя държи f близо до 1; когато иска да забрави, спуска f — както единица 2 при „waste“.
        </p>
      </Card>

      <TaskCard n={2} title="Проследете LSTM" answer="„great“: f 0.92, c +0.40 — записва; „but“: f 0.93, c +0.48 — държи; „waste“: f 0.56, c −0.43 — забравя и записва обратното.">
        За единица 2 запишете fₜ и cₜ при „great“, „but“ и „waste“. Какво прави единицата на всяка от тези думи?
      </TaskCard>
      <TaskCard n={3} title="Заключен forget gate = 0" answer="cₜ = iₜ·gₜ: паметта се нулира на всяка стъпка, затова оценката следва само текущата дума (0.04 при „waste“, 0.52 при „of“).">
        Какво става с cₜ? Защо оценката следва само последната дума?
      </TaskCard>
      <TaskCard n={4} title="Заключен forget gate = 1" answer="Старата памет остава изцяло: при „waste“ оценката е 0.52 вместо 0.13. Обучената мрежа спуска f на 0.56 точно там, за да забрави „great“.">
        Може ли мрежата да „премисли“ след „waste“? Сравнете с обучените стойности.
      </TaskCard>
      <TaskCard n={5} title="Ловец на грешки" answer="Отворен отговор. Примери: „this movie was not bad“ (0.06 — мрежата не е научила „not bad“); непознати думи (с „?“); ирония; дълги изречения.">
        Намерете изречение, което LSTM оценява грешно (полето „Собствено изречение“ по-горе), и обяснете защо.
      </TaskCard>

      <Bridge>На упражнението ще проверите сами дали LSTM наистина помни по-далеч — и ще търсите изречения, които я объркват.</Bridge>
    </>
  );
}
