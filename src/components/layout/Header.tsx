'use client';

import { t, Lang, setLangInStorage, languages } from '@/lib/i18n';

interface HeaderProps {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
}

export default function Header({ lang, onLangChange }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-logo">
        <div className="app-logo-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <span>{t('app.name', lang)}</span>
        <span className="caption" style={{ marginLeft: 8 }}>
          {t('app.tagline', lang)}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="chain-badge">
          <div className="pulse-dot" style={{ width: 6, height: 6 }} />
          {t('chain.status', lang)}
        </div>

        <select
          className="lang-select"
          value={lang}
          onChange={(e) => {
            const newLang = e.target.value as Lang;
            setLangInStorage(newLang);
            onLangChange(newLang);
          }}
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.native}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
