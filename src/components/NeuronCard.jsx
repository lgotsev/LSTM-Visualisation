import React from 'react';
import { TINT, fs, fp } from './ui.jsx';

/**
 * Карта „формален неврон“ (стилът на изчисленията от формалния неврон):
 * 12 входа (8 от думата + 4 от hₜ₋₁) × тегла → сума + bias = z → активация.
 * pre = { terms, bias, z } от preact(); act = 'sigmoid' | 'tanh'.
 */
export function NeuronCard({ kind, title, pre, act, out, extraBias = 0, locked = null }) {
  const z = pre.z + extraBias;
  const actName = act === 'tanh' ? 'tanh' : 'σ';
  return (
    <div className={`rounded-lg border p-3 ${TINT[kind]}`}>
      <p className="font-semibold mb-2">{title}</p>
      <div className="max-h-[188px] overflow-y-auto bg-white/70 rounded p-2">
        <table className="text-[13px] w-full">
          <thead>
            <tr className="text-gray-500 text-left">
              <th className="font-normal pr-2">вход</th>
              <th className="font-normal text-right">стойност</th>
              <th className="font-normal text-center px-1">×</th>
              <th className="font-normal text-right">тегло</th>
              <th className="font-normal text-center px-1">=</th>
              <th className="font-normal text-right">произв.</th>
            </tr>
          </thead>
          <tbody>
            {pre.terms.map((t, k) => (
              <tr key={k} className={t.src === 'h' ? 'text-indigo-900' : 'text-slate-800'}>
                <td className="pr-2 whitespace-nowrap">{t.src === 'x' ? `x[${t.k + 1}]` : `h₋₁[${t.k + 1}]`}</td>
                <td className="num text-right" data-num="">{fs(t.in)}</td>
                <td className="text-center text-gray-400">×</td>
                <td className="num text-right" data-num="">{fs(t.w)}</td>
                <td className="text-center text-gray-400">=</td>
                <td className="num text-right" data-num="">{fs(t.prod)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 font-mono text-[14px] space-y-0.5">
        <div className="flex justify-between gap-2"><span>Σ произведения</span><span className="num">{fs(pre.z - pre.bias)}</span></div>
        <div className="flex justify-between gap-2"><span>+ bias</span><span className="num">{fs(pre.bias + extraBias)}</span></div>
        <div className="flex justify-between gap-2 border-t border-current/20 pt-0.5 font-semibold"><span>z</span><span className="num">{fs(z)}</span></div>
        <div className="flex justify-between gap-2 text-[15px] font-bold">
          <span>{actName}(z)</span>
          <span className="num">{locked != null ? <>{fp(locked)} <span className="text-xs font-normal">(заключено)</span></> : act === 'tanh' ? fs(out) : fp(out)}</span>
        </div>
      </div>
    </div>
  );
}
