import React, { useEffect, useRef } from 'react';
import { COLORS, fs, fp } from './ui.jsx';

const charW = 7.6; // ширина на знак при 12–13 px моноширинен шрифт
export const colWidth = (w) => Math.max(52, Math.ceil(String(w).length * charW + 14));

/**
 * Топлинна карта: редове = единици 1..4, колони = думи.
 * Колоната на текущата дума е подсветена; бъдещите стъпки са празни.
 * Първата колона (етикетите) е закрепена при хоризонтален скрол.
 */
export function Heatmap({ words, values, kind, t, unit, onPickUnit, onPickStep, signed }) {
  const scroller = useRef(null);
  const curCol = useRef(null);
  useEffect(() => {
    const s = scroller.current, c = curCol.current;
    if (!s || !c) return;
    const l = c.offsetLeft - 96, r = c.offsetLeft + c.offsetWidth;
    if (l < s.scrollLeft) s.scrollTo({ left: l, behavior: 'smooth' });
    else if (r > s.scrollLeft + s.clientWidth) s.scrollTo({ left: r - s.clientWidth, behavior: 'smooth' });
  }, [t]);
  const hex = COLORS[kind].hex;
  const H = values[0]?.length || 4;
  const cell = (v) => {
    if (v == null) return { background: '#f3f4f6', color: '#9ca3af' };
    const a = Math.min(Math.abs(v), 1);
    const base = signed ? (v >= 0 ? '#3b82f6' : '#ef4444') : hex;
    const alpha = Math.round((0.08 + a * 0.75) * 255).toString(16).padStart(2, '0');
    return { background: base + alpha, color: a > 0.62 ? 'white' : '#111827' };
  };
  return (
    <div ref={scroller} className="hscroll border rounded">
      <table className="min-w-max border-collapse text-[13px]" data-heavy="">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white text-left px-2 py-1 font-normal text-gray-500" style={{ width: 96, minWidth: 96 }}>
              единица
            </th>
            {words.map((w, k) => (
              <th
                key={k}
                ref={k === t ? curCol : null}
                onClick={() => onPickStep && onPickStep(k)}
                className={`px-1 py-1 font-normal cursor-pointer whitespace-nowrap ${k === t ? 'text-red-600 font-bold' : 'text-gray-700'}`}
                style={{ width: colWidth(w), minWidth: colWidth(w) }}
              >
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: H }, (_, j) => (
            <tr key={j}>
              <th
                onClick={() => onPickUnit && onPickUnit(j)}
                className={`sticky left-0 z-10 bg-white text-left px-2 py-1 font-normal cursor-pointer whitespace-nowrap ${j === unit ? 'text-indigo-700 font-bold' : 'text-gray-700'}`}
              >
                {j === unit ? '▸ ' : ''}единица {j + 1}
              </th>
              {words.map((_, k) => {
                const v = k <= t ? values[k][j] : null;
                return (
                  <td
                    key={k}
                    onClick={() => onPickStep && onPickStep(k)}
                    className={`num text-center py-1.5 cursor-pointer border border-white ${k === t ? 'outline outline-2 outline-red-500 -outline-offset-2' : ''} ${
                      j === unit ? 'font-bold' : ''
                    }`}
                    style={cell(v)}
                    data-num=""
                  >
                    {v == null ? '' : signed ? fs(v) : fp(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
