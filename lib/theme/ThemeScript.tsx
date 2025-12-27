// This script runs before React hydration to prevent flash of wrong theme
export function ThemeScript() {
  const script = `
    (function() {
      const STORAGE_KEY = 'vistral-theme';

      function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      function getTheme() {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored === 'light' || stored === 'dark') return stored;
          if (stored === 'system' || !stored) return getSystemTheme();
          return getSystemTheme();
        } catch (e) {
          return getSystemTheme();
        }
      }

      const theme = getTheme();
      document.documentElement.classList.add(theme);
      document.documentElement.style.colorScheme = theme;

      // Update meta theme-color
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#f8fafc');
      }
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
