import React, { useState } from 'react';
import { MAX_WORDS, tokenize } from '../model/forward.js';

/** Избор на вградено изречение или собствено (английски, до 40 думи). */
export function SentencePicker({ value, onChange, presets, allowCustom = true }) {
  const [draft, setDraft] = useState('');
  const n = tokenize(draft).length;
  const apply = () => {
    const words = tokenize(draft).slice(0, MAX_WORDS);
    if (words.length) onChange(words.join(' '));
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.text}
            onClick={() => onChange(p.text)}
            className={`px-2.5 py-1 rounded text-sm border ${value === p.text ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-50'}`}
            title={p.note || ''}
          >
            {p.text}
          </button>
        ))}
      </div>
      {allowCustom && (
        <div className="flex gap-2 items-start">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            placeholder="Собствено изречение на английски…"
            className="flex-1 min-w-0 px-2 py-1.5 border rounded text-[15px]"
          />
          <button onClick={apply} className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 whitespace-nowrap">
            Пусни
          </button>
        </div>
      )}
      {allowCustom && n > MAX_WORDS && (
        <p className="text-sm text-amber-700">Изречението има {n} думи — ще се използват първите {MAX_WORDS}.</p>
      )}
    </div>
  );
}
