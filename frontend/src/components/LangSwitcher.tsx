import { useTranslation } from 'react-i18next';
import { currentLang, setLang, type Lang } from '../i18n';

interface Props {
  compact?: boolean;
}

export function LangSwitcher({ compact = true }: Props) {
  const { i18n } = useTranslation();
  const active = currentLang();

  const pick = (next: Lang) => {
    if (next === active) return;
    void setLang(next);
  };

  const btn = (code: Lang, label: string) => {
    const on = i18n.language?.toLowerCase().startsWith(code);
    return (
      <button
        key={code}
        onClick={() => pick(code)}
        style={{
          padding: compact ? '3px 8px' : '5px 12px',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          cursor: on ? 'default' : 'pointer',
          border: '1px solid var(--border)',
          background: on ? 'var(--blue)' : 'transparent',
          color: on ? '#fff' : 'var(--fg-3)',
          fontFamily: 'var(--font-display)',
          textTransform: 'uppercase',
          letterSpacing: 'var(--tracking-wider)',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ display: 'inline-flex', gap: 4 }}>
      {btn('it', 'IT')}
      {btn('en', 'EN')}
    </div>
  );
}
