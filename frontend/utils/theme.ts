/**
 * Theme utility to switch between different color palettes.
 * These match the themes defined in index.css.
 */

export type ThemeType = 'default' | 'emerald' | 'rose' | 'violet';

/**
 * Sets the theme by adding/removing the data-theme attribute on the root html element.
 * @param themeName - The name of the theme to apply.
 */
export const setTheme = (themeName: ThemeType) => {
  const root = document.documentElement;
  if (themeName === 'default') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', themeName);
  }
  
  // Persist choice in localStorage
  localStorage.setItem('app-theme', themeName);
  
  // Dispatch a custom event so components can react if needed
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: themeName }));
};

/**
 * Initializes the theme from localStorage on page load.
 */
export const initTheme = () => {
  const savedTheme = localStorage.getItem('app-theme') as ThemeType;
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    // Default to 'default' if nothing is saved
    setTheme('default');
  }
};

/**
 * Gets the current active theme name.
 */
export const getCurrentTheme = (): ThemeType => {
  return (localStorage.getItem('app-theme') as ThemeType) || 'default';
};
