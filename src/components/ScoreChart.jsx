import React from 'react';
import { COLORS, fp, useWidth } from './ui.jsx';

/**
 * Крива на оценката p след всяка дума. series: [{ key:'lstm', steps:[...] }, ...]
 * Попълва се до стъпка t. Ширината следва контейнера; при много думи — скрол.
 */
export function ScoreChart({ series, t, words, height = 260 }) {
  const [ref, cw] = useWidth();
  const n = words.length;
  const left = 40, right = 16, y0 = 14, bottom = 84;
  const minStep = 30;
  const W = Math.max(cw, left + right + Math.max(n - 1, 1) * minStep);
  const step = n > 1 ? (W - left - right) / (n - 1) : 0;
  const X = (k) => left + k * step;
  const Y = (p) => y0 + (1 - p) * (height - y0 - bottom);
  const last = Math.min(t, n - 1);
  // Етикети на текущата стойност: по-високата над точката, по-ниската под нея,
  // в рамките на графиката и на поне 15 px една от друга.
  const top = y0 + 12, floor = height - bottom - 4;
  const labels = series
    .map((s) => ({ key: s.key, p: s.steps[last]?.p }))
    .filter((l) => l.p != null)
    .sort((a, b) => b.p - a.p)
    .map((l, k) => ({ ...l, y: Math.min(Math.max(Y(l.p) + (k === 0 ? -8 : 16), top), floor) }));
  for (let k = 1; k < labels.length; k++) labels[k].y = Math.max(labels[k].y, labels[k - 1].y + 15);
  const over = labels.length ? labels.at(-1).y - floor : 0;
  if (over > 0) labels.forEach((l) => (l.y -= over));
  const labelY = Object.fromEntries(labels.map((l) => [l.key, l.y]));
  const ANGLE = 60; // наклон на думите; разстоянието между тях перпендикулярно = step·sin(60°)
  return (
    <div ref={ref} className="hscroll">
      <svg width={W} height={height} role="img" aria-label="Оценка след всяка дума">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={left} x2={W - right} y1={Y(v)} y2={Y(v)} stroke={v === 0.5 ? '#9ca3af' : '#e5e7eb'} strokeDasharray={v === 0.5 ? '4 4' : ''} />
            <text x={left - 6} y={Y(v) + 4} textAnchor="end" fontSize="12" fill="#6b7280">{v.toFixed(1)}</text>
          </g>
        ))}
        <text x={left + 4} y={Y(1) + 14} fontSize="12" fill="#16a34a">положително</text>
        <text x={left + 4} y={Y(0) - 6} fontSize="12" fill="#dc2626">отрицателно</text>
        {words.map((w, k) => (
          <text
            key={k}
            x={X(k)}
            y={height - bottom + 16}
            fontSize="12"
            fill={k === last ? '#dc2626' : '#6b7280'}
            fontWeight={k === last ? 700 : 400}
            transform={`rotate(-${ANGLE} ${X(k)} ${height - bottom + 16})`}
            textAnchor="end"
            data-rot={ANGLE}
            data-step={step}
          >
            {w}
          </text>
        ))}
        {series.map((s) => {
          const pts = s.steps.slice(0, last + 1).map((st, k) => `${X(k)},${Y(st.p)}`).join(' ');
          const hex = COLORS[s.key].hex;
          const cur = s.steps[last];
          return (
            <g key={s.key}>
              <polyline points={pts} fill="none" stroke={hex} strokeWidth={s.key === 'lstm' ? 3 : 2.5} />
              {s.steps.slice(0, last + 1).map((st, k) => (
                <circle key={k} cx={X(k)} cy={Y(st.p)} r={k === last ? 5 : 3} fill={hex}>
                  <title>{`${s.key.toUpperCase()}, „${words[k]}“: ${fp(st.p)}`}</title>
                </circle>
              ))}
              {cur && (
                <text
                  x={X(last) + 48 > W - right ? X(last) - 9 : X(last) + 9}
                  textAnchor={X(last) + 48 > W - right ? 'end' : 'start'}
                  y={labelY[s.key]}
                  fontSize="13"
                  fontWeight="700"
                  fill={hex}
                  className="num"
                >
                  {fp(cur.p)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {series.length > 1 && (
        <div className="flex gap-4 text-sm mt-1">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="inline-block w-5 h-1 rounded" style={{ background: COLORS[s.key].hex }} />
              {s.key.toUpperCase()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
