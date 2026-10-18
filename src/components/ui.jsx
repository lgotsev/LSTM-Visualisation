import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Eye, EyeOff } from 'lucide-react';

// ---------- Визуален речник: един цвят за едно понятие ----------
export const COLORS = {
  x: { hex: '#64748b', name: 'slate', label: 'xₜ' },
  h: { hex: '#6366f1', name: 'indigo', label: 'hₜ' },
  c: { hex: '#f59e0b', name: 'amber', label: 'cₜ' },
  f: { hex: '#f43f5e', name: 'rose', label: 'fₜ' },
  i: { hex: '#10b981', name: 'emerald', label: 'iₜ' },
  g: { hex: '#14b8a6', name: 'teal', label: 'gₜ' },
  o: { hex: '#8b5cf6', name: 'violet', label: 'oₜ' },
  rnn: { hex: '#94a3b8', name: 'slate', label: 'RNN' },
  lstm: { hex: '#4f46e5', name: 'indigo', label: 'LSTM' },
};

// Литерални класове (Tailwind ги намира само ако са изписани изцяло).
export const TINT = {
  x: 'bg-slate-50 border-slate-300 text-slate-800',
  h: 'bg-indigo-50 border-indigo-300 text-indigo-900',
  c: 'bg-amber-50 border-amber-300 text-amber-900',
  f: 'bg-rose-50 border-rose-300 text-rose-900',
  i: 'bg-emerald-50 border-emerald-300 text-emerald-900',
  g: 'bg-teal-50 border-teal-300 text-teal-900',
  o: 'bg-violet-50 border-violet-300 text-violet-900',
};

export const GATE_NAMES = {
  f: 'Forget gate fₜ — колко от старата памет да остане',
  i: 'Input gate iₜ — колко от новото да влезе',
  g: 'Кандидат gₜ — какво ново да се запише',
  o: 'Output gate oₜ — колко от паметта да се покаже',
};

// ---------- Числа: десетична точка, фиксиран формат ----------
const MINUS = '−';
/** Число със знак: +0.40, −0.93; над 10 по модул — един знак (+26.3). */
export function fs(v, d = 2) {
  if (v == null || Number.isNaN(v)) return '—';
  const dd = Math.abs(v) >= 10 ? 1 : d;
  const s = Math.abs(v).toFixed(dd);
  if (Number(s) === 0) return (0).toFixed(dd);
  return (v < 0 ? MINUS : '+') + s;
}
/** Число без знак „+“ (вероятности, гейтове 0..1). */
export function fp(v, d = 2) {
  if (v == null || Number.isNaN(v)) return '—';
  const s = Math.abs(v).toFixed(d);
  return (v < 0 && Number(s) !== 0 ? MINUS : '') + s;
}

/** Числова клетка с минимална ширина; никога не се свива. */
export function Num({ v, signed = true, d = 2, className = '', w = 52 }) {
  return (
    <span className={`num inline-block text-right shrink-0 ${className}`} style={{ minWidth: w }} data-num="">
      {signed ? fs(v, d) : fp(v, d)}
    </span>
  );
}

// ---------- Карти и текст ----------
export function Card({ title, children, className = '', right = null, id }) {
  return (
    <section id={id} className={`bg-white rounded-lg shadow-lg p-4 mb-5 ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-4 mb-3">
          {title && <h3 className="text-lg font-semibold text-indigo-800">{title}</h3>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

/** Основният параграф на секцията; може да се скрие по време на демонстрация. */
export function Intro({ title, lead, children, formula }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="bg-white rounded-lg shadow-lg p-5 mb-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-indigo-900">{title}</h2>
          {lead && <p className="text-indigo-700 mt-1">{lead}</p>}
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
        >
          {open ? <EyeOff size={16} /> : <Eye size={16} />}
          {open ? 'Скрий текста' : 'Покажи текста'}
        </button>
      </div>
      {open && (
        <div className="mt-3 text-[17px] leading-relaxed text-gray-800 space-y-3">
          {children}
          {formula && <div className="bg-indigo-50 rounded p-3 font-mono text-[15px] text-indigo-900 overflow-x-auto">{formula}</div>}
        </div>
      )}
    </section>
  );
}

export function Bridge({ children }) {
  return (
    <div className="border-l-4 border-indigo-400 bg-indigo-50 text-indigo-900 rounded-r p-3 mb-5 text-[17px] italic">{children}</div>
  );
}

/** Карта „Задача“: въпрос и скрит отговор. */
export function TaskCard({ n, title, children, answer }) {
  const [show, setShow] = useState(false);
  return (
    <div className="border-2 border-yellow-400 bg-yellow-50 rounded-lg p-4 mb-3">
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-8 h-8 rounded-full bg-yellow-400 text-yellow-950 font-bold flex items-center justify-center">{n}</span>
        <div className="flex-1">
          <p className="font-semibold text-yellow-950">{title}</p>
          <div className="text-gray-800 mt-1">{children}</div>
          {answer && (
            <div className="mt-2">
              <button onClick={() => setShow(!show)} className="text-sm px-3 py-1 rounded bg-yellow-200 hover:bg-yellow-300 text-yellow-950">
                {show ? 'Скрий отговора' : 'Покажи отговора'}
              </button>
              {show && <p className="mt-2 text-gray-800 bg-white rounded p-2 border border-yellow-200">{answer}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Сегментиран превключвател. */
export function Segmented({ value, onChange, options, size = 'md' }) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-sm' : 'px-3 py-1.5';
  return (
    <div className="inline-flex rounded-lg border border-indigo-200 overflow-hidden bg-white">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`${pad} border-r last:border-r-0 border-indigo-200 whitespace-nowrap ${
            value === o.value ? 'bg-indigo-600 text-white' : 'text-indigo-900 hover:bg-indigo-50'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Стъпки във времето ----------
/** Стъпка t от 0 до n-1, с автоматично пускане. */
export function useStepper(n, delay = 900) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { setT((v) => Math.min(v, Math.max(n - 1, 0))); }, [n]);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setT((v) => {
        if (v >= n - 1) { setPlaying(false); return v; }
        return v + 1;
      });
    }, delay);
    return () => clearInterval(id);
  }, [playing, n, delay]);
  return {
    t, setT, playing,
    prev: () => { setPlaying(false); setT((v) => Math.max(0, v - 1)); },
    next: () => { setPlaying(false); setT((v) => Math.min(n - 1, v + 1)); },
    toggle: () => { if (t >= n - 1) setT(0); setPlaying((p) => !p); },
    reset: () => { setPlaying(false); setT(0); },
  };
}

/** Стрелките ← → стъпват, само когато фокусът не е в поле за въвеждане. */
export function useArrowKeys(stepper, active = true) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag) || e.target.isContentEditable) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); stepper.next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); stepper.prev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stepper, active]);
}

export function StepControls({ stepper, n, label }) {
  const { t, playing, prev, next, toggle, reset } = stepper;
  const btn = 'px-3 py-2 rounded flex items-center gap-1.5 disabled:opacity-40';
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={prev} disabled={t === 0} className={`${btn} bg-gray-600 text-white hover:bg-gray-700`}>
        <ChevronLeft size={16} /> Назад
      </button>
      <button onClick={toggle} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-700`}>
        {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? 'Пауза' : 'Авто'}
      </button>
      <button onClick={next} disabled={t >= n - 1} className={`${btn} bg-gray-600 text-white hover:bg-gray-700`}>
        Напред <ChevronRight size={16} />
      </button>
      <button onClick={reset} className={`${btn} bg-gray-200 text-gray-800 hover:bg-gray-300`}>
        <RotateCcw size={16} /> Рестарт
      </button>
      <span className="text-gray-600 ml-2 whitespace-nowrap">
        Стъпка <span className="num font-semibold text-indigo-900">{t + 1}</span> от <span className="num">{n}</span>
        {label && <> — {label}</>}
      </span>
      <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">← → от клавиатурата</span>
    </div>
  );
}

/** Ширина на контейнер (за SVG без мащабиране на текста). */
export function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(360);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(ref.current);
    setW(Math.floor(ref.current.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** Вектор като лента от цветни клетки с числата. */
export function VectorStrip({ values, kind = 'h', label, signed = true, highlight = -1, onPick }) {
  const hex = COLORS[kind].hex;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {label && <span className="text-sm text-gray-600 w-14 shrink-0">{label}</span>}
      <div className="flex gap-1">
        {values.map((v, j) => {
          const a = Math.min(Math.abs(v), 1);
          return (
            <button
              key={j}
              onClick={onPick ? () => onPick(j) : undefined}
              className={`rounded border text-[13px] py-1 ${highlight === j ? 'ring-2 ring-red-500' : ''} ${onPick ? 'cursor-pointer' : 'cursor-default'}`}
              style={{
                minWidth: 56,
                background: v >= 0 ? `${hex}${Math.round(a * 200 + 20).toString(16).padStart(2, '0')}` : `#ef4444${Math.round(a * 200 + 20).toString(16).padStart(2, '0')}`,
                borderColor: '#e5e7eb',
                color: a > 0.6 ? 'white' : '#111827',
              }}
              title={`единица ${j + 1}`}
            >
              <span className="num">{signed ? fs(v) : fp(v)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
