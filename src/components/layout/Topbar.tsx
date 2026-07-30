'use client';

import { TrendingUp, Globe } from 'lucide-react';
import { Lang, languages, setLangInStorage } from '@/lib/i18n';

interface TopbarProps {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onMenuToggle?: () => void;
}

export default function Topbar({ lang, onLangChange, onMenuToggle }: TopbarProps) {
  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as Lang;
    setLangInStorage(newLang);
    onLangChange(newLang);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
          <TrendingUp size={15} />
        </div>
      </div>

      <div className="topbar-right">
        <select className="lang-select" value={lang} onChange={handleLangChange}>
          {languages.map((l) => (
            <option key={l.code} value={l.code}>{l.native}</option>
          ))}
        </select>
        <Globe size={15} style={{ color: 'var(--text-muted)' }} />
      </div>
    </header>
  );
}
