import React, { useEffect, useRef } from 'react';

/** Цвят по оценката p: червено (отрицателно) → сиво → зелено (положително). */
export function scoreColor(p) {
  const t = Math.max(-1, Math.min(1, (p - 0.5) * 2));
  if (t >= 0) return `rgba(34,197,94,${0.15 + 0.6 * t})`;
  return `rgba(239,68,68,${0.15 + 0.6 * -t})`;
}

/**
 * Изречението като ред чипове. Текущата дума е с червена рамка;
 * прочетените са оцветени по оценката; думи извън речника — пунктир и „?“.
 * При дълго изречение — хоризонтален скрол, който следва текущата дума.
 */
export function WordStrip({ steps, t, onPick, showScore = true }) {
  const cur = useRef(null);
  useEffect(() => {
    cur.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [t]);
  return (
    <div className="hscroll pb-1">
      <div className="flex gap-1.5 min-w-max py-1 px-0.5">
        {steps.map((s, k) => {
          const done = k <= t;
          return (
            <button
              key={k}
              ref={k === t ? cur : null}
              onClick={() => onPick && onPick(k)}
              className={`px-2 py-1 rounded text-[15px] whitespace-nowrap border-2 ${
                k === t ? 'border-red-500' : s.known ? 'border-transparent' : 'border-dashed border-gray-400'
              } ${done ? 'text-gray-900' : 'text-gray-400'}`}
              style={{ background: done && showScore ? scoreColor(s.p) : '#f3f4f6' }}
              title={s.known ? `дума №${s.id}` : 'няма я в речника — чете се като <unk>'}
            >
              {typeof s.w === 'string' ? s.w : s.w}
              {!s.known && <sup className="text-gray-500 ml-0.5">?</sup>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
