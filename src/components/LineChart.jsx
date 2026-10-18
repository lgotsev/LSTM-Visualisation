import React from 'react';
import { useWidth } from './ui.jsx';

/**
 * Проста линейна графика без мащабиране на текста.
 * series: [{ key, label, color, width, points: [{x, y}], dashed }]
 * y: { min, max, log?, ticks: [..], fmt }
 * x: { min, max, ticks: [..], fmt, title }
 */
export function LineChart({ series, x, y, height = 260, title, refY = [], bands = [], marker = null }) {
  const [ref, cw] = useWidth();
  const W = Math.max(cw, 360);
  const left = 64, right = 70, y0 = title ? 30 : 12, bottom = 44;
  const X = (v) => left + ((v - x.min) / (x.max - x.min)) * (W - left - right);
  const ty = (v) => (y.log ? Math.log10(Math.max(v, 1e-300)) : v);
  const lo = ty(y.min), hi = ty(y.max);
  const Y = (v) => {
    const t = (Math.min(Math.max(ty(v), lo), hi) - lo) / (hi - lo);
    return height - bottom - t * (height - bottom - y0);
  };
  return (
    <div ref={ref}>
      <svg width={W} height={height} role="img" aria-label={title || 'графика'}>
        {title && <text x={left} y={18} fontSize="14" fontWeight="600" fill="#312e81">{title}</text>}
        {bands.map((b, k) => (
          <g key={k}>
            <rect x={left} width={W - left - right} y={Y(b.to)} height={Y(b.from) - Y(b.to)} fill={b.color} opacity="0.12" />
            <text x={W - right - 6} y={Y(b.to) + 16} textAnchor="end" fontSize="12" fill={b.text}>{b.label}</text>
          </g>
        ))}
        {y.ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={W - right} y1={Y(t)} y2={Y(t)} stroke="#e5e7eb" />
            <text x={left - 8} y={Y(t) + 4} textAnchor="end" fontSize="12" fill="#6b7280">{y.fmt(t)}</text>
          </g>
        ))}
        {refY.map((r) => (
          <line key={r} x1={left} x2={W - right} y1={Y(r)} y2={Y(r)} stroke="#6b7280" strokeDasharray="4 4" />
        ))}
        <line x1={left} x2={W - right} y1={height - bottom} y2={height - bottom} stroke="#9ca3af" />
        {x.ticks.map((t) => (
          <text key={t} x={X(t)} y={height - bottom + 18} textAnchor="middle" fontSize="12" fill="#6b7280">{x.fmt ? x.fmt(t) : t}</text>
        ))}
        {x.title && <text x={(left + W - right) / 2} y={height - 6} textAnchor="middle" fontSize="12" fill="#6b7280">{x.title}</text>}
        {marker && <line x1={X(marker)} x2={X(marker)} y1={y0} y2={height - bottom} stroke="#dc2626" strokeDasharray="3 3" />}
        {series.map((s) => {
          const pts = s.points.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ');
          const lastP = s.points.at(-1);
          return (
            <g key={s.key}>
              <polyline points={pts} fill="none" stroke={s.color} strokeWidth={s.width || 2.5} strokeDasharray={s.dashed ? '6 4' : ''} />
              {s.dots && s.points.map((p, k) => (
                <circle key={k} cx={X(p.x)} cy={Y(p.y)} r="3.5" fill={s.color}><title>{`${s.label}: ${y.fmt(p.y)}`}</title></circle>
              ))}
              {lastP && s.label && (
                <text x={X(lastP.x) + 8} y={Y(lastP.y) + 4 + (s.labelDy || 0)} fontSize="13" fontWeight="600" fill={s.color}>{s.label}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
