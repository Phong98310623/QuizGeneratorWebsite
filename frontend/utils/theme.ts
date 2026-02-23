/**
 * Theme utility to switch between different color palettes.
 * These match the themes defined in index.css.
 */

export type ThemeType = 'default' | 'emerald' | 'rose' | 'violet' | 'vip';

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
 * Optionally overrides with VIP theme if user is VIP.
 * @param isVip - Whether the user has VIP status.
 */
export const initTheme = (isVip?: boolean) => {
  const savedTheme = localStorage.getItem('app-theme') as ThemeType;
  
  // If user is VIP and no theme is saved or the saved theme is default, 
  // we might want to default to the VIP theme.
  if (isVip && (!savedTheme || savedTheme === 'default')) {
    setTheme('vip');
    return;
  }

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
