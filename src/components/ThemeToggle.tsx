import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'fluxo-theme';

function getInitialDark() {
  return document.documentElement.classList.contains('dark');
}

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState<boolean>(getInitialDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light'); } catch { /* ignore */ }
  }, [dark]);

  return (
    <button
      type="button"
      id="theme-toggle"
      className={`theme-toggle ${className}`}
      onClick={() => setDark(d => !d)}
      title={dark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      aria-label={dark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
