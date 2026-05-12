import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`theme-toggle ${className || ''}`}
      onClick={toggleTheme}
    />
  );
}
