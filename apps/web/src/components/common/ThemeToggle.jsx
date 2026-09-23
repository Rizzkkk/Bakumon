import { useTheme } from '../../hooks/useTheme.js';
import { PixelIcon } from './PixelIcon.jsx';

// The artboards label this with the destination, not the current state - "Switch to dark
// theme" while showing light. aria-pressed is not used for the same reason a toggle
// switch and a one-way action button read differently to a screen reader.
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} theme`}
      style={{
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        color: 'var(--text)',
        border: '2px solid var(--line)',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      <PixelIcon name="theme" size={20} />
    </button>
  );
}
