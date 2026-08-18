export const SUPPORTED_LANGUAGES = ['en', 'am', 'ti', 'om'] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: AppLanguage = 'en';
export const LANGUAGE_STORAGE_KEY = 'blih.language';

export const LANGUAGE_META: Record<
  AppLanguage,
  { label: string; nativeLabel: string; locale: string; shortLabel: string }
> = {
  en: { label: 'English', nativeLabel: 'English', locale: 'en-US', shortLabel: 'EN' },
  am: { label: 'Amharic', nativeLabel: 'አማርኛ', locale: 'am-ET', shortLabel: 'አማ' },
  ti: { label: 'Tigrinya', nativeLabel: 'ትግርኛ', locale: 'ti-ET', shortLabel: 'ትግ' },
  om: { label: 'Afaan Oromo', nativeLabel: 'Afaan Oromoo', locale: 'om-ET', shortLabel: 'OM' },
};

const LANGUAGE_PATH_RE = /^\/(en|am|ti|om)(?=\/|$)/i;

export function isSupportedLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && SUPPORTED_LANGUAGES.includes(value.toLowerCase() as AppLanguage);
}

export function normalizeLanguage(value: unknown): AppLanguage | null {
  if (typeof value !== 'string') return null;
  const base = value.trim().toLowerCase().split(/[-_]/)[0];
  return isSupportedLanguage(base) ? base : null;
}

export function getLanguageFromPath(pathname?: string): AppLanguage | null {
  const path = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const match = path.match(LANGUAGE_PATH_RE);
  return normalizeLanguage(match?.[1]);
}

export function readStoredLanguage(): AppLanguage | null {
  if (typeof window === 'undefined') return null;
  try {
    return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function persistLanguage(language: AppLanguage) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage may be disabled by the browser. URL language still remains authoritative.
  }
}

export function getCurrentLanguage(): AppLanguage {
  return getLanguageFromPath() ?? readStoredLanguage() ?? DEFAULT_LANGUAGE;
}

export function getRouterBasename(): string {
  return `/${getCurrentLanguage()}`;
}

export function stripLanguagePrefix(pathname: string): string {
  const stripped = pathname.replace(LANGUAGE_PATH_RE, '');
  return stripped || '/';
}

export function buildLanguageUrl(language: AppLanguage): string {
  if (typeof window === 'undefined') return `/${language}`;
  const path = stripLanguagePrefix(window.location.pathname);
  const suffix = path === '/' ? '' : path;
  return `/${language}${suffix}${window.location.search}${window.location.hash}`;
}

export function ensureLocalizedPath(): AppLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  const pathLanguage = getLanguageFromPath(window.location.pathname);
  if (pathLanguage) {
    persistLanguage(pathLanguage);
    return pathLanguage;
  }

  const storedLanguage = readStoredLanguage();
  const language = storedLanguage ?? DEFAULT_LANGUAGE;
  const suffix = window.location.pathname === '/' ? '' : window.location.pathname;
  window.history.replaceState(
    window.history.state,
    '',
    `/${language}${suffix}${window.location.search}${window.location.hash}`,
  );
  if (storedLanguage) persistLanguage(language);
  return language;
}
