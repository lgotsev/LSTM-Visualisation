import React from 'react';
import { COLORS } from './ui.jsx';

const AX = '#64748b';
const Arrow = ({ id, color = AX }) => (
  <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M0 0L10 5L0 10z" fill={color} />
  </marker>
);

/** RNN: сгъната (една клетка с примка) или разгъната по думите. */
export function RnnFoldDiagram({ unfolded, words }) {
  const hc = COLORS.h.hex, xc = COLORS.x.hex;
  if (!unfolded) {
    return (
      <svg viewBox="0 0 520 230" className="w-full max-w-[520px]" role="img" aria-label="Сгъната RNN">
        <defs><Arrow id="fa" /><Arrow id="fh" color={hc} /></defs>
        <rect x="200" y="80" width="120" height="64" rx="10" fill="#eef2ff" stroke={hc} strokeWidth="2" />
        <text x="260" y="108" textAnchor="middle" fontSize="16" fontWeight="600" fill="#312e81">RNN</text>
        <text x="260" y="128" textAnchor="middle" fontSize="13" fill="#4338ca">Wₓ, Wₕ, b</text>
        <path d="M320 104 C 380 104, 380 40, 260 40 C 150 40, 150 104, 200 104" fill="none" stroke={hc} strokeWidth="2" markerEnd="url(#fh)" />
        <text x="260" y="32" textAnchor="middle" fontSize="13" fill={hc}>hₜ₋₁ → hₜ (примка: паметта се връща)</text>
        <line x1="260" y1="200" x2="260" y2="146" stroke={xc} strokeWidth="2" markerEnd="url(#fa)" />
        <text x="260" y="218" textAnchor="middle" fontSize="13" fill="#334155">xₜ (дума t)</text>
        <line x1="320" y1="124" x2="440" y2="124" stroke={hc} strokeWidth="2" markerEnd="url(#fh)" />
        <text x="446" y="128" fontSize="13" fill="#312e81">hₜ</text>
      </svg>
    );
  }
  const ws = words.slice(0, 6);
  const bw = 70, gap = 26, x0 = 40;
  const W = x0 * 2 + ws.length * bw + (ws.length - 1) * gap + 40;
  return (
    <div className="hscroll">
      <svg width={W} height="230" role="img" aria-label="Разгъната RNN">
        <defs><Arrow id="ua" /><Arrow id="uh" color={hc} /></defs>
        <text x={x0 - 30} y="116" fontSize="13" fill="#312e81">h₀=0</text>
        {ws.map((w, k) => {
          const x = x0 + 20 + k * (bw + gap);
          return (
            <g key={k}>
              <rect x={x} y="84" width={bw} height="56" rx="8" fill="#eef2ff" stroke={hc} strokeWidth="2" />
              <text x={x + bw / 2} y="108" textAnchor="middle" fontSize="13" fontWeight="600" fill="#312e81">RNN</text>
              <text x={x + bw / 2} y="126" textAnchor="middle" fontSize="12" fill="#4338ca">Wₓ, Wₕ</text>
              <line x1={x + bw / 2} y1="186" x2={x + bw / 2} y2="142" stroke={xc} strokeWidth="2" markerEnd="url(#ua)" />
              <text x={x + bw / 2} y="204" textAnchor="middle" fontSize="13" fill="#334155">{w}</text>
              <line x1={x - gap + 2} y1="112" x2={x - 2} y2="112" stroke={hc} strokeWidth="2" markerEnd="url(#uh)" />
              <text x={x + bw / 2} y="74" textAnchor="middle" fontSize="12" fill={hc}>h{['₁', '₂', '₃', '₄', '₅', '₆'][k]}</text>
            </g>
          );
        })}
        <text x={x0 + 20 + ws.length * (bw + gap) - 8} y="116" fontSize="13" fill="#6b7280">…</text>
        <text x={x0} y="30" fontSize="13" fill="#312e81">Едни и същи тегла Wₓ, Wₕ на всяка стъпка — дълбока мрежа с поделени тегла</text>
      </svg>
    </div>
  );
}

/** Верига (рекурентна) срещу дърво (рекурсивна). */
export function ChainVsTree() {
  const hc = COLORS.h.hex;
  const node = (x, y, label, strong) => {
    const w = Math.max(68, label.length * 8 + 18);
    return (
    <g>
      <rect x={x - w / 2} y={y - 15} width={w} height="30" rx="8" fill={strong ? '#eef2ff' : 'white'} stroke={hc} strokeWidth="1.5" />
      <text x={x} y={y + 5} textAnchor="middle" fontSize="13" fill="#1e1b4b">{label}</text>
    </g>
    );
  };
  return (
    <div className="grid md:grid-cols-2 gap-4 max-w-[860px]">
      <figure>
        <svg viewBox="0 0 330 150" width="330" height="150" className="mx-auto" role="img" aria-label="Верига">
          <defs><Arrow id="ca" color={hc} /></defs>
          {['not', 'very', 'good'].map((w, k) => (
            <g key={w}>
              {node(60 + k * 105, 60, 'h' + ['₁', '₂', '₃'][k], k === 2)}
              <text x={60 + k * 105} y="120" textAnchor="middle" fontSize="13" fill="#334155">{w}</text>
              <line x1={60 + k * 105} y1="106" x2={60 + k * 105} y2="77" stroke={AX} strokeWidth="1.5" />
              {k < 2 && <line x1={94 + k * 105} y1="60" x2={129 + k * 105} y2="60" stroke={hc} strokeWidth="1.5" markerEnd="url(#ca)" />}
            </g>
          ))}
        </svg>
        <figcaption className="text-sm text-center text-gray-700">Рекурентна (RNN): верига, дума след дума</figcaption>
      </figure>
      <figure>
        <svg viewBox="0 0 330 150" width="330" height="150" className="mx-auto" role="img" aria-label="Дърво">
          {node(165, 25, 'not very good', true)}
          {node(240, 75, 'very good', false)}
          <line x1="165" y1="40" x2="70" y2="105" stroke={hc} strokeWidth="1.5" />
          <line x1="165" y1="40" x2="240" y2="60" stroke={hc} strokeWidth="1.5" />
          <line x1="240" y1="90" x2="195" y2="112" stroke={hc} strokeWidth="1.5" />
          <line x1="240" y1="90" x2="285" y2="112" stroke={hc} strokeWidth="1.5" />
          <text x="70" y="124" textAnchor="middle" fontSize="13" fill="#334155">not</text>
          <text x="195" y="128" textAnchor="middle" fontSize="13" fill="#334155">very</text>
          <text x="285" y="128" textAnchor="middle" fontSize="13" fill="#334155">good</text>
        </svg>
        <figcaption className="text-sm text-center text-gray-700">Рекурсивна (Recursive NN): дърво, отдолу нагоре</figcaption>
      </figure>
    </div>
  );
}

/**
 * Интерактивна клетка LSTM. Клик върху гейт → onPick(gate).
 * vals: { cPrev, c, hPrev, h, f, i, g, o } за избраната единица (числа) или null.
 */
export function LstmCell({ active, onPick, vals, fmt }) {
  const C = COLORS;
  const W = 78, Hh = 48, gy = 228;
  const gx = { f: 230, i: 320, g: 420, o: 520 };
  const on = (k) => active === k;
  const gate = (k, label) => (
    <g onClick={() => onPick(k)} style={{ cursor: 'pointer' }} key={k}>
      <rect
        x={gx[k] - W / 2} y={gy - Hh / 2} width={W} height={Hh} rx="8"
        fill={on(k) ? C[k].hex : 'white'} fillOpacity={on(k) ? 0.18 : 1}
        stroke={C[k].hex} strokeWidth={on(k) ? 3 : 1.75}
      />
      <text x={gx[k]} y={vals ? gy - 4 : gy + 5} textAnchor="middle" fontSize="14" fontWeight="600" fill="#111827">{label}</text>
      {vals && (
        <text x={gx[k]} y={gy + 15} textAnchor="middle" fontSize="13" fill="#111827" fontWeight="700" className="num">{fmt(vals[k], k === 'g')}</text>
      )}
    </g>
  );
  const op = (x, y, s, color) => (
    <g>
      <circle cx={x} cy={y} r="13" fill="white" stroke={color} strokeWidth="1.75" />
      <text x={x} y={y + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill="#111827">{s}</text>
    </g>
  );
  const wire = (k) => (on(k) ? C[k].hex : AX);
  return (
    <svg viewBox="0 0 760 330" className="w-full max-w-[760px]" role="img" aria-label="Клетка LSTM">
      <defs>
        <Arrow id="la" /><Arrow id="lc" color={C.c.hex} />
        {['f', 'i', 'g', 'o'].map((k) => <Arrow key={k} id={`l${k}`} color={C[k].hex} />)}
      </defs>
      <rect x="150" y="62" width="530" height="232" rx="12" fill="none" stroke="#e5e7eb" strokeDasharray="5 5" />
      {/* конвейерната лента */}
      <g stroke={C.c.hex} strokeWidth="4" fill="none">
        <path d="M60 110H217" /><path d="M243 110H357" /><path d="M383 110H688" markerEnd="url(#lc)" /><path d="M600 110V144" strokeWidth="2" markerEnd="url(#lc)" />
      </g>
      <text x="24" y="115" fontSize="14" fontWeight="600" fill="#92400e">cₜ₋₁</text>
      <text x="700" y="115" fontSize="14" fontWeight="600" fill="#92400e">cₜ</text>
      {vals && <text x="24" y="134" fontSize="12" fill="#92400e" className="num">{fmt(vals.cPrev, true)}</text>}
      {vals && <text x="700" y="134" fontSize="12" fill="#92400e" className="num">{fmt(vals.c, true)}</text>}
      <text x="400" y="96" fontSize="12" fill="#92400e">клетъчно състояние — „конвейерната лента“</text>
      {/* входна шина */}
      <g fill="none" strokeWidth="1.5">
        <path d="M60 300H520" stroke={AX} />
        <path d="M120 322V300" stroke={AX} />
        {['f', 'i', 'g', 'o'].map((k) => <path key={k} d={`M${gx[k]} 300V254`} stroke={wire(k)} strokeWidth={on(k) ? 2.5 : 1.5} markerEnd={`url(#${on(k) ? 'l' + k : 'la'})`} />)}
        <path d="M230 210V125" stroke={wire('f')} strokeWidth={on('f') ? 2.5 : 1.5} markerEnd={`url(#${on('f') ? 'lf' : 'la'})`} />
        <path d="M320 210V165H355" stroke={wire('i')} strokeWidth={on('i') ? 2.5 : 1.5} markerEnd={`url(#${on('i') ? 'li' : 'la'})`} />
        <path d="M420 210V165H385" stroke={wire('g')} strokeWidth={on('g') ? 2.5 : 1.5} markerEnd={`url(#${on('g') ? 'lg' : 'la'})`} />
        <path d="M370 152V125" stroke={AX} markerEnd="url(#la)" />
        <path d="M562 228H585" stroke={wire('o')} strokeWidth={on('o') ? 2.5 : 1.5} markerEnd={`url(#${on('o') ? 'lo' : 'la'})`} />
        <path d="M600 174V213" stroke={AX} markerEnd="url(#la)" />
        <path d="M600 241V300H688" stroke={COLORS.h.hex} strokeWidth="2" markerEnd="url(#la)" />
      </g>
      {op(230, 110, '×', C.f.hex)}
      {op(370, 110, '+', C.c.hex)}
      {op(370, 165, '×', AX)}
      {op(600, 228, '×', AX)}
      <text x="244" y="152" fontSize="12" fill="#6b7280">забрави</text>
      <text x="390" y="146" fontSize="12" fill="#6b7280">добави</text>
      <text x="618" y="222" fontSize="12" fill="#6b7280">покажи</text>
      <rect x="570" y="146" width="60" height="28" rx="8" fill="white" stroke={AX} strokeWidth="1.5" />
      <text x="600" y="165" textAnchor="middle" fontSize="13" fill="#111827">tanh</text>
      {gate('f', 'f · σ')}
      {gate('i', 'i · σ')}
      {gate('g', 'g · tanh')}
      {gate('o', 'o · σ')}
      <text x="24" y="305" fontSize="14" fontWeight="600" fill="#312e81">hₜ₋₁</text>
      <text x="700" y="305" fontSize="14" fontWeight="600" fill="#312e81">hₜ</text>
      {vals && <text x="700" y="322" fontSize="12" fill="#312e81" className="num">{fmt(vals.h, true)}</text>}
      <text x="132" y="322" fontSize="12" fill="#334155">xₜ (думата)</text>
      <text x="162" y="84" fontSize="12" fill="#6b7280">клик върху гейт → неговото изчисление</text>
    </svg>
  );
}

/** Конвейерната лента: само cₜ през няколко стъпки, с × f и + i·g. */
export function Conveyor({ words, cs, fs: fvals, adds, t, fmt }) {
  const n = words.length;
  const step = 92, x0 = 40;
  const W = x0 + n * step + 50;
  const C = COLORS;
  return (
    <div className="hscroll">
      <svg width={W} height="170" role="img" aria-label="Конвейерната лента">
        <defs><Arrow id="cv" color={C.c.hex} /></defs>
        <line x1="20" x2={W - 20} y1="70" y2="70" stroke={C.c.hex} strokeWidth="5" markerEnd="url(#cv)" />
        <text x="20" y="56" fontSize="13" fill="#92400e">c₀ = 0</text>
        {words.map((w, k) => {
          const x = x0 + k * step + 30;
          const done = k <= t;
          return (
            <g key={k} opacity={done ? 1 : 0.3}>
              <circle cx={x} cy="70" r="14" fill="white" stroke={C.f.hex} strokeWidth="2" />
              <text x={x} y="75" textAnchor="middle" fontSize="14" fontWeight="700">×</text>
              <circle cx={x + 40} cy="70" r="14" fill="white" stroke={C.i.hex} strokeWidth="2" />
              <text x={x + 40} y="75" textAnchor="middle" fontSize="14" fontWeight="700">+</text>
              <text x={x} y="108" textAnchor="middle" fontSize="12" fill={C.f.hex} className="num">{done ? 'f ' + fmt(fvals[k], false) : 'f'}</text>
              <text x={x + 40} y="126" textAnchor="middle" fontSize="12" fill="#047857" className="num">{done ? fmt(adds[k], true) : 'i·g'}</text>
              <text x={x + 20} y="150" textAnchor="middle" fontSize="13" fill={k === t ? '#dc2626' : '#334155'} fontWeight={k === t ? 700 : 400}>{w}</text>
              {done && <text x={x + 66} y="48" textAnchor="middle" fontSize="12" fill="#92400e" fontWeight="600" className="num">{fmt(cs[k], true)}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
