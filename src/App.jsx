import React, { useEffect, useState } from 'react';
import Section1 from './sections/Section1.jsx';
import Section2 from './sections/Section2.jsx';
import Section3 from './sections/Section3.jsx';
import Section4 from './sections/Section4.jsx';

const TABS = [
  { id: 's1', label: '1. Рекурентни мрежи', C: Section1 },
  { id: 's2', label: '2. Затихващ градиент', C: Section2 },
  { id: 's3', label: '3. LSTM', C: Section3 },
  { id: 's4', label: '4. Сравнение', C: Section4 },
];

const fromHash = () => {
  const h = window.location.hash.replace('#', '');
  return TABS.some((t) => t.id === h) ? h : 's1';
};

export default function App() {
  const [tab, setTab] = useState(fromHash);
  useEffect(() => {
    const on = () => setTab(fromHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = (id) => {
    window.location.hash = id;
    setTab(id);
    window.scrollTo({ top: 0 });
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 text-gray-900">
      <nav className="sticky top-0 z-30 bg-indigo-900 text-white shadow h-[52px]">
        <div className="max-w-[1280px] mx-auto px-6 h-full flex items-center gap-1">
          <span className="font-bold mr-4 whitespace-nowrap">LSTM визуализация</span>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              className={`px-3 py-1.5 rounded whitespace-nowrap ${tab === t.id ? 'bg-white text-indigo-900 font-semibold' : 'text-indigo-100 hover:bg-indigo-800'}`}
            >
              {t.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-indigo-300 whitespace-nowrap hidden lg:inline">IMDB · LSTM-4 87.0% · RNN-4 82.4%</span>
        </div>
      </nav>
      <main className="max-w-[1280px] mx-auto px-6 py-5">
        {TABS.map(({ id, C }) => (
          <div key={id} hidden={tab !== id}>
            {tab === id && <C active={tab === id} />}
          </div>
        ))}
        <footer className="text-center text-xs text-gray-500 py-4">
          Модели, обучени върху IMDB Movie Reviews (Maas и др., 2011). Скриптовете за обучение са в папка training/ на хранилището.
        </footer>
      </main>
    </div>
  );
}
