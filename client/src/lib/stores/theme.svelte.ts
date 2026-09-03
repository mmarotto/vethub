/**
 * Theme store
 *
 * Tracks the active UI theme (Light / Dark / Fancy) and keeps it in sync
 * with `<html data-theme>` and `localStorage`. Light is the default and
 * has no `data-theme` attribute (see app.css).
 *
 * The initial value on the client mirrors whatever the inline
 * FOUC-prevention script in app.html already applied to `<html>` before
 * this module runs, so there's no flash/mismatch on hydration.
 */

export type Theme = 'light' | 'dark' | 'fancy';

const STORAGE_KEY = 'vethub-theme';

function readInitialTheme(): Theme {
	if (typeof document === 'undefined') return 'light';
	const attr = document.documentElement.getAttribute('data-theme');
	return attr === 'dark' || attr === 'fancy' ? attr : 'light';
}

class ThemeStore {
	current = $state<Theme>(readInitialTheme());

	set(theme: Theme) {
		this.current = theme;

		if (typeof document !== 'undefined') {
			if (theme === 'light') {
				document.documentElement.removeAttribute('data-theme');
			} else {
				document.documentElement.setAttribute('data-theme', theme);
			}
		}

		try {
			localStorage.setItem(STORAGE_KEY, theme);
		} catch {
			// localStorage unavailable (e.g. private browsing) - theme still
			// applies for this page load, it just won't persist.
		}
	}
}

export const themeStore = new ThemeStore();
