import React from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Globe2 } from 'lucide-react';
import { api } from '../api/client';
import { getAccessToken } from '../api/storage';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_META,
  SUPPORTED_LANGUAGES,
  buildLanguageUrl,
  getCurrentLanguage,
  isSupportedLanguage,
  persistLanguage,
  readStoredLanguage,
  type AppLanguage,
} from './config';
import { translateKey, translateLegacyText } from './catalog';

type Values = Record<string, string | number | boolean | null | undefined>;
type I18nValue = {
  language: AppLanguage;
  t: (key: string, values?: Values) => string;
  changeLanguage: (language: AppLanguage) => Promise<void>;
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string, options?: Intl.NumberFormatOptions) => string;
};

const I18nContext = React.createContext<I18nValue | null>(null);

function interpolate(value: string, values?: Values) {
  if (!values) return value;
  return value.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, key: string) => {
    const replacement = values[key];
    return replacement == null ? '' : String(replacement);
  });
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = React.useState<AppLanguage>(() => getCurrentLanguage());
  const checkedAccount = React.useRef(false);
  const hadDevicePreference = React.useRef(Boolean(readStoredLanguage()));

  React.useEffect(() => {
    persistLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = 'ltr';
  }, [language]);

  React.useEffect(() => {
    if (checkedAccount.current || !getAccessToken()) return;
    checkedAccount.current = true;
    api.get('/api/v1/users/me/preferences').then((response) => {
      const preferred = response.data?.preferences?.preferredLanguage;
      if (!isSupportedLanguage(preferred)) return;
      if (hadDevicePreference.current || preferred === language) return;
      persistLanguage(preferred);
      window.location.replace(buildLanguageUrl(preferred));
    }).catch(() => undefined);
  }, [language]);

  const changeLanguage = React.useCallback(async (next: AppLanguage) => {
    if (!isSupportedLanguage(next)) return;
    persistLanguage(next);
    setLanguage(next);
    if (getAccessToken()) {
      try {
        await api.patch('/api/v1/users/me/preferences', { preferredLanguage: next });
      } catch {
        // URL/localStorage remain authoritative if server persistence is temporarily unavailable.
      }
    }
    window.location.assign(buildLanguageUrl(next));
  }, []);

  const value = React.useMemo<I18nValue>(() => {
    const locale = LANGUAGE_META[language]?.locale ?? LANGUAGE_META[DEFAULT_LANGUAGE].locale;
    return {
      language,
      t: (key, values) => interpolate(translateKey(key, language), values),
      changeLanguage,
      formatDate: (input, options) => {
        const date = input instanceof Date ? input : new Date(input);
        if (Number.isNaN(date.getTime())) return String(input);
        return new Intl.DateTimeFormat(locale, options).format(date);
      },
      formatNumber: (input, options) => new Intl.NumberFormat(locale, options).format(input),
      formatCurrency: (input, currency = 'ETB', options) =>
        new Intl.NumberFormat(locale, { style: 'currency', currency, ...options }).format(input),
    };
  }, [changeLanguage, language]);

  return (
    <I18nContext.Provider value={value}>
      {children}
      <LegacyLocalizationBridge language={language} />
      <HeaderLanguagePortal />
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = React.useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}

export function T({ id, values }: { id: string; values?: Values }) {
  const { t } = useI18n();
  return <>{t(id, values)}</>;
}

type TranslationRecord = { source: string; lastApplied: string };
const textRecords = new WeakMap<Text, TranslationRecord>();
const attributeRecords = new WeakMap<Element, Map<string, TranslationRecord>>();
const ATTRIBUTES = ['placeholder', 'title', 'aria-label'] as const;
const SKIP = '[data-i18n-skip],script,style,code,pre,[contenteditable="true"]';

function translateText(node: Text, language: AppLanguage) {
  if (node.parentElement?.closest(SKIP)) return;
  const current = node.nodeValue ?? '';
  const trimmed = current.trim();
  if (!trimmed) return;
  let record = textRecords.get(node);
  if (!record) {
    record = { source: trimmed, lastApplied: trimmed };
    textRecords.set(node, record);
  } else if (trimmed !== record.lastApplied && trimmed !== record.source) {
    record.source = trimmed;
  }
  const target = language === 'en' ? record.source : translateLegacyText(record.source, language);
  record.lastApplied = target;
  if (target === trimmed) return;
  const leading = current.match(/^\s*/)?.[0] ?? '';
  const trailing = current.match(/\s*$/)?.[0] ?? '';
  node.nodeValue = `${leading}${target}${trailing}`;
}

function translateAttributes(element: Element, language: AppLanguage) {
  if (element.closest(SKIP)) return;
  let records = attributeRecords.get(element);
  if (!records) {
    records = new Map();
    attributeRecords.set(element, records);
  }
  for (const attribute of ATTRIBUTES) {
    const current = element.getAttribute(attribute);
    if (!current) continue;
    let record = records.get(attribute);
    if (!record) {
      record = { source: current, lastApplied: current };
      records.set(attribute, record);
    } else if (current !== record.lastApplied && current !== record.source) {
      record.source = current;
    }
    const target = language === 'en' ? record.source : translateLegacyText(record.source, language);
    record.lastApplied = target;
    if (current !== target) element.setAttribute(attribute, target);
  }
}

function translateTree(root: Node, language: AppLanguage) {
  if (root.nodeType === Node.TEXT_NODE) return translateText(root as Text, language);
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  if (root instanceof Element) translateAttributes(root, language);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) translateText(node as Text, language);
    else translateAttributes(node as Element, language);
  }
}

function LegacyLocalizationBridge({ language }: { language: AppLanguage }) {
  React.useEffect(() => {
    translateTree(document.body, language);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData' || mutation.type === 'attributes') {
          translateTree(mutation.target, language);
        }
        mutation.addedNodes.forEach((node) => translateTree(node, language));
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRIBUTES],
    });
    return () => observer.disconnect();
  }, [language]);
  return null;
}

function HeaderLanguagePortal() {
  const { language, changeLanguage, t } = useI18n();
  const [mount, setMount] = React.useState<HTMLElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let host: HTMLDivElement | null = null;
    let disposed = false;
    const attach = () => {
      if (disposed || host) return;
      const header = document.querySelector('header');
      const actions = header?.querySelector(':scope > div > div:last-child');
      if (!(actions instanceof HTMLElement)) return;
      host = document.createElement('div');
      host.dataset.i18nSkip = 'true';
      host.className = 'relative';
      const notifications = actions.querySelector(':scope > div.relative');
      actions.insertBefore(host, notifications ?? actions.firstChild);
      setMount(host);
    };
    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      disposed = true;
      observer.disconnect();
      host?.remove();
    };
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!mount) return null;
  return createPortal(
    <div ref={rootRef} className="relative" data-i18n-skip="true">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={t('language.change')}
        aria-expanded={open}
      >
        <Globe2 className="h-4 w-4" />
        <span className="hidden sm:inline">{LANGUAGE_META[language].shortLabel}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-[80] w-52 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t('language.select')}
          </div>
          {SUPPORTED_LANGUAGES.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => void changeLanguage(item)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
            >
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold text-foreground">{LANGUAGE_META[item].nativeLabel}</span>
                <span className="text-[11px] text-muted-foreground">{LANGUAGE_META[item].label}</span>
              </span>
              {item === language ? <Check className="h-4 w-4 text-primary" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>,
    mount,
  );
}
